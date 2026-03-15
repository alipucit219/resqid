import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { PaginationDto } from "src/shared/DTOs";
import { trim } from "src/shared/helpers/string";
import { Role } from "src/app/auth/enums/role.enum";

export class UserListAllRequestDto extends PaginationDto {
  @ApiPropertyOptional({ name: "name" })
  @Transform(({ value }) => trim(value))
  name?: string;

  @ApiPropertyOptional({ name: "role", enum: Object.values(Role) })
  role?: Role;
}
