"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, User, CalendarClock, Gem } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

export function MainNav() {
  const pathname = usePathname()

  const menuItems = [
    {
      href: "/dashboard",
      label: "Discover",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/sessions",
      label: "My Sessions",
      icon: CalendarClock,
    },
    {
        href: "/dashboard/credits",
        label: "Credits",
        icon: Gem,
      },
    {
      href: "/dashboard/profile",
      label: "My Profile",
      icon: User,
    },
  ]

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            variant="ghost"
            isActive={pathname === item.href}
            tooltip={item.label}
          >
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
