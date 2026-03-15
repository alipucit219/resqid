import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({
  collection: "emergency_access_tokens",
  timestamps: true,
  versionKey: false,
})
export class EmergencyAccessToken {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  tokenHash: string;

  @Prop({ required: true })
  lastGeneratedAt: Date;
}

export type EmergencyAccessTokenDocument = HydratedDocument<EmergencyAccessToken> & {
  id: string;
};
export const EmergencyAccessTokenSchema =
  SchemaFactory.createForClass(EmergencyAccessToken);

EmergencyAccessTokenSchema.virtual("id").get(function () {
  return this._id.toString();
});

EmergencyAccessTokenSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});

