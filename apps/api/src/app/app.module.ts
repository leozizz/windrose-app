import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WeatherModule } from './weather/weather.module';
import { ScoringModule } from './scoring/scoring.module';

@Module({
  imports: [WeatherModule, ScoringModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
