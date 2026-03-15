import { ISeeder } from "../interface";
import { SeedDefaultAccountService } from "../services/seed-default-account.service";

// A hashmap containing command line argument name as key and corresponding Service as value
const ArgNameAndSeederMapper: Record<string, new (...args: any) => ISeeder> = {
  user: SeedDefaultAccountService,
};

export default ArgNameAndSeederMapper;
