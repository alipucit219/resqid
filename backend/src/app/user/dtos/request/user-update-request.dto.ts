import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
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
    name: "phoneNumber",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "Phone number should be a string" })
  @Transform(({ value }) => (value ? trim(value) : value))
  @Matches(/^\+?[0-9()\-\s]{7,20}$/, {
    message: "Phone number format is invalid",
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    name: "dateOfBirth",
    type: String,
  })
  @IsOptional()
  @IsDateString({}, { message: "Date of birth must be a valid ISO date" })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    name: "cnic",
    type: String,
    description: "CNIC in 12345-1234567-1 format",
  })
  @IsOptional()
  @IsString({ message: "CNIC should be a string" })
  @Transform(({ value }) => (value ? trim(value) : value))
  @Matches(/^\d{5}-\d{7}-\d{1}$/, {
    message: "CNIC must be in 12345-1234567-1 format",
  })
  cnic?: string;

  @ApiPropertyOptional({
    name: "address",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "Address should be a string" })
  @Transform(({ value }) => (value ? trim(value) : value))
  address?: string;

  @ApiPropertyOptional({
    name: "gender",
    type: String,
  })
  @IsOptional()
  @IsString({ message: "Gender should be a string" })
  @Transform(({ value }) => (value ? trim(lowerCase(value)) : value))
  @IsIn(["male", "female", "other"])
  gender?: string;

  @ApiPropertyOptional({
    name: "isActive",
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
