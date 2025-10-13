import { type Table } from "@/shared/types/blocks/table";
import { TableCard } from "@/shared/blocks/table";
import { getUserInfo } from "@/shared/services/user";
import { Empty } from "@/shared/blocks/common";
import {
  getApikeys,
  getApikeysCount,
  Apikey,
  ApikeyStatus,
} from "@/shared/services/apikey";
import { Button } from "@/shared/types/blocks/common";
import { getTranslations } from "next-intl/server";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number }>;
}) {
  const { page: pageNum, pageSize } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations("settings.api-keys");

  const total = await getApikeysCount({
    userId: user.id,
    status: ApikeyStatus.ACTIVE,
  });

  const apikeys = await getApikeys({
    userId: user.id,
    status: ApikeyStatus.ACTIVE,
    page,
    limit,
  });

  const table: Table = {
    title: t("title"),
    columns: [
      {
        name: "title",
        title: t("table.title"),
      },
      { name: "key", title: t("table.key"), type: "copy" },
      {
        name: "createdAt",
        title: t("table.created_at"),
        type: "time",
      },
      {
        name: "action",
        title: t("table.action"),
        type: "dropdown",
        callback: (item: Apikey) => {
          return [
            {
              title: t("table.action_items.edit"),
              url: `/settings/api-keys/${item.id}/edit`,
              icon: "RiEditLine",
            },
            {
              title: t("table.action_items.delete"),
              url: `/settings/api-keys/${item.id}/delete`,
              icon: "RiDeleteBinLine",
            },
          ];
        },
      },
    ],
    data: apikeys,
    emptyMessage: t("empty_message"),
    pagination: {
      total,
      page,
      limit,
    },
  };

  const buttons: Button[] = [
    {
      title: t("button_title"),
      url: "/settings/api-keys/create",
      icon: "Plus",
    },
  ];

  return (
    <div className="space-y-8">
      <TableCard title={t("title")} buttons={buttons} table={table} />
    </div>
  );
}
