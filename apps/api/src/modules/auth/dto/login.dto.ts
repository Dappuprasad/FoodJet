import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { normaliseEmail } from '../../../common/transforms';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo@foodjet.dev' })
  @Transform(normaliseEmail)
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Demo@12345' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(72)
  password!: string;
}
