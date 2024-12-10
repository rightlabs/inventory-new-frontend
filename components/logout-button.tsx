import React from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut } from "lucide-react";
import { userLogout } from "@/api/auth";
import { ErrorResponse } from "@/types/type";
import { AxiosError } from "axios";
import toast from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await userLogout();

      if (res.data.statusCode == 200 || res.data.statusCode == 201) {
        Cookies.remove("authToken");
        toast.success("Logout successful");
        router.push("/");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const errorMessage =
        axiosError.response?.data?.message || "Error in logging out";
      console.log(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger className="flex w-full items-center gap-x-2 text-[#64748B] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[#F1F5F9] transition-colors">
        <LogOut className="h-5 w-5" />
        Logout
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? You'll need to login again to
            access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 hover:text-black">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-primary hover:bg-primary/90"
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
