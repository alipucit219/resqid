import { PanicAlertService } from "./panic-alert.service";

describe("PanicAlertService", () => {
  const buildListChain = (resolved: any[]) => {
    const chain: any = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(resolved),
    };
    return chain;
  };

  it("applies fromDate and toDate filters in adminList", async () => {
    const panicAlertModel = {
      find: jest.fn().mockReturnValue(buildListChain([])),
      countDocuments: jest.fn().mockResolvedValue(0),
    };

    const service = new PanicAlertService(
      panicAlertModel as any,
      {} as any,
      {} as any,
      { find: jest.fn() } as any,
      {} as any,
    );

    await service.adminList({
      page: 0,
      limit: 10,
      fromDate: "2026-03-10",
      toDate: "2026-03-12",
    } as any);

    const filter = panicAlertModel.find.mock.calls[0][0];
    expect(filter.createdAt).toBeDefined();
    expect(filter.createdAt.$gte).toBeInstanceOf(Date);
    expect(filter.createdAt.$lte).toBeInstanceOf(Date);
    expect(filter.createdAt.$gte.toISOString().startsWith("2026-03-10")).toBe(
      true,
    );
    expect(filter.createdAt.$lte.getHours()).toBe(23);
    expect(filter.createdAt.$lte.getMinutes()).toBe(59);
    expect(filter.createdAt.$lte.getSeconds()).toBe(59);
  });
});
