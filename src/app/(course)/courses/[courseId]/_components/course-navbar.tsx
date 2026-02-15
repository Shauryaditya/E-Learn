import { NavbarRoutes } from "@/components/navbar-routes";
import { Chapter, Course, UserProgress } from "@prisma/client"
import { CourseMobileSidebar } from "./course-mobile-sidebar";

interface CourseNavbarProps{
    course: Course & {
       
            chapters: (Chapter & {
                userProgress: UserProgress[] | null;
            })[];
        }
        progressCount: number;
    }

export const CourseNavbar = ({
    course,
    progressCount
}:CourseNavbarProps) => {
    return(
        <div className="p-4 border-b h-full flex items-center bg-white shadow-sm dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CourseMobileSidebar
            course={course}
            progressCount={progressCount}
            />
            <NavbarRoutes />
        </div>
    )
}