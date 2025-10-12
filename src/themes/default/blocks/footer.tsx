import { Link } from "@/core/i18n/navigation";
import { Footer as FooterType } from "@/shared/types/blocks/landing";
import { SmartIcon } from "@/shared/blocks/common/smart-icon";
import {
  BuiltWith,
  Copyright,
  BrandLogo,
  LocaleSelector,
  ThemeToggler,
} from "@/shared/blocks/common";
import { NavItem } from "@/shared/types/blocks/common";

export function Footer({ footer }: { footer: FooterType }) {
  return (
    <footer
      id={footer.id}
      className={`py-8 sm:py-8 ${footer.className || ""} overflow-x-hidden`}
      // overflow-x-hidden防止-footer-撑出水平滚动条
    >
      <div className="container space-y-8 overflow-x-hidden">
        <div className="grid gap-12 md:grid-cols-5 min-w-0">
          <div className="space-y-4 md:col-span-2 md:space-y-6 min-w-0 break-words">
            {footer.brand ? <BrandLogo brand={footer.brand} /> : null}

            {footer.brand?.description ? (
              <p
                className="text-muted-foreground text-balance text-sm break-words"
                dangerouslySetInnerHTML={{ __html: footer.brand.description }}
              />
            ) : null}
          </div>

          <div className="col-span-3 grid gap-6 sm:grid-cols-3 min-w-0">
            {footer.nav?.items.map((item, idx) => (
              <div key={idx} className="space-y-4 text-sm min-w-0 break-words">
                <span className="block font-medium break-words">
                  {item.title}
                </span>

                <div className="flex flex-wrap gap-4 sm:flex-col min-w-0">
                  {item.children?.map((subItem, iidx) => (
                    <Link
                      key={iidx}
                      href={subItem.url || ""}
                      target={subItem.target || ""}
                      className="text-muted-foreground hover:text-primary block duration-150 break-words"
                    >
                      <span className="break-words">{subItem.title || ""}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-8 min-w-0">
          {footer.show_built_with !== false ? <BuiltWith /> : null}
          <div className="flex-1 min-w-0" />
          {footer.show_theme !== false ? <ThemeToggler type="toggle" /> : null}
          {footer.show_locale !== false ? (
            <LocaleSelector type="button" />
          ) : null}
        </div>

        <div
          aria-hidden
          className="h-px bg-[length:6px_1px] bg-repeat-x opacity-25 [background-image:linear-gradient(90deg,var(--color-foreground)_1px,transparent_1px)] min-w-0"
        />
        <div className="flex flex-wrap justify-between gap-8 min-w-0">
          {footer.copyright ? (
            <p
              className="text-muted-foreground text-balance text-sm break-words"
              dangerouslySetInnerHTML={{ __html: footer.copyright }}
            />
          ) : footer.brand ? (
            <Copyright brand={footer.brand} />
          ) : null}

          <div className="flex-1 min-w-0"></div>

          {footer.agreement ? (
            <div className="flex flex-wrap items-center gap-4 min-w-0">
              {footer.agreement?.items.map((item: NavItem, index: number) => (
                <Link
                  key={index}
                  href={item.url || ""}
                  target={item.target || ""}
                  className="text-muted-foreground hover:text-primary block duration-150 text-xs underline break-words"
                >
                  {item.title || ""}
                </Link>
              ))}
            </div>
          ) : null}

          {footer.social ? (
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {footer.social?.items.map((item: NavItem, index) => (
                <Link
                  key={index}
                  href={item.url || ""}
                  target={item.target || ""}
                  className="cursor-pointer text-muted-foreground hover:text-primary block duration-150 bg-background rounded-full p-2"
                >
                  {item.icon && (
                    <SmartIcon name={item.icon as string} size={20} />
                  )}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
