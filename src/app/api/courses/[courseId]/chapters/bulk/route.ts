import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type BulkChapterFile = {
  url?: string;
  name?: string;
};

type ValidBulkChapterFile = {
  url: string;
  name: string;
};

const fallbackTitle = "Untitled chapter";

const getChapterTitleFromFileName = (fileName?: string) => {
  if (!fileName) {
    return fallbackTitle;
  }

  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

  const cleanedName = nameWithoutExtension
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanedName || fallbackTitle;
};

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    const { files } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!Array.isArray(files) || files.length === 0) {
      return new NextResponse("Files are required", { status: 400 });
    }

    const validFiles = files.filter(
      (file: BulkChapterFile): file is ValidBulkChapterFile =>
        Boolean(file?.url && file?.name)
    );

    if (validFiles.length === 0) {
      return new NextResponse("No valid files provided", { status: 400 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: params.courseId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const startingPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapters = await db.$transaction(
      validFiles.map((file, index) =>
        db.chapter.create({
          data: {
            title: getChapterTitleFromFileName(file.name),
            courseId: params.courseId,
            position: startingPosition + index,
            attachments: {
              create: {
                url: file.url,
                name: file.name,
                courseId: params.courseId,
              },
            },
          },
          include: {
            attachments: true,
          },
        })
      )
    );

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("[BULK_CHAPTERS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
