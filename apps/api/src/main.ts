import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

/**
 * Bootstrap the NestJS backend application.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable Cross-Origin Resource Sharing (CORS) for frontend client requests
  app.enableCors({
    origin: true,
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
