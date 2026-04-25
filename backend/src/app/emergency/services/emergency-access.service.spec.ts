import { Types } from "mongoose";
import { EmergencyAccessService } from "./emergency-access.service";

describe("EmergencyAccessService", () => {
  it("does not rotate token on GET /me/qr when active token exists", async () => {
    const userId = new Types.ObjectId().toString();
    const generatedAt = new Date("2026-03-15T12:00:00.000Z");

    const tokenModel = {
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          userId,
          lastGeneratedAt: generatedAt,
        }),
      }),
      findOneAndUpdate: jest.fn(),
    };

    const service = new EmergencyAccessService(
      tokenModel as any,
      {
        findOne: jest.fn().mockResolvedValue({
          _id: userId,
          fullName: "Test User",
        }),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {
        getBaseUrl: jest.fn().mockReturnValue("http://127.0.0.1:8000"),
        getGlobalAPIPrefix: jest.fn().mockReturnValue("v2"),
      } as any,
    );

    const result = (await service.getQrForUser(userId)) as any;

    expect(result.hasActiveToken).toBe(true);
    expect(result.token).toBeNull();
    expect(result.qrCodeDataUrl).toBeNull();
    expect(result.generatedAt).toEqual(generatedAt);
    expect(tokenModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("builds grouped qr profile data for scanner modal usage", async () => {
    const userId = new Types.ObjectId().toString();
    const generatedAt = new Date("2026-03-15T12:00:00.000Z");
    const tokenHash = "hashed-token";

    const service = new EmergencyAccessService(
      {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            userId,
            tokenHash,
            lastGeneratedAt: generatedAt,
          }),
        }),
      } as any,
      {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: new Types.ObjectId(userId),
            fullName: "Areeba Khan",
            email: "areeba@example.com",
            phoneNumber: "+923001234567",
            address: "Street 1, Lahore",
            cnic: "35202-1234567-8",
            gender: "female",
            dateOfBirth: new Date("1997-08-01T00:00:00.000Z"),
            deletedAt: null,
          }),
        }),
      } as any,
      {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            userId,
            bloodGroup: "O+",
            allergies: ["Peanuts"],
            chronicConditions: ["Asthma"],
            medications: ["Inhaler"],
            emergencyNotes: "Requires immediate inhaler support",
            address: "Street 1, Lahore",
            cnic: "35202-1234567-8",
            age: 28,
            gender: "female",
            dateOfBirth: new Date("1997-08-01T00:00:00.000Z"),
            pastSurgeries: [],
            updatedAt: new Date("2026-03-14T12:00:00.000Z"),
          }),
        }),
      } as any,
      {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            userId,
            hospitalName: "City Hospital",
            doctorName: "Dr. Ali",
            treatmentStatus: "Stable",
            currentMedications: ["Inhaler"],
            checkupFiles: [],
            entries: [],
            updatedAt: new Date("2026-03-14T12:00:00.000Z"),
          }),
        }),
      } as any,
      {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                name: "Sara Khan",
                phoneNumber: "+923009998887",
                relationship: "Sister",
                isPrimary: true,
              },
            ]),
          }),
        }),
      } as any,
      {
        getBaseUrl: jest.fn().mockReturnValue("http://127.0.0.1:8000"),
        getGlobalAPIPrefix: jest.fn().mockReturnValue("v2"),
      } as any,
    );

    jest.spyOn(service as any, "hashToken").mockReturnValue(tokenHash);

    const result = (await service.resolvePublicToken("plain-token")) as any;

    expect(result.identityDetails.fullName).toBe("Areeba Khan");
    expect(result.profileHighlights.bloodGroup).toBe("O+");
    expect(result.profileHighlights.primaryEmergencyContact.name).toBe("Sara Khan");
    expect(result.qrProfile.sections).toHaveLength(3);
    expect(result.qrProfile.sections[0].title).toBe("Identity Details");
    expect(result.qrProfile.sections[1].title).toBe("Emergency Profile");
    expect(result.qrProfile.sections[2].title).toBe("Profile Highlights");
  });

  it("builds lock-screen card payload with triple-tap sos metadata", async () => {
    const userId = new Types.ObjectId().toString();

    const service = new EmergencyAccessService(
      {} as any,
      {
        findOne: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(userId),
          fullName: "Areeba Khan",
          address: "Street 1, Lahore",
          deletedAt: null,
        }),
      } as any,
      {
        findOne: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            bloodGroup: "O+",
            address: "Street 1, Lahore",
            allergies: ["Peanuts", "Dust"],
            updatedAt: new Date("2026-03-14T12:00:00.000Z"),
          }),
        }),
      } as any,
      {} as any,
      {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                name: "Sara Khan",
                phoneNumber: "+923009998887",
                isPrimary: true,
              },
            ]),
          }),
        }),
      } as any,
      {} as any,
    );

    const result = (await service.getLockScreenCardForUser(userId)) as any;

    expect(result.notificationPanel.fields).toEqual([
      { label: "Address", value: "Street 1, Lahore" },
      { label: "Blood Group", value: "O+" },
      { label: "Allergies", value: ["Peanuts", "Dust"] },
    ]);
    expect(result.sos.gesture).toBe("triple_tap");
    expect(result.sos.endpoint).toBe("/me/panic-alerts");
    expect(result.sos.hasEmergencyContacts).toBe(true);
  });
});
