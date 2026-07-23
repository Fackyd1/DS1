export type UserRole = "ADMIN" | "EDITOR" | "USER" | "GUEST";

export type SessionPayload = {
  userId?: string;
  playerTag: string;
  role: UserRole;
  mode: "guest" | "account" | "wallet";
  exp: number;
};
