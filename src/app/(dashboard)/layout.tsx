import { Sidebar } from "./_components/sidebar"
import { Navbar } from "./_components/navbar"
import { MobileBottomNav } from "./_components/mobile-bottom-nav"


const DashboardLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div className="min-h-full bg-slate-50 text-slate-950 dark:bg-[#0b1120] dark:text-slate-100">
      <div className="fixed inset-x-0 top-0 z-50 h-16 md:pl-64">
        <Navbar />
      </div>
      <div className="fixed inset-y-0 z-50 hidden w-64 flex-col md:flex">
        <Sidebar />
      </div>
      <main className="min-h-screen pt-16 pb-20 md:pl-64 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}

export default DashboardLayout
