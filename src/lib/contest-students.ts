import { clerkClient } from "@clerk/nextjs";

export async function getContestStudents(userIds: string[]) {
  const students = new Map(userIds.map(id => [id, { id, name: "Student", email: id }]));
  if (!userIds.length) return { students, unavailable: false };
  try {
    const users = await clerkClient.users.getUserList({ userId: userIds, limit: userIds.length });
    for (const user of users) {
      students.set(user.id, {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "Student",
        email: user.emailAddresses.find(email => email.id === user.primaryEmailAddressId)?.emailAddress
          || user.emailAddresses[0]?.emailAddress || user.id,
      });
    }
    return { students, unavailable: false };
  } catch (error) {
    console.error("[CONTEST_STUDENTS]", error);
    return { students, unavailable: true };
  }
}
