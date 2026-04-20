import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Role } from "../auth/enums/role.enum";

@Schema({
  collection: "users",
  timestamps: true,
  versionKey: false,
})
export class User {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ default: null, trim: true })
  phoneNumber?: string | null;

  @Prop({ default: null, trim: true })
  cnic?: string | null;

  @Prop({ default: null, trim: true })
  address?: string | null;

  @Prop({ default: null })
  dateOfBirth?: Date | null;

  @Prop({ default: null, trim: true, lowercase: true })
  gender?: string | null;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String, enum: Object.values(Role), default: Role.USER })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] ,select: false})
  expoPushTokens: string[];

  @Prop({ select: false, default: null })
  resetTokenHash?: string | null;

  @Prop({ select: false, default: null })
  resetTokenExpiry?: Date | null;

  @Prop({ default: null })
  deletedAt?: Date | null;
}

export type UserDocument = HydratedDocument<User> & { id: string };
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual("id").get(function () {
  return this._id.toString();
});

UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});
