
import { db } from "@/lib/db";
import { ResourceCategory, ResourceType } from "@prisma/client";

interface GetResourcesProps {
  category?: ResourceCategory;
  type?: ResourceType;
  subject?: string;
  grade?: string;
  year?: number;
  schoolName?: string;
  board?: string;
  examType?: string;
  search?: string;
}

export const getResources = async ({
  category,
  type,
  subject,
  grade,
  year,
  schoolName,
  board,
  examType,
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
        ...(schoolName && { schoolName }),
        ...(board && { board }),
        ...(examType && { examType }),
        ...(search && {
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { subject: { contains: search, mode: "insensitive" } },
                { schoolName: { contains: search, mode: "insensitive" } },
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
