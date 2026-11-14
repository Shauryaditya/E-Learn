import { NavbarRoutes } from "@/components/navbar-routes"
import { MobileSidebar } from "./mobile-sidebar"

export const Navbar = () => {
  return (
    <div className="flex h-full min-w-0 items-center justify-between gap-2 overflow-hidden border-b border-slate-200/80 bg-white/90 px-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0b1120]/90 sm:px-4 md:px-6">
      <MobileSidebar />
      <NavbarRoutes />
    </div>
  )
}
