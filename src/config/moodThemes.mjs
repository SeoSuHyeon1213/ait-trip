// 화면 설명, API 필터, 추천 이유가 같은 테마 규칙을 사용합니다.
export const moodThemes = {
  rest: { label: '자연 속에서 쉬어가기', description: '자연공원·휴양림·정원에서 천천히', filters: { lclsSystm1: 'NA', lclsSystm2: 'NA04' }, reason: '자연공원·휴양림·정원을 둘러보는 여유로운 여행 테마로 골랐어요.' },
  refresh: { label: '물가에서 기분 전환', description: '바다·강·호수의 새로운 풍경 만나기', filters: { lclsSystm1: 'NA', lclsSystm2: 'NA02' }, reason: '바다·강·호수의 풍경을 만나는 여행 테마로 골랐어요.' },
  explore: { label: '문화와 지식 발견하기', description: '박물관·미술관·과학관에서 새로운 발견', filters: { lclsSystm1: 'VE', lclsSystm2: 'VE07' }, reason: '전시와 문화를 둘러보며 새로운 것을 발견하는 여행 테마로 골랐어요.' },
  together: { label: '함께 즐기는 하루', description: '테마파크·동물원·수족관에서 함께', filters: { lclsSystm1: 'VE', lclsSystm2: 'VE02' }, reason: '테마파크·동물원·수족관처럼 함께 구경하고 즐기는 여행 테마로 골랐어요.' },
};
export function matchesMoodTheme(item, mood) {
  const theme = moodThemes[mood];
  return !!theme && Object.entries(theme.filters).every(([key, value]) => item[key] === value);
}
