import type { Destination } from '../domain/models/Destination';

// 여권 창을 위한 장식용 벡터 일러스트입니다. 실제 여행지 사진이 아닙니다.
export function Scenery({ scene, theme = '' }: { scene: Destination['scene']; theme?: string }) {
  const beach = /해변|해수욕장|바다/.test(theme) || scene === 'sea';
  const coast = /해안|절경|채석강|주상절리/.test(theme);
  const observatory = /천문|스페이스|과학/.test(theme);
  const culture = scene === 'city' && !observatory;
  return <svg className={`scenery scenery-${scene}`} viewBox="0 0 240 300" preserveAspectRatio="xMidYMid slice" fill="none" aria-hidden="true">
    <rect width="240" height="300" fill={beach ? '#c4e5f3' : culture ? '#d8e9ee' : '#8cc8ee'} />
    {beach ? <>
      <path d="M0 155h240v145H0Z" fill="#3c91bf" /><path d="M0 238h240v62H0Z" fill="#eadbb8" />
      <circle cx="121" cy="200" r="39" stroke="#315bd7" strokeWidth="13" /><path d="M96 239h52v14H96Z" fill="#d0dbe9" />
    </> : coast ? <>
      <path d="M0 142Q51 72 112 86t128 30v184H0Z" fill="#3d8050" />
      <path d="M0 206h240v36H0Z" fill="#8e7d60" /><path d="M0 242h240v58H0Z" fill="#e9e5d8" />
    </> : observatory ? <>
      <path d="M0 172Q61 104 132 135t108-12v177H0Z" fill="#427d4d" /><path d="M0 226h240v74H0Z" fill="#73956a" />
      <path d="M73 158h110v68H73Z" fill="#8fb5ad" /><path d="M36 194a36 36 0 0 1 72 0Z" fill="#b5d3c3" />
    </> : culture ? <>
      <path d="M0 246h240v54H0Z" fill="#b2c4a7" /><path d="M31 147h178v99H31Z" fill="#eee7d7" />
      <path d="m20 147 100-55 100 55H20Z" fill="#687e7a" />
      {[53, 93, 133, 173].map(x => <path key={x} d={`M${x} 163h15v83H${x}Z`} fill="#a5b3a8" />)}
    </> : <>
      <path d="M0 0h240v300H0Z" fill="#a8d59b" />
      <circle cx="28" cy="76" r="72" fill="#518f48" /><circle cx="207" cy="63" r="78" fill="#3d773e" />
      <path d="M32 110h14v190H32ZM187 104h15v196h-15Z" fill="#84623c" />
      <path d="M0 228q60-32 120-2t120-2v76H0Z" fill="#8ab77a" />
      <path d="M90 300q38-48 50-84h22q-19 49-3 84Z" fill="#e6ddbd" />
      {scene === 'garden' && <><circle cx="64" cy="247" r="7" fill="#e8b4aa" /><circle cx="185" cy="236" r="8" fill="#f4d588" /></>}
    </>}
  </svg>;
}
