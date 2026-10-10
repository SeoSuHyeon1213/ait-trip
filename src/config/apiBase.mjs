export function getApiUrl(base, path, requireRemote = false) {
  if (!path.startsWith('/api/')) throw new Error('지원하지 않는 API 경로예요.');
  const value = (base || '').trim();
  if (!value) {
    if (requireRemote) throw new Error('앱의 API 서버 주소가 설정되지 않았어요.');
    return path;
  }
  let url;
  try { url = new URL(value); } catch { throw new Error('API 서버 주소를 확인해 주세요.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('API 서버의 HTTPS 기본 주소를 입력해 주세요.');
  return new URL(path, url).href;
}
