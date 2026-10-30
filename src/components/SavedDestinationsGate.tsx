import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { openSavedDestinations } from '../ads/openSavedDestinations';

const SAVED_INTERSTITIAL_AD_GROUP_ID = import.meta.env.VITE_SAVED_INTERSTITIAL_AD_GROUP_ID?.trim() || 'ait-ad-test-interstitial-id';

function SavedDestinationsAd({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const [status, setStatus] = useState<'loading' | 'showing'>('loading');

  useEffect(() => {
    let cancel: (() => void) | undefined;
    // StrictMode의 사전 정리에서는 광고 요청을 시작하지 않습니다.
    const timer = setTimeout(() => {
      cancel = openSavedDestinations({
        adGroupId: SAVED_INTERSTITIAL_AD_GROUP_ID,
        onStatusChange: setStatus,
        onComplete,
      });
    }, 0);
    return () => { clearTimeout(timer); cancel?.(); };
  }, [onComplete]);

  return <div className="ad-gate-content">
    <p className="eyebrow brand-label">나의 여행 목록</p>
    <h1 tabIndex={-1}>찜한 여행지를 열고 있어요</h1>
    <p className="lead">전면 광고를 닫으면 찜한 여행지로 이동해요.</p>
    <p role="status" className="empty-state">{status === 'loading' ? '광고를 준비하고 있어요.' : '광고를 표시하고 있어요.'}</p>
    <button className="secondary-button" type="button" onClick={onBack}>홈으로 돌아가기</button>
  </div>;
}

export function SavedDestinationsGate({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const complete = useCallback(() => setIsOpen(true), []);

  return isOpen ? children : <SavedDestinationsAd onComplete={complete} onBack={onBack} />;
}
