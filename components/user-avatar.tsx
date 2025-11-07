import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/database/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface Props {
  user: User;
}

export function UserAvatar({ user }: Props) {
  const supabase = createClient();

  const signOut = async () => {
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar>
          <AvatarImage src={user.user_metadata.avatar_url} alt="User" />
          <AvatarFallback>
            {user.email?.charAt(0).toUpperCase()}{" "}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent style={{ marginRight: 10 }}>
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          <p>Logout</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
