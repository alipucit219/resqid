import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  token?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: "123456" })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: "Code must be 6 digits." })
  code?: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password should be a String" })
  @MinLength(8, { message: "Password must be atleast 8 characters longer" })
  newPassword: string;
}
