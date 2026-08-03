import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthContext } from '../auth-context';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthContext => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.identity) throw new Error('CurrentUser decorator used outside AuthGuard');
  return req.identity;
});
