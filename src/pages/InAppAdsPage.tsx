import { useInAppAds } from '../hooks/useInAppAds';
import './InAppAdsPage.css';

export function InAppAdsPage({ onBack }: { onBack: () => void }) {
  const interstitial = useInAppAds('ait-ad-test-interstitial-id');
  const rewarded = useInAppAds('ait-ad-test-rewarded-id');
  const ads = [
    { title: '전면형 광고', ad: interstitial },
    { title: '보상형 광고', ad: rewarded },
  ];
  return <>
    <p className="eyebrow brand-label">마음따라 여행</p>
    <h1>광고 테스트</h1>
    <p className="lead">테스트 광고의 표시와 시청 완료를 확인할 수 있어요.</p>
    {!interstitial.isSupported && <p className="sample-note" role="status">현재 환경에서는 광고를 표시할 수 없어요. 앱인토스 콘솔에서 테스트 번들의 QR 코드를 열어 토스 앱에서 확인해 주세요.</p>}
    <div className="iaa-section-list">{ads.map(({ title, ad }) => <section className="iaa-section" key={title}>
      <div className="iaa-section-row">
        <div className="iaa-section-info"><h2 className="iaa-section-title">{title}</h2><p className="iaa-section-desc" role="status">{ad.status === 'unsupported' ? '이 환경에서는 지원하지 않아요.' : ad.status === 'loading' ? '광고를 준비하고 있어요.' : ad.status === 'ready' ? '광고가 준비됐어요.' : ad.status === 'showing' ? '광고를 표시하고 있어요.' : ad.message}</p></div>
        <button type="button" className="iaa-section-button" disabled={!ad.isSupported || ad.status === 'loading' || ad.status === 'showing'} onClick={ad.status === 'error' ? ad.reload : ad.showAd}>{ad.status === 'error' ? '다시 불러오기' : '광고 보기'}</button>
      </div>
      {ad.lastReward && <p className="iaa-reward-message" role="status">보상형 광고 시청 완료를 확인했어요. 테스트 보상: {ad.lastReward.unitType} {ad.lastReward.unitAmount}개</p>}
    </section>)}</div>
    <p className="sample-note">테스트 광고 ID를 사용해요. 실제 서비스 보상은 지급하지 않아요.</p>
    <button type="button" className="secondary-button iaa-back-btn" onClick={onBack}>홈으로 돌아가기</button>
  </>;
}
