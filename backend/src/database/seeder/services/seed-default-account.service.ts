import { Injectable } from "@nestjs/common";
import { ConfigService } from "src/config";
import { HashService } from "src/shared/services";
import { Role } from "src/app/auth/enums/role.enum";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "src/app/user/user.entity";

@Injectable()
export class SeedDefaultAccountService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly hashService: HashService,
  ) {}

  async getDefaultAccount() {
    const accountPayload = this.configService.getDefaultAccountPayload();
    return await this.userModel.findOne({
      email: accountPayload.email.toLowerCase(),
      deletedAt: null,
    });
  }

  async seed(): Promise<void> {
    const defaultUser = await this.getDefaultAccount();
    const accountPayload = this.configService.getDefaultAccountPayload();

    if (!defaultUser) {
      await this.userModel.create({
        ...accountPayload,
        email: accountPayload.email.toLowerCase(),
        password: await this.hashService.hashPassword(accountPayload.password),
        role: Role.ADMIN,
      });
    }
  }
}

