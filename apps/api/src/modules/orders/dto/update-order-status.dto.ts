import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ORDER_STATUSES, type OrderStatus } from '@foodjet/shared';

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ORDER_STATUSES })
  @IsIn(ORDER_STATUSES as readonly string[], {
    message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
  })
  status!: OrderStatus;

  @ApiPropertyOptional({ example: 'Rider delayed by traffic on Hosur Road' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
