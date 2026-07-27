import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { authConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';

export interface IssuedRefreshToken {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(authConfig.KEY)
    private readonly config: ConfigType<typeof authConfig>,
  ) {}

  /**
   * Refresh tokens are 384 bits of CSPRNG output, so unlike a password they have
   * no guessable structure. That means a fast SHA-256 digest is the right store:
   * argon2 would be salted per row and therefore unlookupable, and the work
   * factor buys nothing against a value that cannot be brute-forced anyway.
   */
  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(userId: string): Promise<IssuedRefreshToken> {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { tokenHash: this.hash(token), userId, expiresAt },
    });

    return { token, expiresAt };
  }

  /**
   * Validates a presented token and rotates it in one transaction: the old row
   * is revoked and a fresh token issued. A replayed token therefore fails on the
   * second use, which is what makes theft detectable rather than silent.
   */
  async rotate(token: string): Promise<{ userId: string } & IssuedRefreshToken> {
    const tokenHash = this.hash(token);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    });

    if (!existing || existing.revokedAt || existing.expiresAt <= new Date()) {
      // A presented-but-revoked token means the credential leaked. Drop every
      // session for that user rather than just refusing this one request.
      if (existing?.revokedAt) {
        await this.revokeAllForUser(existing.userId);
      }
      throw new UnauthorizedException('Session expired. Please sign in again.');
    }

    const next = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.refreshTtlDays * 24 * 60 * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: existing.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: { tokenHash: this.hash(next), userId: existing.userId, expiresAt },
      }),
    ]);

    return { userId: existing.userId, token: next, expiresAt };
  }

  async revoke(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Housekeeping for expired and long-revoked rows. */
  async pruneExpired(): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return count;
  }

  /** Constant-time compare, exported for tests that assert on token handling. */
  static safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  }
}
