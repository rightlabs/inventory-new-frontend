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
import { useUser } from "@/contexts/userContext";

export function Header() {
  const { user } = useUser();

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback className="hover:text-text text-lg">
                    {user?.firstName[0] + user?.lastName[0]}
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
