import { auth, currentUser } from "@clerk/nextjs/server";
import { ERROR_MESSAGES } from "@/constants";

export async function getAuthenticatedUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  return userId;
}

export async function getFullUser() {
  const user = await currentUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }
  return user;
}

export async function requireAuth() {
  const userId = await getAuthenticatedUser();
  return { userId };
}
