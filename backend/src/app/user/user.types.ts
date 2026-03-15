import { Role } from "../auth/enums/role.enum";

export type UserWithoutPassword = {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  role: Role;
};
