import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../identity/guards/auth.guard';
import { CurrentUser } from '../../identity/decorators/current-user.decorator';
import { AuthContext } from '../../identity/auth-context';
import { PlayerProfileService } from '../application/player-profile.service';
import { UpdateProfileDto } from './dto';

@UseGuards(AuthGuard)
@Controller('me')
export class ProfileController {
  constructor(private readonly profiles: PlayerProfileService) {}

  @Get()
  getMe(@CurrentUser() user: AuthContext) {
    return this.profiles.getMe(user);
  }

  @Patch()
  updateMe(@CurrentUser() user: AuthContext, @Body() body: UpdateProfileDto) {
    return this.profiles.updateMe(user, body);
  }
}
