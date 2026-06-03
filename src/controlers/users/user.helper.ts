import { AuthentificationError } from "@/lib/errors/appErrors";
import { KeycloakJWTPayload } from "@/services/users/user.auth.service";

export interface UserAccess {
  allocated: boolean;
  is_admin: boolean;
  currentUserId: number;
  canImpersonate: boolean;
}

export function getAccess(currentUser: KeycloakJWTPayload["sql"] | undefined): UserAccess {
  switch (currentUser?.role) {
    case "administrator":
      return { allocated: false, is_admin: true, currentUserId: currentUser.user_id as number, canImpersonate: true };
    case "lrsmanager":
        return { allocated: true, is_admin: false, currentUserId: currentUser.user_id as number, canImpersonate: true };
    case "teacher":
      return { allocated: false, is_admin: false, currentUserId: currentUser.user_id as number, canImpersonate: false };
    case "student":
      return { allocated: true, is_admin: false, currentUserId: currentUser.user_id as number, canImpersonate : false };
    default:
      throw new AuthentificationError("User role not recognized");
  }
}