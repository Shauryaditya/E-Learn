import { NavbarRoutes } from "@/components/navbar-routes"
import { MobileSidebar } from "./mobile-sidebar"

export const Navbar = () => {
  return (
    <div className="flex h-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0b1120]/90 md:px-6">
      <MobileSidebar />
      <NavbarRoutes />
    </div>
  )
}
