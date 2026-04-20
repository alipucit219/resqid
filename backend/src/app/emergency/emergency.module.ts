import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../user/user.entity";
import { MedicalProfile, MedicalProfileSchema } from "./schemas/medical-profile.schema";
import { MedicalSummary, MedicalSummarySchema } from "./schemas/medical-summary.schema";
import { EmergencyContact, EmergencyContactSchema } from "./schemas/emergency-contact.schema";
import { EmergencyAccessToken, EmergencyAccessTokenSchema } from "./schemas/emergency-access-token.schema";
import { PanicAlert, PanicAlertSchema } from "./schemas/panic-alert.schema";
import { PanicAlertDispatch, PanicAlertDispatchSchema } from "./schemas/panic-alert-dispatch.schema";
import { MedicalProfileService } from "./services/medical-profile.service";
import { MedicalSummaryService } from "./services/medical-summary.service";
import { EmergencyContactService } from "./services/emergency-contact.service";
import { EmergencyAccessService } from "./services/emergency-access.service";
import { PanicAlertService } from "./services/panic-alert.service";
import { SmsGatewayService } from "./services/sms-gateway.service";
import { WhatsappService } from "./services/whatsapp.service";
import { MeEmergencyController } from "./controllers/me-emergency.controller";
import { AdminEmergencyController } from "./controllers/admin-emergency.controller";
import { PublicEmergencyController } from "./controllers/public-emergency.controller";
import { SharedModule } from "src/shared/shared.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    AuthModule,
    SharedModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: MedicalProfile.name, schema: MedicalProfileSchema },
      { name: MedicalSummary.name, schema: MedicalSummarySchema },
      { name: EmergencyContact.name, schema: EmergencyContactSchema },
      { name: EmergencyAccessToken.name, schema: EmergencyAccessTokenSchema },
      { name: PanicAlert.name, schema: PanicAlertSchema },
      { name: PanicAlertDispatch.name, schema: PanicAlertDispatchSchema },
    ]),
  ],
  controllers: [
    MeEmergencyController,
    AdminEmergencyController,
    PublicEmergencyController,
  ],
  providers: [
    MedicalProfileService,
    MedicalSummaryService,
    EmergencyContactService,
    EmergencyAccessService,
    PanicAlertService,
    SmsGatewayService,
    WhatsappService,
  ],
})
export class EmergencyModule {}
