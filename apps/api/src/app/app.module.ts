import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherModule } from './weather/weather.module';
import { ScoringModule } from './scoring/scoring.module';
import { RankingModule } from './ranking/ranking.module';

/**
 * Root NestJS application module configured with GraphQL Apollo Driver.
 * Uses in-memory autoSchemaFile (autoSchemaFile: true) to support read-only Serverless environments.
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    WeatherModule,
    ScoringModule,
    RankingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
