import { db } from "@/lib/db"
import { Categories } from "./_components/categories"
import { SearchInput } from "@/components/search-input"
import { getCourses } from "@/actions/get-courses"
import { auth } from "@clerk/nextjs"
import { CoursesList } from "@/components/courses-list"
import { ActiveCoursesCard } from "./_components/active-courses-card"
import { CollectionCard } from "./_components/collection-card"
import Link from "next/link"
import { Archive, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getStudentProfile } from "@/actions/get-student-profile"
import { AiStudyMaterialFinder } from "./_components/ai-study-material-finder"

interface SearchPageProps {
  searchParams: {
    title: string,
    categoryId: string
  }
}


const SearchPage = async ({
  searchParams
}: SearchPageProps) => {
  const { userId } = auth()

  let categories = await db.category.findMany({
    orderBy: {
      name: 'asc'
    }
  }).catch((error) => {
    console.error("[SEARCH_CATEGORIES]", error)
    return []
  })

  const courses = await getCourses({
    userId,
    ...searchParams
  }).catch((error) => {
    console.error("[SEARCH_COURSES]", error)
    return []
  })
  const activeCourse = courses.find((course) => course.progress !== null)
  const studentProfile = userId ? await getStudentProfile() : null

  return (
    <>
      <div className="px-6 pt-6 md:hidden md:mb-0 block ">
        <SearchInput />
      </div>
      <div className="p-6 space-y-4">
        {categories.length === 0 && courses.length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Notes and assignments are temporarily unavailable. Please check the database connection and refresh.
          </div>
        )}
        {userId && <AiStudyMaterialFinder profile={studentProfile} />}
        <Link href="/search/resources" className="group flex flex-col gap-5 rounded-md border border-emerald-200 bg-emerald-50 p-5 transition hover:border-emerald-400 dark:border-emerald-900 dark:bg-emerald-950/30 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-emerald-700 text-white"><Archive className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-lg font-bold">Paper Vault</h2><Badge className="bg-emerald-700 text-white hover:bg-emerald-700">NEW</Badge></div>
            <p className="mt-1 text-sm text-emerald-950/70 dark:text-emerald-100/70">Find previous-year question papers by school, class, board, subject, and year.</p>
          </div>
          <span className="inline-flex items-center text-sm font-semibold text-emerald-800 dark:text-emerald-200">Explore papers<ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
        <Categories
          items={categories}
        />
        {activeCourse && activeCourse.progress !== null && (
          <ActiveCoursesCard
            courseId={activeCourse.id}
            title={activeCourse.title}
            imageUrl={activeCourse.imageUrl}
            progress={activeCourse.progress}
            chapterId={activeCourse.chapters[0]?.id}
            chaptersLength={activeCourse.chapters.length}
          />
        )}
   
        <CoursesList items={courses} />
        <CollectionCard />
      </div>
    </>
  )
}

export default SearchPage
