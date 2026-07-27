import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '../../../common/transforms';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Rogan Josh' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'Slow-cooked lamb curry with Kashmiri chillies' })
  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'Description must be at least 10 characters' })
  @MaxLength(400)
  description!: string;

  @ApiProperty({ example: 34000, description: 'Price in paise (34000 = ₹340)' })
  @IsInt({ message: 'Price must be a whole number of paise' })
  @Min(100, { message: 'Price must be at least ₹1' })
  @Max(10_000_000, { message: 'Price must be at most ₹1,00,000' })
  pricePaise!: number;

  @ApiProperty({ example: '/images/rogan-josh.jpg' })
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  imageUrl!: string;

  @ApiProperty({ example: 'Main Course' })
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  category!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isVegetarian!: boolean;

  @ApiProperty({ example: 2, minimum: 0, maximum: 3 })
  @IsInt()
  @Min(0)
  @Max(3)
  spiceLevel!: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(1)
  @Max(180)
  preparationMinutes!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
