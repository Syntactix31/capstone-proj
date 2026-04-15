import { getRequestUser } from "../auth/server";
import { createAdminActivity } from "../db/adminActivity.js";

export function getAdminActorFromRequest(req) {
  const user = getRequestUser(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function recordAdminActivity(req, { action, details, metadata = {} }) {
  const user = getAdminActorFromRequest(req);
  if (!user) return null;

  return createAdminActivity({
    adminUserId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    action,
    details,
    metadata,
  });
}
