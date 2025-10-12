import { findPost, PostStatus } from "@/shared/services/post";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Post as PostType } from "@/shared/types/blocks/blog";
import { Empty } from "@/shared/blocks/common";
import { getThemePage } from "@/core/theme";
import moment from "moment";
import { envConfigs } from "@/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("blog.metadata");

  const canonicalUrl =
    locale !== envConfigs.default_locale
      ? `${envConfigs.app_url}/${locale}/blog/${slug}`
      : `${envConfigs.app_url}/blog/${slug}`;

  const post = await findPost({ slug, status: PostStatus.PUBLISHED });
  if (!post) {
    return {
      title: `${slug} | ${t("title")}`,
      description: t("description"),
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: `${post.title} | ${t("title")}`,
    description: post.description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // load blog data
  const t = await getTranslations("blog");

  // get post data
  const postData = await findPost({ slug });
  if (!postData) {
    return <Empty message={`Post not found`} />;
  }

  // build post data
  const post: PostType = {
    id: postData.id,
    slug: postData.slug,
    title: postData.title || "",
    description: postData.description || "",
    content: postData.content || "",
    created_at: moment(postData.createdAt).format("MMM D, YYYY") || "",
    author_name: postData.authorName || envConfigs.app_name || "",
    author_image: postData.authorImage || "/logo.png",
    author_role: "",
    url: `/blog/${postData.slug}`,
  };

  // load page component
  const Page = await getThemePage("blog-detail");

  return <Page locale={locale} post={post} />;
}
