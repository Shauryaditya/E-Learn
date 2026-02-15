
import { db } from "@/lib/db";
import { ResourceCategory, ResourceType } from "@prisma/client";

interface GetResourcesProps {
  category?: ResourceCategory;
  type?: ResourceType;
  subject?: string;
  grade?: string;
  year?: number;
  search?: string;
}

export const getResources = async ({
  category,
  type,
  subject,
  grade,
  year,
  search
}: GetResourcesProps) => {
  try {
    const resources = await db.resource.findMany({
      where: {
        category,
        type,
        ...(subject && { subject }),
        ...(grade && { grade }),
        ...(year && { year }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ]
        })
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return resources;
  } catch (error) {
    console.log("[GET_RESOURCES]", error);
    return [];
  }
};
