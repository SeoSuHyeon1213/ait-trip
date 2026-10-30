import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';

type AdStatus = 'loading' | 'showing';

export function openSavedDestinations({
  adGroupId,
  onStatusChange,
  onComplete,
}: {
  adGroupId: string;
  onStatusChange: (status: AdStatus) => void;
  onComplete: () => void;
}): () => void {
  let finished = false;
  let phase: AdStatus = 'loading';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const subscriptions: (() => void)[] = [];

  function cancel() {
    finished = true;
    clearTimeout(timer);
    for (const unsubscribe of subscriptions.splice(0)) {
      try { unsubscribe(); } catch { /* 해제 실패가 화면 이동을 막지 않게 합니다. */ }
    }
  }

  function complete() {
    if (finished) return;
    cancel();
    onComplete();
  }

  function subscribe(start: () => () => void) {
    const unsubscribe = start();
    // 동기 오류/종료 콜백이 발생해도 구독을 남기지 않습니다.
    if (finished) unsubscribe();
    else subscriptions.push(unsubscribe);
  }

  function startTimeout() {
    clearTimeout(timer);
    timer = setTimeout(complete, 5_000);
  }

  try {
    if (!loadFullScreenAd.isSupported() || !showFullScreenAd.isSupported()) {
      complete();
      return cancel;
    }
    startTimeout();
    subscribe(() => loadFullScreenAd({
      options: { adGroupId },
      onEvent: event => {
        if (finished || phase !== 'loading' || event.type !== 'loaded') return;
        phase = 'showing';
        onStatusChange('showing');
        // 표시 요청에 응답이 없어도 목록 진입이 멈추지 않게 합니다.
        startTimeout();
        try {
          subscribe(() => showFullScreenAd({
            options: { adGroupId },
            onEvent: event => {
              if (finished) return;
              if (event.type === 'dismissed' || event.type === 'failedToShow') complete();
              // 실제 광고가 보인 뒤에는 사용자가 닫을 때까지 기다립니다.
              else if (event.type === 'show' || event.type === 'impression' || event.type === 'clicked') clearTimeout(timer);
            },
            onError: complete,
          }));
        } catch { complete(); }
      },
      onError: () => { if (phase === 'loading') complete(); },
    }));
  } catch { complete(); }

  return cancel;
}
