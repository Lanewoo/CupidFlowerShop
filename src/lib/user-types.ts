export type UserRole = "consumer" | "merchant";

export type PublicUser = {
  id: string;
  role: UserRole;
  createdAt: string;
  email?: string;
  username?: string;
  phone?: string;
  address?: string;
};
