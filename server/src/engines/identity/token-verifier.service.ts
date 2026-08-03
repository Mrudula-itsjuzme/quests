import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

/**
 * Verifies Supabase-issued JWTs against the project's JWKS. Auth Domain does
 * exactly this and nothing else — no profile data, no token issuance.
 */
@Injectable()
export class TokenVerifierService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | null;
  private readonly issuer?: string;
  private readonly audience?: string;

  constructor(private readonly config: ConfigService) {
    const jwksUrl = this.config.get<string>('auth.jwksUrl');
    this.jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;
    this.issuer = this.config.get<string>('auth.issuer');
    this.audience = this.config.get<string>('auth.audience');
  }

  async verify(token: string): Promise<JWTPayload> {
    if (!this.jwks) {
      throw new UnauthorizedException('auth_not_configured');
    }
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });
      return payload;
    } catch {
      throw new UnauthorizedException('invalid_token');
    }
  }
}
