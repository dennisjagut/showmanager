import { api } from "@/lib/api/client";
import type { AuthStatus, User } from "@/lib/api/types";

// Reading from the API

// Whether accounts exist and who is logged in. Works without login.
export function getAuthStatus() {
  return api.get<AuthStatus>("/auth/status");
}

// All accounts, only for admins
export function getUsers() {
  return api.get<User[]>("/users");
}
