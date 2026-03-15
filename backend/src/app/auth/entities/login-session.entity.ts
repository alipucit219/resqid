import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({
  collection: "login_sessions",
  timestamps: true,
  versionKey: false,
})
export class LoginSession {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  isAuthenticated: boolean;

  @Prop({ default: null })
  ipAddress?: string | null;

  @Prop({ default: null })
  userAgent?: string | null;
}

export type LoginSessionDocument = HydratedDocument<LoginSession> & {
  id: string;
};
export const LoginSessionSchema = SchemaFactory.createForClass(LoginSession);

LoginSessionSchema.virtual("id").get(function () {
  return this._id.toString();
});

LoginSessionSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});

