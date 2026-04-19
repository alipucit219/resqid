import { createHash } from "crypto";
import { BadRequestException } from "@nestjs/common";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  it("throws for invalid/expired reset code", async () => {
    const service = new AuthService(
      {
        findByEmail: jest.fn().mockResolvedValue(null),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.resetPassword({
        email: "user@example.com",
        code: "123456",
        newPassword: "NewPassword123",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("resets password and clears token fields on valid code", async () => {
    const validCode = "123456";
    const user = {
      password: "old-password",
      resetTokenHash: createHash("sha256").update(validCode).digest("hex"),
      resetTokenExpiry: new Date(Date.now() + 60_000),
    };

    const userService = {
      findByEmail: jest.fn().mockResolvedValue(user),
      save: jest.fn().mockResolvedValue(user),
    };

    const hashService = {
      hashPassword: jest.fn().mockResolvedValue("new-hashed-password"),
    };

    const service = new AuthService(
      userService as any,
      hashService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.resetPassword({
      email: "user@example.com",
      code: validCode,
      newPassword: "NewPassword123",
    });

    expect(result.message).toBe("Password has been reset.");
    expect(user.password).toBe("new-hashed-password");
    expect(user.resetTokenHash).toBeNull();
    expect(user.resetTokenExpiry).toBeNull();
    expect(userService.save).toHaveBeenCalledWith(user);
  });
});
