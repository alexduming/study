"use client";

import { useSidebar } from "@/shared/components/ui/sidebar";

import { Link } from "@/core/i18n/navigation";
import { SidebarFooter as SidebarFooterType } from "@/shared/types/blocks/dashboard";
import { NavItem } from "@/shared/types/blocks/common";
import { SmartIcon } from "@/shared/blocks/common/smart-icon";
import { Separator } from "@/shared/components/ui/separator";
import { LocaleSelector, ThemeToggler } from "../common";

export function SidebarFooter({ footer }: { footer: SidebarFooterType }) {
  const { open } = useSidebar();

  return (
    <>
      {open ? (
        <div className="w-full flex items-center justify-start mx-auto gap-x-4 px-4 py-3 border-t border-gray-200">
          {footer.nav?.items?.map((item: NavItem, idx: number) => (
            <div className="cursor-pointer hover:text-primary" key={idx}>
              <Link href={item.url || ""} target={item.target || "_self"}>
                {item.icon && (
                  <SmartIcon
                    name={item.icon as string}
                    className="text-md"
                    size={20}
                  />
                )}
              </Link>
            </div>
          ))}

          <div className="flex-1"></div>

          {(footer.show_theme || footer.show_locale) && (
            <Separator orientation="vertical" className="h-4" />
          )}
          {footer.show_theme && <ThemeToggler />}
          {footer.show_locale && <LocaleSelector />}
        </div>
      ) : null}
    </>
  );
}
