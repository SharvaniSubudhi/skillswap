import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
  SidebarFooter,
  SidebarCollapse,
} from "@/components/ui/sidebar"
import { Header } from "@/components/header"
import { MainNav } from "@/components/main-nav"
import Logo from "@/components/logo"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between w-full">
            <Link href="/dashboard" className="flex items-center gap-2 flex-grow overflow-hidden">
              <Logo />
              <span className="font-bold text-lg font-headline truncate">SkillSwap</span>
            </Link>
            <SidebarCollapse />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter>
          {/* Footer content if any */}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="min-h-[calc(100vh-4rem)] flex-1 p-4 md:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
