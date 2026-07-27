import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }, 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      this.$on('query', (event) => {
        this.logger.debug(`${event.query} (${event.duration}ms)`);
      });
    }

    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Wipes every table in dependency order. Test-only — refuses to run outside
   * NODE_ENV=test so a stray call can never point at a real database.
   */
  async truncateAll(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('truncateAll() is only available when NODE_ENV=test');
    }

    await this.$transaction([
      this.orderStatusEvent.deleteMany(),
      this.orderItem.deleteMany(),
      this.order.deleteMany(),
      this.refreshToken.deleteMany(),
      this.menuItem.deleteMany(),
      this.user.deleteMany(),
    ]);
  }
}
