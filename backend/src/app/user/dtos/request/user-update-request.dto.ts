import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { lowerCase, trim } from "src/shared/helpers/string";

export class UserUpdateRequestDto {
  @ApiPropertyOptional({
    name: "email",
    type: String,
  })
  @IsOptional()
  @IsNotEmpty({ message: "Email is required" })
  @IsString({ message: "Email must be a valid string" })
  @IsEmail()
  @Transform(({ value }) => trim(lowerCase(value)))
  email?: string;

  @ApiPropertyOptional({
    name: "fullName",
    type: String,
  })
  @IsOptional()
  @IsNotEmpty({ message: "Full Name is required" })
  @IsString({ message: "Full Name should be a String" })
  @Transform(({ value }) => trim(value))
  fullName?: string;

  @ApiPropertyOptional({
    name: "isActive",
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
