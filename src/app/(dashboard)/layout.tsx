import { Sidebar } from "./_components/sidebar"
import { Navbar } from "./_components/navbar"
import { MobileBottomNav } from "./_components/mobile-bottom-nav"


const DashboardLayout = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <div className="h-full">
      <div className="h-[80px] md:pl-56 fixed w-full inset-y-0 z-50">
        <Navbar />
      </div>
      <div className="hidden md:flex h-full w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>
      <main className="md:pl-56 pt-[80px] pb-20 md:pb-0 h-full">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}

export default DashboardLayout
