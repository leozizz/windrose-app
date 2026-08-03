import { Module } from '@nestjs/common';
import { WeatherModule } from '../weather/weather.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RankingResolver } from './ranking.resolver';

/**
 * Module providing GraphQL resolvers for activity destination ranking.
 */
@Module({
  imports: [WeatherModule, ScoringModule],
  providers: [RankingResolver],
})
export class RankingModule {}
