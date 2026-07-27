import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { trim } from '../../../common/transforms';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'Invalid menu item' })
  menuItemId!: string;

  @ApiProperty({ example: 2, minimum: 1, maximum: 50 })
  @IsInt({ message: 'Quantity must be a whole number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(50, { message: 'Quantity must be at most 50 per dish' })
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Rahul Sharma' })
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(80)
  customerName!: string;

  @ApiProperty({ example: '9876543210' })
  @Transform(trim)
  @Matches(/^[6-9]\d{9}$/, { message: 'Enter a valid 10-digit Indian mobile number' })
  phone!: string;

  @ApiProperty({ example: '42, MG Road, Koramangala, Bangalore 560034' })
  @Transform(trim)
  @IsString()
  @MinLength(10, { message: 'Please enter a complete delivery address' })
  @MaxLength(300)
  addressLine!: string;

  @ApiPropertyOptional({ example: 'Ring the bell twice, gate code 4821' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  deliveryNotes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Add at least one dish to your order' })
  @ArrayMaxSize(50, { message: 'An order can contain at most 50 distinct dishes' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
