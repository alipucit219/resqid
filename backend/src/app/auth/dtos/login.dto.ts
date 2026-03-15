import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { lowerCase, trim } from 'src/shared/helpers/string';

export class LoginDto {
  @ApiProperty({
    name: 'email',
    type: String,
    required: true,
    description: 'Email you used for creating the account'
  })
  @Transform(({ value }) => trim(lowerCase(value)))
  @IsNotEmpty({ message: 'Email is required' })
  @IsString({ message: 'Email must be a valid string' })
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
    type: String,
    required: true,
    description: 'Associated password with the given email'
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password should be a String' })
  @MinLength(8, { message: 'Password must be atleast 8 characters longer' })
  password: string;
}
