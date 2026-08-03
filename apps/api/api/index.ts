import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';

let cachedServerlessApp: any;

/**
 * Helper to retrieve dynamic allowed origins for CORS.
 */
function getCorsOrigins() {
  const frontendUrl = process.env['FRONTEND_URL'] || process.env['CORS_ORIGIN'];
  if (frontendUrl) {
    // Sanitize trailing slash if present
    const cleanUrl = frontendUrl.replace(/\/$/, '');
    return [cleanUrl, `${cleanUrl}/`, 'http://localhost:4200', 'http://localhost:3000'];
  }
  return true;
}

/**
 * Bootstrap NestJS application instance in memory for Vercel Serverless Function.
 */
async function bootstrapServerless() {
  if (!cachedServerlessApp) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: getCorsOrigins(),
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: [
        'Content-Type',
        'Accept',
        'Authorization',
        'apollo-require-preflight',
        'x-apollo-operation-name',
      ],
      credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.init();
    cachedServerlessApp = app.getHttpAdapter().getInstance();
  }
  return cachedServerlessApp;
}

/**
 * Native Vercel Serverless Function Handler entry point.
 *
 * @param req Incoming HTTP request.
 * @param res Server HTTP response.
 */
export default async function handler(req: any, res: any) {
  const serverlessApp = await bootstrapServerless();
  return serverlessApp(req, res);
}
