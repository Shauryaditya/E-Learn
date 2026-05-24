import Logo from "./logo"
import { SidebarRoutes } from "./sidebar-routes"

export const Sidebar = () => {
    return(
        <aside className="flex h-full flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#080d1a]">
        <div className="flex h-16 items-center border-b border-slate-100 px-6 dark:border-white/10">
          <Logo />
        </div>
        <div className="flex w-full flex-1 flex-col px-3 py-5">
          <SidebarRoutes />
        </div>
      </aside>
    )
}
