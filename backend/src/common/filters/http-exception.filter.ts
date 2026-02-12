import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { type Request, type Response } from 'express';
import { OptimisticLockVersionMismatchError, QueryFailedError } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';

interface HttpExceptionBody {
  message?: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(PinoLogger) private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const body =
        typeof exceptionResponse === 'string' ? null : (exceptionResponse as HttpExceptionBody);

      if (status >= 500) {
        this.logger.error({ requestId, statusCode: status }, exception.message);
      }

      response.status(status).json({
        statusCode: status,
        message: body?.message ?? exceptionResponse,
        error: body?.error ?? exceptionResponse,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (exception instanceof QueryFailedError) {
      const driverError = exception.driverError as Record<string, unknown>;
      const code = typeof driverError.code === 'string' ? driverError.code : '';

      if (code === '23505') {
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: 'A record with the given value already exists',
          error: 'Conflict',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (code === '23503') {
        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          error: 'Bad Request',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      this.logger.error(
        { requestId, err: exception, dbCode: code },
        `Database query failed: ${exception.message}`,
      );
    } else if (exception instanceof OptimisticLockVersionMismatchError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: 'This record has been modified by another user. Please refresh and try again',
        error: 'Optimistic Lock Conflict',
        timestamp: new Date().toISOString(),
      });
      return;
    } else {
      this.logger.error(
        { requestId, err: exception instanceof Error ? exception : undefined },
        `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
      );
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
}
