import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

/**
 * Retrieve dynamic allowed origins for CORS.
 */
function getCorsOrigins() {
  const frontendUrl = process.env['FRONTEND_URL'] || process.env['CORS_ORIGIN'];
  if (frontendUrl) {
    const cleanUrl = frontendUrl.replace(/\/$/, '');
    return [cleanUrl, `${cleanUrl}/`, 'http://localhost:4200', 'http://localhost:3000'];
  }
  return true;
}

/**
 * Bootstrap standalone NestJS backend application for production/container environments.
 */
async function bootstrap() {
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
    `🚀 API application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📊 GraphQL Playground available on: http://localhost:${port}/graphql`
  );
}

bootstrap();
