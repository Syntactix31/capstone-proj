// Re-export user DB helpers through the auth layer so auth routes import from one place.
export {
  createUser,
  findUserByEmail,
  getAdminEmails,
  normalizeEmail,
  resolveRoleForEmail,
  updateUser,
} from "../db/users";
