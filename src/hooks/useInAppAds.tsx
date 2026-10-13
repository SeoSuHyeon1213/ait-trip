import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useRef, useState } from 'react';

type AdStatus = 'unsupported' | 'loading' | 'ready' | 'showing' | 'error';
interface Reward { unitType: string; unitAmount: number }

export function useInAppAds(adGroupId: string) {
  const [isSupported] = useState(() => {
    try { return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported(); }
    catch { return false; }
  });
  const [status, setStatus] = useState<AdStatus>(isSupported ? 'loading' : 'unsupported');
  const [message, setMessage] = useState('');
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const loadCleanup = useRef<(() => void) | null>(null);
  const showCleanup = useRef<(() => void) | null>(null);
  const active = useRef(false);
  const showing = useRef(false);

  const load = useCallback(() => {
    if (!isSupported) return;
    loadCleanup.current?.();
    setStatus('loading');
    setMessage('');
    try {
      loadCleanup.current = loadFullScreenAd({
        options: { adGroupId },
        onEvent: event => { if (active.current && event.type === 'loaded') setStatus('ready'); },
        onError: () => {
          if (!active.current) return;
          setStatus('error');
          setMessage('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        },
      });
    } catch {
      setStatus('error');
      setMessage('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  }, [adGroupId, isSupported]);

  useEffect(() => {
    active.current = true;
    // 초기 상태는 loading이며, 다음 작업에서 광고를 준비합니다.
    const timer = setTimeout(load, 0);
    return () => {
      active.current = false;
      clearTimeout(timer);
      loadCleanup.current?.();
      showCleanup.current?.();
    };
  }, [load]);

  const showAd = useCallback(() => {
    if (!isSupported || status !== 'ready' || showing.current) return;
    showing.current = true;
    setStatus('showing');
    setLastReward(null);
    setMessage('');
    const fail = () => {
      showing.current = false;
      if (!active.current) return;
      setStatus('error');
      setMessage('광고를 표시하지 못했어요. 다시 불러와 주세요.');
    };
    try {
      showCleanup.current?.();
      showCleanup.current = showFullScreenAd({
        options: { adGroupId },
        onEvent: event => {
          if (!active.current) return;
          if (event.type === 'userEarnedReward') setLastReward(event.data);
          if (event.type === 'dismissed') { showing.current = false; load(); }
          if (event.type === 'failedToShow') fail();
        },
        onError: fail,
      });
    } catch { fail(); }
  }, [adGroupId, isSupported, status, load]);

  return { isSupported, isAdLoaded: status === 'ready', status, message, showAd, reload: load, lastReward };
}
