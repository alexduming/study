import { getUserInfo } from "@/shared/services/user";
import { Empty } from "@/shared/blocks/common";
import { Form as FormType } from "@/shared/types/blocks/form";
import { FormCard } from "@/shared/blocks/form";
import {
  findApikeyById,
  updateApikey,
  UpdateApikey,
} from "@/shared/services/apikey";
import { getNonceStr } from "@/shared/lib/hash";
import { Crumb } from "@/shared/types/blocks/common";
import { getTranslations } from "next-intl/server";

export default async function EditApiKeyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apikey = await findApikeyById(id);
  if (!apikey) {
    return <Empty message="API Key not found" />;
  }

  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  if (apikey.userId !== user.id) {
    return <Empty message="no permission" />;
  }

  const t = await getTranslations("settings.api-keys.edit");

  const form: FormType = {
    title: t("title"),
    fields: [
      {
        name: "title",
        title: t("form.title"),
        type: "text",
        placeholder: "",
        validation: { required: true },
      },
    ],
    passby: {
      user: user,
      apikey: apikey,
    },
    data: apikey,
    submit: {
      handler: async (data: FormData, passby: any) => {
        "use server";

        const { user, apikey } = passby;

        if (!apikey) {
          throw new Error("apikey not found");
        }

        if (!user) {
          throw new Error("no auth");
        }

        if (apikey.userId !== user.id) {
          throw new Error("no permission");
        }

        const title = data.get("title") as string;
        if (!title?.trim()) {
          throw new Error("title is required");
        }

        const key = `sk-${getNonceStr(32)}`;

        const updatedApikey: UpdateApikey = {
          title: title.trim(),
        };

        await updateApikey(apikey.id, updatedApikey);

        return {
          status: "success",
          message: "API Key updated",
          redirect_url: "/settings/api-keys",
        };
      },
      button: {
        title: t("button_title"),
      },
    },
  };

  const crumbs: Crumb[] = [
    {
      title: t("crumb.api-keys"),
      url: "/settings/api-keys",
    },
    {
      title: t("crumb.edit"),
      is_active: true,
    },
  ];

  return (
    <div className="space-y-8">
      <FormCard title={t("title")} crumbs={crumbs} form={form} />
    </div>
  );
}
