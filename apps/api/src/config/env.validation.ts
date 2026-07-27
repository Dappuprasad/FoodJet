import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

const toBoolean = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? ['1', 'true', 'yes'].includes(value.toLowerCase()) : value;

const toNumber = ({ value }: { value: unknown }) =>
  value === undefined || value === '' ? undefined : Number(value);

export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT = 3001;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  DIRECT_DATABASE_URL?: string;

  /**
   * Rejected below 32 characters on purpose. A short secret is the difference
   * between "we use JWTs" and "anyone can mint an admin token".
   */
  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET must be at least 32 characters' })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_TTL = '15m';

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @IsOptional()
  REFRESH_TOKEN_TTL_DAYS = 30;

  /** Comma-separated list of allowed browser origins. */
  @IsString()
  @IsOptional()
  CORS_ORIGINS = 'http://localhost:5173';

  @Transform(toBoolean)
  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED = true;

  /**
   * Multiplier on the simulated kitchen timings. 1 is realistic (minutes);
   * the demo deployment runs at ~40x so a reviewer sees the full lifecycle.
   */
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @IsOptional()
  ORDER_SIMULATION_SPEEDUP = 40;

  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @IsOptional()
  THROTTLE_LIMIT = 120;
}

export function validateEnv(raw: Record<string, unknown>): EnvironmentVariables {
  const config = plainToInstance(EnvironmentVariables, raw, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });

  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Invalid environment configuration:\n  - ${details}`);
  }

  return config;
}
