import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, entity: string, entityId?: string, details?: string, userId?: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        details,
        userId,
      },
    });
  }
}
