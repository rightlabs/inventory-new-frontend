"use client";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useUser } from "@/contexts/userContext";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";
import { SidebarNav } from "./sidebar";

export function Header() {
  const { user } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {/* Below lg: menu button + drawer with the sidebar links */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden -ml-2"
              aria-label="Open menu"
              data-testid="menu-button"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="flex w-64 flex-col p-0 bg-[#F8FAFC] sm:max-w-[16rem]"
            data-testid="menu-drawer"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarNav onNavigate={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>
        <span className="lg:hidden truncate text-lg font-bold tracking-tight">
          Gayatri Industries
        </span>
        <div className="flex items-center ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback className="hover:text-text text-lg">
                    {user?.firstName?.[0] || ""}
                    {user?.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none capitalize">
                    {user?.role}
                  </p>
                  <p className="text-xs leading-none text-gray-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>Profile</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
