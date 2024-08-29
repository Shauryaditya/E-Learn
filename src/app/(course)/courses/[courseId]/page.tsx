import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

const CourseIdPage = async({
  params
}:{
  params: { courseId: string; }
}) => {
  const { userId } = auth()

  const course = await db.course.findUnique({
    where: {
      id: params.courseId,
    },
    include: {
      chapters: {
        where: {
          isPublished: true,
        },
        orderBy:{
          position: "asc"
        }
      }
    }
  });

  if(!course){
    return redirect("/")
  }

  return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`)
  return (
    <div>
        Watch this course
    </div>
  )
}

export default CourseIdPage