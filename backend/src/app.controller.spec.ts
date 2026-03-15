import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SeedDefaultAccountService } from "./database/seeder/services/seed-default-account.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SeedDefaultAccountService,
          useValue: {
            seed: jest.fn(),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    const expectedOutputStr = "RESQID Server is up and running perfectly fine";
    it(`should return ${expectedOutputStr}`, () => {
      expect(appController.getHello()).toBe(expectedOutputStr);
    });
  });
});
