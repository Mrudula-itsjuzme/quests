import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenVerifierService } from '../token-verifier.service';
import { AuthContext } from '../auth-context';

declare module 'express' {
  interface Request {
    identity?: AuthContext;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: TokenVerifierService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('missing_token');
    const token = header.slice('Bearer '.length);

    const devBypassSecret = this.config.get<string>('auth.devBypassSecret');
    if (devBypassSecret && token === devBypassSecret) {
      req.identity = { userId: 'dev-user', isAdmin: true, timezone: 'UTC' };
      return true;
    }

    const payload = await this.tokenVerifier.verify(token) as Record<string, unknown>;
    const appMetadata = payload['app_metadata'] as Record<string, unknown> | undefined;
    req.identity = {
      userId: String(payload.sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
      isAdmin: payload['role'] === 'admin' || appMetadata?.['role'] === 'admin',
      timezone: typeof payload['timezone'] === 'string' ? (payload['timezone'] as string) : 'UTC',
    };
    return true;
  }
}
