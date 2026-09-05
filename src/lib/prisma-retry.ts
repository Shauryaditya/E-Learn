import { db } from "@/lib/db";

const isClosedConnectionError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("Server has closed the connection") ||
    message.includes("Connection terminated unexpectedly") ||
    message.includes("Can't reach database server")
  );
};

export const withPrismaRetry = async <T>(query: () => Promise<T>) => {
  try {
    return await query();
  } catch (error) {
    if (!isClosedConnectionError(error)) {
      throw error;
    }

    await db.$disconnect().catch(() => undefined);
    await db.$connect();

    return query();
  }
};
