import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { toBoolean, trim } from '../../../common/transforms';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class MenuQueryDto {
  @ApiPropertyOptional({ example: 'Street Food' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ example: 'paneer', description: 'Matches name and description' })
  @IsOptional()
  @IsString()
  @Transform(trim)
  @MaxLength(80)
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  vegetarianOnly?: boolean;
}
