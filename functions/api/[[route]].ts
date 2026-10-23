import { handle } from 'hono/cloudflare-pages';
import app from '../../apps/edge-api/src/index';

export const onRequest = handle(app);
