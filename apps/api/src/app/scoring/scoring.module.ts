import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';

/**
 * Module encapsulating activity scoring business logic.
 */
@Module({
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
