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
});
