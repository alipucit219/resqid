import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class MedicalSummaryEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doctorName?: string;

  @ApiPropertyOptional({ minimum: 1900 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  diseaseStartingYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  treatmentDuration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  treatmentStatus?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/\.pdf([?#].*)?$/i, {
    each: true,
    message: "Checkup files must be PDF files (.pdf).",
  })
  checkupFiles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpsertMedicalSummaryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  doctorName?: string;

  @ApiPropertyOptional({ minimum: 1900 })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  diseaseStartingYear?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  treatmentDuration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  treatmentStatus?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currentMedications?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Matches(/\.pdf([?#].*)?$/i, {
    each: true,
    message: "Checkup files must be PDF files (.pdf).",
  })
  checkupFiles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [MedicalSummaryEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalSummaryEntryDto)
  entries?: MedicalSummaryEntryDto[];
}
