import { clerkClient } from "@clerk/nextjs";

export const resolveStudentUserId = async (identifier: string) => {
  const value = identifier.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("user_")) {
    return value;
  }

  const users = await clerkClient.users.getUserList({
    emailAddress: [value.toLowerCase()],
    limit: 2,
  });

  if (users.length !== 1) {
    return null;
  }

  return users[0].id;
};
