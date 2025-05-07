"use client"

import Link from "next/link"
import { ModeToggle } from "./mode-toggle"
import { usePathname } from "next/navigation"

export function Navbar() {
  const pathname = usePathname()
  
  return (
    <header className="border-b sticky top-0 z-50 bg-background">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link href="/" className="font-bold text-xl">
            DAO Portal
          </Link>
          <nav className="ml-8 hidden md:flex items-center space-x-6">
            <NavLink href="/" active={pathname === "/"}>
              Dashboard
            </NavLink>
            <NavLink href="/dao" active={pathname.startsWith("/dao")}>
              DAOs
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {/* Will add user menu here later */}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}

function NavLink({ 
  href, 
  active, 
  children 
}: { 
  href: string
  active: boolean
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </Link>
  )
}