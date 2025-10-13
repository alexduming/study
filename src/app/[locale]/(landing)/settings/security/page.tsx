import { getUserInfo } from "@/shared/services/user";
import { Empty } from "@/shared/blocks/common";
import { Form as FormType } from "@/shared/types/blocks/form";
import { UpdateUser, updateUser } from "@/shared/services/user";
import { PanelCard } from "@/shared/blocks/panel";
import { Button as ButtonType } from "@/shared/types/blocks/common";
import { getTranslations } from "next-intl/server";

export default async function SecurityPage() {
  const user = await getUserInfo();
  if (!user) {
    return <Empty message="no auth" />;
  }

  const t = await getTranslations("settings.security");

  const form: FormType = {
    fields: [
      {
        name: "email",
        title: t("reset_password.form.email"),
        type: "email",
        attributes: { disabled: true },
      },
      {
        name: "password",
        title: t("reset_password.form.password"),
        type: "password",
        attributes: { type: "password" },
        validation: { required: true },
      },
      {
        name: "new_password",
        title: t("reset_password.form.new_password"),
        type: "password",
        validation: { required: true },
      },
      {
        name: "confirm_password",
        title: t("reset_password.form.confirm_password"),
        type: "password",
        validation: { required: true },
      },
    ],
    data: user,
    passby: {
      user: user,
    },
    submit: {
      handler: async (data: FormData, passby: any) => {
        "use server";

        const { user } = passby;
        if (!user) {
          throw new Error("no auth");
        }

        const password = data.get("password") as string;
        if (!password?.trim()) {
          throw new Error("password is required");
        }

        const updatedUser: UpdateUser = {
          // password: password.trim(),
          // new_password: new_password.trim(),
          // confirm_password: confirm_password.trim(),
        };

        await updateUser(user.id, updatedUser);

        return {
          status: "success",
          message: "Profile updated",
          redirect_url: "/settings/profile",
        };
      },
      button: {
        title: t("reset_password.button_title"),
      },
    },
  };

  return (
    <div className="space-y-8">
      <PanelCard
        title={t("reset_password.button_title")}
        description={t("reset_password.description")}
        content={t("reset_password.tip")}
        buttons={[
          {
            title: t("reset_password.button_title"),
            url: "/settings/security",
            target: "_self",
            variant: "default",
            size: "sm",
            icon: "RiLockPasswordLine",
          },
        ]}
        className="max-w-md"
      />
      <PanelCard
        title={t("delete_account.button_title")}
        description={t("delete_account.description")}
        content={t("delete_account.content")}
        buttons={[
          {
            title: t("delete_account.button_title"),
            url: "/settings/security",
            target: "_self",
            variant: "destructive",
            size: "sm",
            icon: "RiDeleteBinLine",
          },
        ]}
        className="max-w-md"
      />
    </div>
  );
}
