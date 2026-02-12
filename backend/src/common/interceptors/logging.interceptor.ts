import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import { type Request, type Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${originalUrl} ${String(response.statusCode)} - ${String(Date.now() - now)}ms`,
          );
        },
        error: (error: Error) => {
          this.logger.error(
            `${method} ${originalUrl} - ${String(Date.now() - now)}ms - ${error.message}`,
          );
        },
      }),
    );
  }
}
