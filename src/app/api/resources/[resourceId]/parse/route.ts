import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: { resourceId: string } }) {
  try {
    const { userId, getToken } = auth();
    if (!userId || !isTeacher(userId)) return new NextResponse("Unauthorized", { status: 401 });

    const resource = await db.resource.findUnique({ where: { id: params.resourceId } });
    if (!resource) return new NextResponse("Paper not found", { status: 404 });

    const response = await fetch(resource.url, { cache: "no-store" });
    if (!response.ok) return new NextResponse("Could not download the uploaded paper", { status: 502 });

    const contentType = response.headers.get("content-type")?.split(";")[0] || "application/pdf";
    if (contentType !== "application/pdf" && !resource.url.toLowerCase().includes(".pdf")) {
      return new NextResponse("Automatic extraction currently supports PDF papers", { status: 415 });
    }

    const bytes = await response.arrayBuffer();
    const file = new File([bytes], `${resource.title}.pdf`, { type: "application/pdf" });
    const formData = new FormData();
    formData.append("file", file);
    const token = await getToken();
    const parseResponse = await fetch(new URL("/api/question-bank/parse-pdf", req.url), {
      method: "POST",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      body: formData,
      cache: "no-store",
    });
    const result = await parseResponse.text();
    return new NextResponse(result, { status: parseResponse.status, headers: { "content-type": parseResponse.headers.get("content-type") || "application/json" } });
  } catch (error) {
    console.error("[RESOURCE_PARSE]", error);
    return new NextResponse(error instanceof Error ? error.message : "Could not parse paper", { status: 500 });
  }
}
