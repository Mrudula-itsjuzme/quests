import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../identity/guards/auth.guard';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { AuthContext } from '../../identity/auth-context';
import { LeaderboardService } from '../application/leaderboard.service';

@UseGuards(AuthGuard)
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  async top(@Query('limit') limit?: string) {
    return this.leaderboard.top(limit ? Math.min(200, parseInt(limit, 10)) : 50);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthContext) {
    return this.leaderboard.rankOf(user.userId);
  }
}
