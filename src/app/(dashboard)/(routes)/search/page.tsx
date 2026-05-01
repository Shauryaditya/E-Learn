import { db } from "@/lib/db"
import { Categories } from "./_components/categories"
import { SearchInput } from "@/components/search-input"
import { getCourses } from "@/actions/get-courses"
import { auth } from "@clerk/nextjs"
import { CoursesList } from "@/components/courses-list"
import { ActiveCoursesCard } from "./_components/active-courses-card"

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

  return (
    <>
      <div className="px-6 pt-6 md:hidden md:mb-0 block ">
        <SearchInput />
      </div>
      <div className="p-6 space-y-4">
        {categories.length === 0 && courses.length === 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Courses are temporarily unavailable. Please check the database connection and refresh.
          </div>
        )}
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
      </div>
    </>
  )
}

export default SearchPage
