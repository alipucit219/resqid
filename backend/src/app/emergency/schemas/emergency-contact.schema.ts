import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({
  collection: "emergency_contacts",
  timestamps: true,
  versionKey: false,
})
export class EmergencyContact {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ default: null, trim: true, lowercase: true })
  email?: string | null;

  @Prop({ default: null })
  relationship?: string | null;

  @Prop({ default: false })
  isPrimary: boolean;
}

export type EmergencyContactDocument = HydratedDocument<EmergencyContact> & {
  id: string;
};
export const EmergencyContactSchema = SchemaFactory.createForClass(EmergencyContact);

EmergencyContactSchema.virtual("id").get(function () {
  return this._id.toString();
});

EmergencyContactSchema.set("toJSON", {
  virtuals: true,
  transform: (_, ret) => {
    delete ret._id;
    return ret;
  },
});
