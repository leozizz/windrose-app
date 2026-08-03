import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

let cachedServerlessApp: any;

/**
 * Configure CORS options dynamically based on environment variables.
 */
function getCorsOrigins() {
  const frontendUrl = process.env['FRONTEND_URL'] || process.env['CORS_ORIGIN'];
  if (frontendUrl) {
    return [frontendUrl, 'http://localhost:4200', 'http://localhost:3000'];
  }
  return true;
}

/**
 * Bootstrap NestJS application instance in memory for Vercel Serverless Functions.
 */
async function bootstrapServerless() {
  if (!cachedServerlessApp) {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: getCorsOrigins(),
      credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.init();
    cachedServerlessApp = app.getHttpAdapter().getInstance();
  }
  return cachedServerlessApp;
}

/**
 * Serverless function entry point for Vercel deployment.
 *
 * @param req Incoming HTTP request.
 * @param res Server HTTP response.
 */
export default async function handler(req: any, res: any) {
  const serverlessApp = await bootstrapServerless();
  return serverlessApp(req, res);
}

/**
 * Standalone server boot for local development environment.
 */
if (!process.env['VERCEL']) {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: getCorsOrigins(),
      credentials: true,
    });
    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    
    const port = process.env['PORT'] || 3000;
    await app.listen(port);
    
    Logger.log(
      `🚀 Local API running on: http://localhost:${port}/${globalPrefix}`
    );
    Logger.log(
      `📊 GraphQL Playground available on: http://localhost:${port}/graphql`
    );
  }

  bootstrapLocal();
}
