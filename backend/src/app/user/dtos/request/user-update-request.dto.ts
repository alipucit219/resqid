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
