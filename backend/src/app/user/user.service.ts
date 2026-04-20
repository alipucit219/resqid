import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { HashService } from "src/shared/services";
import {
  UserCreateRequestDto,
  UserListAllRequestDto,
  UserUpdateRequestDto,
} from "./dtos";
import { User, UserDocument } from "./user.entity";
import { Role } from "../auth/enums/role.enum";
import { UserWithoutPassword } from "./user.types";

type SelfRegistrationPayload = {
  email: string;
  fullName: string;
  password: string;
  phoneNumber: string;
  cnic: string;
  address: string;
  dateOfBirth: string;
  gender: string;
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly hashService: HashService,
  ) {}

  private toObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("Invalid user id.");
    }

    return new Types.ObjectId(id);
  }

  private sanitizeUser(user: UserDocument): UserWithoutPassword {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber ?? null,
      cnic: user.cnic ?? null,
      address: user.address ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      gender: user.gender ?? null,
      isActive: user.isActive,
      role: user.role,
    };
  }

  async findByEmail(email: string, includePassword = false) {
    const query = this.userModel.findOne({
      email: email.trim().toLowerCase(),
      deletedAt: null,
    });

    if (includePassword) {
      query.select("+password +resetTokenHash +resetTokenExpiry");
    }

    return await query.exec();
  }

  async findById(id: string, includePassword = false) {
    const query = this.userModel.findOne({
      _id: this.toObjectId(id),
      deletedAt: null,
    });

    if (includePassword) {
      query.select("+password +resetTokenHash +resetTokenExpiry");
    }

    return await query.exec();
  }

  async findByIdOrThrowException(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async addNew(body: UserCreateRequestDto) {
    const existing = await this.findByEmail(body.email, false);
    if (existing) {
      throw new BadRequestException(
        "User with the given email already exists.",
      );
    }

    const plainPassword = "Pakistan1";
    const encryptedPassword = await this.hashService.hashPassword(plainPassword);

    const user = await this.userModel.create({
      email: body.email.trim().toLowerCase(),
      fullName: body.fullName.trim(),
      password: encryptedPassword,
      role: body.role || Role.USER,
      phoneNumber: body.phoneNumber ?? null,
      cnic: body.cnic ? body.cnic.trim() : null,
      address: body.address ? body.address.trim() : null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      gender: body.gender ?? null,
      isActive: body.isActive ?? true,
      deletedAt: null,
    });

    return {
      ...this.sanitizeUser(user),
      initialPassword: plainPassword,
    };
  }

  async createSelfRegisteredUser(payload: SelfRegistrationPayload) {
    const existing = await this.findByEmail(payload.email, false);
    if (existing) {
      throw new BadRequestException(
        "User with the given email already exists.",
      );
    }

    const encryptedPassword = await this.hashService.hashPassword(payload.password);

    return await this.userModel.create({
      email: payload.email.trim().toLowerCase(),
      fullName: payload.fullName.trim(),
      password: encryptedPassword,
      role: Role.USER,
      phoneNumber: payload.phoneNumber.trim(),
      cnic: payload.cnic.trim(),
      address: payload.address.trim(),
      dateOfBirth: new Date(payload.dateOfBirth),
      gender: payload.gender.trim().toLowerCase(),
      isActive: true,
      deletedAt: null,
    });
  }

  async listAll(query: UserListAllRequestDto, requestingUserId?: string) {
    const page = Number(query.page ?? 0);
    const limit = Number(query.limit ?? 10);
    const skip = page * limit;

    const where: FilterQuery<UserDocument> = {
      deletedAt: null,
    };

    if (requestingUserId && Types.ObjectId.isValid(requestingUserId)) {
      where._id = { $ne: new Types.ObjectId(requestingUserId) };
    }

    if (query.name) {
      where.fullName = {
        $regex: query.name,
        $options: "i",
      };
    }

    if (query.role) {
      where.role = query.role;
    }

    const [data, total] = await Promise.all([
      this.userModel.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.userModel.countDocuments(where),
    ]);

    return {
      data: data.map((user) => this.sanitizeUser(user)),
      total,
    };
  }

  async updateExisting(id: string, payload: UserUpdateRequestDto) {
    const user = await this.findByIdOrThrowException(id);

    if (Object.prototype.hasOwnProperty.call(payload as object, "role")) {
      throw new BadRequestException("Role is not editable.");
    }

    if (payload.email && payload.email.toLowerCase() !== user.email) {
      const existing = await this.findByEmail(payload.email);
      if (existing && existing.id !== user.id) {
        throw new BadRequestException("User with the given email already exists.");
      }
      user.email = payload.email.trim().toLowerCase();
    }

    if (payload.fullName !== undefined) {
      user.fullName = payload.fullName.trim();
    }

    if (payload.phoneNumber !== undefined) {
      user.phoneNumber = payload.phoneNumber.trim();
    }

    if (payload.cnic !== undefined) {
      user.cnic = payload.cnic.trim();
    }

    if (payload.address !== undefined) {
      user.address = payload.address.trim();
    }

    if (payload.dateOfBirth !== undefined) {
      user.dateOfBirth = new Date(payload.dateOfBirth);
    }

    if (payload.gender !== undefined) {
      user.gender = payload.gender.trim().toLowerCase();
    }

    if (payload.isActive !== undefined) {
      user.isActive = payload.isActive;
    }

    await user.save();
    return this.sanitizeUser(user);
  }

  async getSingleUserDetail(id: string) {
    const user = await this.findByIdOrThrowException(id);
    return this.sanitizeUser(user);
  }

  async delete(id: string) {
    const user = await this.findByIdOrThrowException(id);
    user.deletedAt = new Date();
    user.email = `${user.email}.deleted.${Date.now()}`;
    await user.save();
    return { message: "User deleted successfully." };
  }

  async save(user: UserDocument) {
    await user.save();
    return user;
  }

  async setResetToken(id: string, tokenHash: string, expiry: Date) {
    const user = await this.findById(id, true);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    user.resetTokenHash = tokenHash;
    user.resetTokenExpiry = expiry;
    await user.save();
  }

  async clearResetToken(id: string) {
    const user = await this.findById(id, true);
    if (!user) {
      return;
    }
    user.resetTokenHash = null;
    user.resetTokenExpiry = null;
    await user.save();
  }

  async addExpoPushToken(userId: string, expoPushToken: string) {
    // Remove the token from any other user who has it (device-switching scenario)
    await this.userModel.updateMany(
      {
        _id: { $ne: this.toObjectId(userId) },
        expoPushTokens: expoPushToken,
      },
      { $pull: { expoPushTokens: expoPushToken } },
    );

    return await this.userModel.findByIdAndUpdate(
      this.toObjectId(userId),
      { $addToSet: { expoPushTokens: expoPushToken } },
      { new: true },
    );
  }

  async removeExpoPushToken(userId: string, expoPushToken: string) {
    return await this.userModel.findByIdAndUpdate(
      this.toObjectId(userId),
      { $pull: { expoPushTokens: expoPushToken } },
      { new: true },
    );
  }

  async clearAllExpoPushTokens(userId: string) {
    return await this.userModel.findByIdAndUpdate(
      this.toObjectId(userId),
      { $set: { expoPushTokens: [] } },
      { new: true },
    );
  }

  async clearExpoPushTokensForUsers(userIds: string[]) {
    const objectIds = userIds.map((id) => this.toObjectId(id));
    return await this.userModel.updateMany(
      { _id: { $in: objectIds } },
      { $set: { expoPushTokens: [] } },
    );
  }

  async findByResetTokenHash(tokenHash: string) {
    return await this.userModel
      .findOne({
        resetTokenHash: tokenHash,
        deletedAt: null,
      })
      .select("+password +resetTokenHash +resetTokenExpiry")
      .exec();
  }
}
