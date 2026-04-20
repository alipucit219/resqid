import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { MILLISECONDS_IN_A_DAY } from "src/constants/milliseconds-in-a-day.constant";
import { LoginSession, LoginSessionDocument } from "../entities/login-session.entity";

type CreateLoginSessionPayload = {
  userId: string;
  isAuthenticated?: boolean;
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class LoginSessionService {
  constructor(
    @InjectModel(LoginSession.name)
    private readonly sessionModel: Model<LoginSessionDocument>,
  ) {}

  private toObjectId(id: string) {
    return new Types.ObjectId(id);
  }

  async create(payload: CreateLoginSessionPayload) {
    return await this.sessionModel.create({
      userId: this.toObjectId(payload.userId),
      isAuthenticated: payload.isAuthenticated ?? true,
      ipAddress: payload.ipAddress || null,
      userAgent: payload.userAgent || null,
    });
  }

  async findByIdAndUser(sessionId: string, userId: string) {
    return await this.sessionModel.findOne({
      _id: this.toObjectId(sessionId),
      userId: this.toObjectId(userId),
    });
  }

  async countUserSessions(userId: string) {
    return await this.sessionModel.countDocuments({
      userId: this.toObjectId(userId),
    });
  }

  async deleteSession(id: string) {
    return await this.sessionModel.deleteOne({ _id: this.toObjectId(id) });
  }

  async deleteOtherSessions(userId: string, currentSessionId: string) {
    const response = await this.sessionModel.deleteMany({
      userId: this.toObjectId(userId),
      _id: { $ne: this.toObjectId(currentSessionId) },
    });

    return response.deletedCount ?? 0;
  }

  async deleteExpiredSessions() {
    const today = new Date();
    const MILLISECONDS_IN_A_THIRTY_DAYS = MILLISECONDS_IN_A_DAY * 30;
    const tokensExpectedTimeToLive = new Date(
      today.getTime() - MILLISECONDS_IN_A_THIRTY_DAYS,
    );

    // Get the distinct userIds of expired sessions before deleting them
    const expiredSessions = await this.sessionModel.find(
      { createdAt: { $lt: tokensExpectedTimeToLive } },
      { userId: 1 },
    );
    const affectedUserIds = [
      ...new Set(expiredSessions.map((s) => s.userId.toString())),
    ];

    const response = await this.sessionModel.deleteMany({
      createdAt: { $lt: tokensExpectedTimeToLive },
    });

    // Return affected userIds so the caller can clean up push tokens
    return {
      deletedCount: response.deletedCount ?? 0,
      affectedUserIds,
    };
  }

  async findUsersWithNoSessions(userIds: string[]) {
    const objectIds = userIds.map((id) => new Types.ObjectId(id));
    const usersWithSessions = await this.sessionModel.distinct("userId", {
      userId: { $in: objectIds },
    });
    const usersWithSessionSet = new Set(
      usersWithSessions.map((id) => id.toString()),
    );
    return userIds.filter((id) => !usersWithSessionSet.has(id));
  }
}

