import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const compiled = ts.transpileModule(
  readFileSync(new URL('../src/ads/openSavedDestinations.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function setup(t, options = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = { completed: 0, load: 0, show: 0, cleaned: 0, statuses: [] };
  let loadParams;
  let showParams;
  const cleanup = () => { calls.cleaned++; };
  const sdk = {
    loadFullScreenAd: Object.assign(params => {
      calls.load++;
      loadParams = params;
      if (options.throwLoad) throw new Error('load failed');
      if (options.synchronous) params.onEvent({ type: 'loaded' });
      return cleanup;
    }, { isSupported: () => {
      if (options.throwSupport) throw new Error('no bridge');
      return options.loadSupported ?? true;
    } }),
    showFullScreenAd: Object.assign(params => {
      calls.show++;
      showParams = params;
      if (options.throwShow) throw new Error('show failed');
      if (options.synchronous) params.onEvent({ type: 'dismissed' });
      return cleanup;
    }, { isSupported: () => options.showSupported ?? true }),
  };
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: specifier => {
      assert.equal(specifier, '@apps-in-toss/web-framework');
      return sdk;
    },
    setTimeout: (...args) => setTimeout(...args),
    clearTimeout: timer => clearTimeout(timer),
  });
  const cancel = exports.openSavedDestinations({
    adGroupId: 'saved-interstitial',
    onStatusChange: status => calls.statuses.push(status),
    onComplete: () => { calls.completed++; },
  });
  t.after(cancel);
  return { calls, cancel, load: () => loadParams, show: () => showParams };
}

test('saved destinations open only after dismissal, not on impression, click or reward', t => {
  const h = setup(t);
  assert.equal(h.calls.completed, 0);
  h.load().onEvent({ type: 'loaded' });
  assert.equal(h.calls.show, 1);
  assert.equal(h.load().options.adGroupId, h.show().options.adGroupId);
  for (const type of ['requested', 'show', 'impression', 'clicked', 'userEarnedReward']) {
    h.show().onEvent({ type });
    assert.equal(h.calls.completed, 0);
  }
  t.mock.timers.tick(60_000);
  assert.equal(h.calls.completed, 0);
  h.show().onEvent({ type: 'dismissed' });
  assert.equal(h.calls.completed, 1);
  assert.equal(h.calls.cleaned, 2);
});

for (const options of [
  { loadSupported: false }, { showSupported: false }, { throwSupport: true }, { throwLoad: true },
]) {
  test('unsupported environment or load exception opens the list: ' + JSON.stringify(options), t => {
    const h = setup(t, options);
    assert.equal(h.calls.completed, 1);
    assert.equal(h.calls.show, 0);
  });
}

test('load failure opens the list and ignores a late loaded event', t => {
  const h = setup(t);
  h.load().onError(new Error('no fill'));
  h.load().onEvent({ type: 'loaded' });
  assert.equal(h.calls.completed, 1);
  assert.equal(h.calls.show, 0);
  assert.equal(h.calls.cleaned, 1);
});

for (const failure of ['failedToShow', 'onError', 'throw']) {
  test('show failure opens the list once: ' + failure, t => {
    const h = setup(t, { throwShow: failure === 'throw' });
    h.load().onEvent({ type: 'loaded' });
    if (failure === 'onError') h.show().onError(new Error('show error'));
    if (failure === 'failedToShow') h.show().onEvent({ type: failure });
    h.show().onEvent({ type: 'dismissed' });
    assert.equal(h.calls.completed, 1);
  });
}

test('load timeout opens the list without showing a late ad', t => {
  const h = setup(t);
  t.mock.timers.tick(4_999);
  assert.equal(h.calls.completed, 0);
  t.mock.timers.tick(1);
  h.load().onEvent({ type: 'loaded' });
  assert.equal(h.calls.completed, 1);
  assert.equal(h.calls.show, 0);
});

test('an unanswered show request times out even after requested acknowledgement', t => {
  const h = setup(t);
  h.load().onEvent({ type: 'loaded' });
  h.show().onEvent({ type: 'requested' });
  t.mock.timers.tick(5_000);
  h.show().onEvent({ type: 'dismissed' });
  assert.equal(h.calls.completed, 1);
});

test('duplicate SDK callbacks never show a second ad or open twice', t => {
  const h = setup(t);
  h.load().onEvent({ type: 'loaded' });
  h.load().onEvent({ type: 'loaded' });
  h.show().onEvent({ type: 'dismissed' });
  h.show().onError(new Error('late failure'));
  t.mock.timers.tick(10_000);
  assert.equal(h.calls.show, 1);
  assert.equal(h.calls.completed, 1);
});

for (const showing of [false, true]) {
  test('leaving the gate cancels pending navigation: showing=' + showing, t => {
    const h = setup(t);
    if (showing) h.load().onEvent({ type: 'loaded' });
    h.cancel();
    h.load().onEvent({ type: 'loaded' });
    if (showing) h.show().onEvent({ type: 'dismissed' });
    t.mock.timers.tick(10_000);
    assert.equal(h.calls.completed, 0);
    assert.equal(h.calls.show, showing ? 1 : 0);
    assert.equal(h.calls.cleaned, showing ? 2 : 1);
  });
}

test('synchronous SDK callbacks also clean up both subscriptions', t => {
  const h = setup(t, { synchronous: true });
  assert.equal(h.calls.completed, 1);
  assert.equal(h.calls.cleaned, 2);
  t.mock.timers.tick(10_000);
  assert.equal(h.calls.completed, 1);
});
