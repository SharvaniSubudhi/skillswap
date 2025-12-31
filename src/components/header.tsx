import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"
import Logo from "./logo"
import Link from "next/link"

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
       <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
        <Link href="/dashboard" className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-lg font-headline">SkillSwap</span>
        </Link>
      </div>

      <div className="flex w-full items-center justify-end gap-4">
        {/* Placeholder for potential future elements like search or notifications */}
        <UserNav />
      </div>
    </header>
  )
}
