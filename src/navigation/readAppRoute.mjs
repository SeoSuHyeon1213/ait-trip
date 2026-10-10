// Toss feature links open a pathname; in-app navigation also supports legacy hashes.
export function readAppRoute({ pathname = '/', hash = '' }) {
  const path = (hash.startsWith('#/') ? hash.slice(1) : pathname).replace(/\/+$/, '') || '/';
  if (path === '/results') return { page: 'results' };
  if (path === '/saved') return { page: 'saved' };
  if (path.startsWith('/place/') && path.slice(7)) return { page: 'detail', id: path.slice(7) };
  return { page: 'home' };
}
