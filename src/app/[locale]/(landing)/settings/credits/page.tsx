import { type Table } from "@/shared/types/blocks/table";
import { TableCard } from "@/shared/blocks/table";
import { PanelCard } from "@/shared/blocks/panel";
import { getUserInfo } from "@/shared/services/user";
import { Empty } from "@/shared/blocks/common";
import {
  Credit,
  CreditStatus,
  CreditTransactionType,
  getCredits,
  getCreditsCount,
  getRemainingCredits,
} from "@/shared/services/credit";
import { Tab } from "@/shared/types/blocks/common";
import { getTranslations } from "next-intl/server";

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number; type?: string }>;
}) {
  const { page: pageNum, pageSize, type } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations("settings.credits");

  const total = await getCreditsCount({
    transactionType: type as CreditTransactionType,
    userId: user.id,
    status: CreditStatus.ACTIVE,
  });

  const credits = await getCredits({
    userId: user.id,
    status: CreditStatus.ACTIVE,
    transactionType: type as CreditTransactionType,
    page,
    limit,
  });

  const table: Table = {
    title: t("title"),
    columns: [
      { name: "transactionNo", title: t("table.transaction_no"), type: "copy" },
      { name: "description", title: t("table.description") },
      {
        name: "transactionType",
        title: t("table.type"),
        type: "label",
        metadata: { variant: "outline" },
      },
      {
        name: "transactionScene",
        title: t("table.scene"),
        type: "label",
        placeholder: "-",
        metadata: { variant: "outline" },
      },
      {
        name: "credits",
        title: t("table.credits"),
        type: "label",
        metadata: { variant: "outline" },
      },
      {
        name: "expiresAt",
        title: t("table.expires_at"),
        type: "time",
        placeholder: "-",
        metadata: { format: "YYYY-MM-DD HH:mm:ss" },
      },
      {
        name: "createdAt",
        title: t("table.created_at"),
        type: "time",
      },
    ],
    data: credits,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const remainingCredits = await getRemainingCredits(user.id);

  const tabs: Tab[] = [
    {
      title: t("tabs.all"),
      name: "all",
      url: "/settings/credits",
      is_active: !type || type === "all",
    },
    {
      title: t("tabs.grant"),
      name: "grant",
      url: "/settings/credits?type=grant",
      is_active: type === "grant",
    },
    {
      title: t("tabs.consume"),
      name: "consume",
      url: "/settings/credits?type=consume",
      is_active: type === "consume",
    },
  ];

  return (
    <div className="space-y-8">
      <PanelCard
        title={t("remaining_credits")}
        buttons={[
          {
            title: t("button_title"),
            url: "/pricing",
            target: "_blank",
            icon: "Coins",
          },
        ]}
        className="max-w-md"
      >
        <div className="text-3xl font-bold text-primary">
          {remainingCredits}
        </div>
      </PanelCard>
      <TableCard title={t("history")} tabs={tabs} table={table} />
    </div>
  );
}
