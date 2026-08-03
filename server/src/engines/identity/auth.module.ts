import { Module } from '@nestjs/common';
import { TokenVerifierService } from './token-verifier.service';
import { AuthGuard } from './guards/auth.guard';

@Module({
  providers: [TokenVerifierService, AuthGuard],
  exports: [TokenVerifierService, AuthGuard],
})
export class AuthModule {}
