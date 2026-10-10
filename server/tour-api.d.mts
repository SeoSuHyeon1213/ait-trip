import type { IncomingMessage, ServerResponse } from 'node:http';
export function createApiHandler(config: Record<string, string | undefined>): (req: IncomingMessage, res: ServerResponse, next?: () => void) => Promise<void | false>;
