import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../errors/domain-error';

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = (req.headers['x-request-id'] as string) ?? undefined;

    if (exception instanceof DomainError) {
      res.status(exception.status).json({ error: { code: exception.code, requestId } });
      return;
    }
    if (exception instanceof ZodError) {
      res.status(400).json({ error: { code: 'invalid_request', requestId, issues: exception.issues } });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const code = typeof body === 'string' ? body : (body as any)?.message ?? 'http_error';
      res.status(status).json({ error: { code, requestId } });
      return;
    }

    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: 'error', event: 'unhandled_exception', requestId, error: String(exception) }));
    res.status(500).json({ error: { code: 'internal_error', requestId } });
  }
}
