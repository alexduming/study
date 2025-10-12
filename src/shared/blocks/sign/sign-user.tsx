"use client";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { signOut } from "@/core/auth/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { useRouter } from "@/core/i18n/navigation";
import {
  Coins,
  CreditCard,
  ExternalLinkIcon,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { envConfigs } from "@/config";
import { SignModal } from "./sign-modal";
import { useAppContext } from "@/shared/contexts/app";
import { Link } from "@/core/i18n/navigation";
import { useTranslations } from "next-intl";
import { NavItem, UserNav } from "@/shared/types/blocks/common";
import { SmartIcon } from "../common/smart-icon";
import { Fragment } from "react/jsx-runtime";

export function SignUser({
  isScrolled,
  signButtonSize = "sm",
  userNav,
}: {
  isScrolled?: boolean;
  signButtonSize?: "default" | "sm" | "lg" | "icon";
  userNav?: UserNav;
}) {
  if (
    typeof window === "undefined" &&
    (!envConfigs.database_url || !envConfigs.auth_secret)
  ) {
    return null;
  }

  const t = useTranslations("common.sign");
  const { isCheckSign, user, setIsShowSignModal } = useAppContext();
  const router = useRouter();

  if (isCheckSign) {
    return (
      <div>
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {userNav?.show_name && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer w-full"
                  href="/settings/profile"
                >
                  <User />
                  {user.name}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {userNav?.show_credits && (
            <>
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer w-full"
                  href="/settings/credits"
                >
                  <Coins />
                  {user.credits?.remainingCredits || 0}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {userNav?.items?.map((item: NavItem, idx: number) => (
            <Fragment key={idx}>
              <DropdownMenuItem asChild>
                <Link
                  className="cursor-pointer w-full"
                  href={item.url || ""}
                  target={item.target || "_self"}
                >
                  {item.icon && (
                    <SmartIcon name={item.icon as string} className="w-4 h-4" />
                  )}
                  {item.title}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </Fragment>
          ))}

          {userNav?.show_sign_out && (
            <DropdownMenuItem
              className="cursor-pointer w-full"
              onClick={() =>
                signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/");
                    },
                  },
                })
              }
            >
              <LogOut />
              <span>{t("sign_out_title")}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
      <Button
        asChild
        size={signButtonSize}
        className={cn(
          "border-foreground/10 ml-4 ring-0 cursor-pointer",
          isScrolled && "lg:hidden"
        )}
        onClick={() => setIsShowSignModal(true)}
      >
        <span>{t("sign_in_title")}</span>
      </Button>
      <SignModal />
    </div>
  );
}
