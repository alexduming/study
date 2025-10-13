import { type Table } from "@/shared/types/blocks/table";
import { TableCard } from "@/shared/blocks/table";
import { getUserInfo } from "@/shared/services/user";
import { Empty } from "@/shared/blocks/common";
import {
  getSubscriptions,
  getSubscriptionsCount,
  Subscription,
  getCurrentSubscription,
} from "@/shared/services/subscription";
import moment from "moment";
import { PanelCard } from "@/shared/blocks/panel";
import { Tab } from "@/shared/types/blocks/common";
import { getTranslations } from "next-intl/server";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: number; pageSize?: number; status?: string }>;
}) {
  const { page: pageNum, pageSize, status } = await searchParams;
  const page = pageNum || 1;
  const limit = pageSize || 20;

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations("settings.billing");

  const currentSubscription = await getCurrentSubscription(user.id);

  const total = await getSubscriptionsCount({
    userId: user.id,
    status,
  });

  const subscriptions = await getSubscriptions({
    userId: user.id,
    status,
    page,
    limit,
  });

  const table: Table = {
    title: t("subscriptions.title"),
    columns: [
      {
        name: "subscriptionNo",
        title: t("subscriptions.table.subscription_no"),
        type: "copy",
      },
      {
        name: "interval",
        title: t("subscriptions.table.interval"),
        type: "label",
      },
      {
        name: "status",
        title: t("subscriptions.table.status"),
        type: "label",
        metadata: { variant: "outline" },
      },
      {
        name: "paymentProvider",
        title: t("subscriptions.table.provider"),
        type: "label",
        metadata: { variant: "outline" },
      },
      {
        title: t("subscriptions.table.amount"),
        callback: function (item) {
          return (
            <div className="text-primary">{`${item.amount / 100} ${
              item.currency
            }`}</div>
          );
        },
        type: "copy",
      },
      {
        name: "createdAt",
        title: t("subscriptions.table.created_at"),
        type: "time",
      },
      {
        title: t("subscriptions.table.current_period"),
        callback: function (item) {
          return (
            <div>
              {`${moment(item.currentPeriodStart).format("YYYY-MM-DD")}`} ~
              <br />
              {`${moment(item.currentPeriodEnd).format("YYYY-MM-DD")}`}
            </div>
          );
        },
      },
    ],
    data: subscriptions,
    pagination: {
      total,
      page,
      limit,
    },
  };

  const tabs: Tab[] = [
    {
      title: t("subscriptions.tabs.all"),
      name: "all",
      url: "/settings/billing",
      is_active: !status || status === "all",
    },
    {
      title: t("subscriptions.tabs.active"),
      name: "active",
      url: "/settings/billing?status=active",
      is_active: status === "active",
    },
    {
      title: t("subscriptions.tabs.canceled"),
      name: "canceled",
      url: "/settings/billing?status=canceled",
      is_active: status === "canceled",
    },
  ];

  return (
    <div className="space-y-8">
      <PanelCard
        title={t("plan.title")}
        buttons={[
          {
            title: t("plan.button_title"),
            url: "/pricing",
            target: "_blank",
            icon: "Pencil",
            size: "sm",
          },
        ]}
        className="max-w-md"
      >
        <div className="text-3xl font-bold text-primary">
          {currentSubscription?.planName}
        </div>
        <div className="text-sm font-normal text-muted-foreground mt-4">
          {t("plan.renew_tip", {
            date: moment(currentSubscription?.currentPeriodEnd).format(
              "YYYY-MM-DD"
            ),
          })}
        </div>
      </PanelCard>
      <TableCard title={t("subscriptions.title")} tabs={tabs} table={table} />
    </div>
  );
}
