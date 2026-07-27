import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  type HealthCheckResult,
  type HealthIndicatorResult,
} from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness and dependency check' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.checkDatabase(),
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }

  /**
   * A trivial round trip rather than a connection-pool inspection. Free-tier
   * Postgres suspends idle instances, and this is what wakes one up before the
   * first real request pays the cold-start.
   */
  private async checkDatabase(): Promise<HealthIndicatorResult> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: { status: 'up', responseTimeMs: Date.now() - startedAt } };
    } catch (error) {
      return {
        database: {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unreachable',
        },
      };
    }
  }
}
