"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { localeNames } from "@/config/locale";
import { Globe, Languages, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/core/i18n/navigation";
import { Button } from "@/shared/components/ui/button";
import { useEffect, useState } from "react";

/**
 * Fix hydration issue:
 * - Avoid a mismatch when localeNames[currentLocale] might be rendered differently on server and client.
 * - Only render language selection content on the client (use `mounted` state).
 */

export function LocaleSelector({
  type = "icon",
}: {
  type?: "icon" | "button";
}) {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSwitchLanguage = (value: string) => {
    if (value !== currentLocale) {
      router.push(pathname, {
        locale: value,
      });
    }
  };

  if (!mounted) {
    // Avoid hydration mismatch: just render a placeholder before the client is mounted
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {type === "icon" ? (
            <Languages size={18} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-primary/10"
              aria-label="Locale"
            >
              <Globe size={16} />
              {/* Placeholder, do not render locale name at SSR */}
            </Button>
          )}
        </DropdownMenuTrigger>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {type === "icon" ? (
          <Languages size={18} />
        ) : (
          <Button variant="outline" size="sm" className="hover:bg-primary/10">
            <Globe size={16} />
            {localeNames[currentLocale]}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.keys(localeNames).map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleSwitchLanguage(locale)}
          >
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && (
              <Check size={16} className="text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
