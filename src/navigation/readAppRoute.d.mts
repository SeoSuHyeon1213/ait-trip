export type AppRoute = { page: 'home' | 'results' | 'saved' } | { page: 'detail'; id: string };
export function readAppRoute(location: { pathname?: string; hash?: string }): AppRoute;
