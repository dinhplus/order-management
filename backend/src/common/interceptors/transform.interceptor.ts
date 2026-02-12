import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { type Observable, map } from 'rxjs';
import { type Response } from 'express';

export interface ResponseEnvelope<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((data: T) => ({
        data,
        statusCode: context.switchToHttp().getResponse<Response>().statusCode,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
