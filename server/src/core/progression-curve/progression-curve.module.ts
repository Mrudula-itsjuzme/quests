import { Global, Module } from '@nestjs/common';
import { ProgressionCurveRepository } from './progression-curve.repository';

/**
 * The XP→level/tier curve is a pure formula every engine may need to read
 * (Progression owns writing XP, but Achievement/Community/LiveOps all need
 * "what level is this XP" without importing Progression's application
 * services). Global so any engine can inject ProgressionCurveRepository
 * directly, same category as GameClock or CurrencyAmount.
 */
@Global()
@Module({
  providers: [ProgressionCurveRepository],
  exports: [ProgressionCurveRepository],
})
export class ProgressionCurveModule {}
