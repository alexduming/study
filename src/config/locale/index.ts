import { envConfigs } from "..";

export const localeNames: any = {
  en: "English",
  zh: "中文",
};

export const locales = ["en", "zh"];

export const defaultLocale = envConfigs.default_locale;

export const localePrefix = "as-needed";

export const localeDetection = false;

export const localeMessagesRootPath = "@/config/locale/messages";

export const localeMessagesPaths = [
  "common",
  "landing",
  "demo",
  "showcases",
  "blog",
  "pricing",
  "admin/sidebar",
  "admin/user",
  "settings",
];
