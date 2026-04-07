import { Role } from "../auth/enums/role.enum";

export type UserWithoutPassword = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  cnic?: string | null;
  address?: string | null;
  dateOfBirth?: Date | null;
  gender?: string | null;
  isActive: boolean;
  role: Role;
};
