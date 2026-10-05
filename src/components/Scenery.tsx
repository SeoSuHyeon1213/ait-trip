import type { Destination } from '../data/destinations';

// 직접 작성한 장식용 SVG입니다. 여행지의 실제 사진이 아닙니다.
export function Scenery({ scene }: { scene: Destination['scene'] }) {
  return (
    <svg className={`scenery scenery-${scene}`} viewBox="0 0 400 180" fill="none" aria-hidden="true">
      <rect width="400" height="180" fill="var(--scene-sky)" />
      <circle cx="308" cy="46" r="22" fill="var(--scene-sun)" />
      {scene === 'sea' ? <>
        <path d="M0 100Q100 85 200 100T400 100V180H0Z" fill="var(--scene-back)" />
        <path d="M0 130Q90 110 190 133T400 130V180H0Z" fill="var(--scene-front)" />
        <path d="M0 160Q130 138 260 162T400 160V180H0Z" fill="var(--scene-land)" />
      </> : scene === 'city' ? <>
        <path d="M0 135Q100 75 200 125T400 115V180H0Z" fill="var(--scene-back)" />
        <path d="M60 100H180V160H60Z M225 112H335V160H225Z" fill="var(--scene-land)" />
        <path d="M43 100L120 65L197 100Z M210 112L280 78L350 112Z" fill="var(--scene-front)" />
        <path d="M104 124H136V160H104Z M264 130H295V160H264Z" fill="var(--scene-back)" />
      </> : <>
        <path d="M0 125Q75 55 155 110T300 100T400 115V180H0Z" fill="var(--scene-back)" />
        <path d="M0 155Q95 105 210 145T400 130V180H0Z" fill="var(--scene-front)" />
        {[48, 105, 310, 355].map((x, i) => <g key={x}>
          <path d={`M${x} 155V${70 + i * 9}`} stroke="var(--scene-land)" strokeWidth="5" />
          <ellipse cx={x} cy={85 + i * 9} rx="22" ry="32" fill="var(--scene-land)" />
        </g>)}
        <path d="M170 180Q205 143 226 119H242Q214 150 231 180Z" fill="var(--scene-sky)" />
      </>}
    </svg>
  );
}
