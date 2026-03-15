import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  UserCreateRequestDto,
  UserListAllRequestDto,
  UserUpdateRequestDto,
} from "./dtos";
import { UserService } from "./user.service";
import { AuthenticatedRequestPayload, Roles } from "src/shared/decorators";
import { IAuthenticatedRequest } from "src/shared/interfaces";
import { Role } from "../auth/enums/role.enum";

@ApiBearerAuth()
@ApiTags("User Management")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.ADMIN)
  @ApiOperation({ description: "Create a new user" })
  @Post()
  async create(@Body() body: UserCreateRequestDto) {
    const data = await this.userService.addNew(body);
    return {
      data,
      message: "User created successfully",
    };
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ description: "Update an existing user" })
  @Put(":id")
  async update(
    @Body() payload: UserUpdateRequestDto,
    @Param("id") id: string,
  ) {
    const data = await this.userService.updateExisting(id, payload);
    return {
      data,
      message: "User updated successfully",
    };
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ description: "List all users" })
  @Get()
  async listAll(
    @Query() query: UserListAllRequestDto,
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
  ) {
    return await this.userService.listAll(query, req.user.id);
  }

  @ApiOperation({ description: "Get requesting user" })
  @Get("me")
  async getMe(@AuthenticatedRequestPayload() req: IAuthenticatedRequest) {
    return req.user;
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ description: "Single user detail" })
  @Get(":id")
  async getSingleUserDetail(@Param("id") id: string) {
    return await this.userService.getSingleUserDetail(id);
  }

  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Remove an existing user" })
  @Delete(":id")
  async delete(
    @Param("id") id: string,
    @AuthenticatedRequestPayload() req: IAuthenticatedRequest,
  ) {
    if (req.user.id === id) {
      throw new BadRequestException("You can't delete your own account.");
    }

    return await this.userService.delete(id);
  }
}
