import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, ip, method, originalUrl } = request;

    return next.handle().pipe(
      tap(() => {
        if (user && user.id) {
          // Fire and forget audit logging
          this.prisma.auditLog.create({
            data: {
              userId: user.id,
              action: method,
              resource: originalUrl,
              ipAddress: ip,
            },
          }).catch(err => {
            console.error('Failed to write audit log:', err);
          });
        }
      }),
    );
  }
}
