import { Injectable } from '@nestjs/common';

/**
 * Single source of truth for "now." Every engine reads time through this
 * instead of calling `new Date()` directly, so tests can inject a fixed
 * clock and period calculations (daily/weekly/monthly resets, event
 * windows) stay deterministic and swappable.
 */
@Injectable()
export class GameClock {
  now(): Date {
    return new Date();
  }
}
