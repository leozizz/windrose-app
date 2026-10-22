import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { weatherRouter } from './routes/weather.routes';
import { placesRouter } from './routes/places.routes';

const app = new Hono();

// Global Middlewares
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
  })
);

// Health Check Endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'windrose-edge-api',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes with RPC type preservation
const routes = app
  .route('/api/weather', weatherRouter)
  .route('/api/places', placesRouter);

export type AppType = typeof routes;
export default app;
