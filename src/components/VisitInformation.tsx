import { isBrowserBuild } from '../config/runtime';
import { useState } from 'react';
import { Clipboard, SetClipboardTextPermissionError } from '@apps-in-toss/web-framework';
import type { Destination } from '../domain/models/Destination';

export function VisitInformation({ place, isSample }: { place: Destination; isSample: boolean }) {
  const [copying, setCopying] = useState(false);
  const [notice, setNotice] = useState('');

  async function copyAddress() {
    if (!place.address || copying) return;
    setCopying(true);
    setNotice('');
    try {
      if (isBrowserBuild) await navigator.clipboard.writeText(place.address);
      else await Clipboard.setText(place.address);
      setNotice('주소를 복사했어요.');
    } catch (error) {
      setNotice(error instanceof SetClipboardTextPermissionError
        ? '주소를 복사하려면 클립보드 권한을 허용해 주세요. 주소를 길게 눌러 직접 복사할 수도 있어요.'
        : '주소를 복사하지 못했어요. 다시 시도하거나 주소를 길게 눌러 복사해 주세요.');
    } finally {
      setCopying(false);
    }
  }

  const info = place.visitInfo;
  return <section className="info-box">
    <h2>방문 정보</h2>
    <dl className="visit-information">
      <div><dt>주소</dt><dd className="place-address">{place.address || '주소 정보가 아직 제공되지 않았어요.'}</dd>
        {place.address && <button className="secondary-button copy-address" type="button" disabled={copying} onClick={() => void copyAddress()}>{copying ? '복사 중…' : '주소 복사'}</button>}
      </div>
      {info && <>
        <div><dt>이용시간</dt><dd className="tour-text">{info.hours || '미제공'}</dd></div>
        <div><dt>요금</dt><dd className="tour-text">{info.fee || '미제공'}</dd></div>
        <div><dt>쉬는 날</dt><dd className="tour-text">{info.closedDays || '미제공'}</dd></div>
        <div><dt>문의</dt><dd className="tour-text">{info.phone || '미제공'}</dd></div>
      </>}
    </dl>
    {!info && <p className="sample-note">{isSample ? '샘플 데이터에는 운영 정보가 없어요.' : '운영 정보가 아직 제공되지 않았어요.'}</p>}
    <p className="copy-notice" role="status" aria-live="polite">{notice}</p>
  </section>;
}
