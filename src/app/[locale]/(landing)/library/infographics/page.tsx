import Image from 'next/image';
import Link from 'next/link';
import { Clock, Image as ImageIcon } from 'lucide-react';

import { getUserInfographicTasksAction } from '@/app/actions/ai_task';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/shared/components/ui/card';

/**
 * 信息图历史列表页面（/library/infographics）
 *
 * 非程序员解释：
 * - 这个页面会读取你在“AI 信息图生成器”里发起过的任务（数据来自 ai_task 表）
 * - 每一条记录会展示：生成时间、使用的提供商、任务状态，以及（如果有的话）一张缩略图
 * - 现在我们只做“只读列表”，真正的图片生成和下载逻辑仍然在 /infographic 页面里完成
 */
export default async function InfographicsPage() {
  // 从后端读取当前用户最近的 Infographic 任务
  const tasks = await getUserInfographicTasksAction();

  // 没有任何任务时，展示一个友好的空状态，引导用户去生成第一张信息图
  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-muted/10 flex flex-col items-center justify-center rounded-lg border border-dashed py-24 text-center">
        <div className="bg-muted mb-4 rounded-full p-4">
          <ImageIcon className="text-muted-foreground h-8 w-8" />
        </div>
        <h3 className="mb-2 text-xl font-semibold capitalize">
          Infographics Library
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your generated infographics will appear here. Start creating new
          content to build your library.
        </p>
        <Link href="/infographic">
          <Button variant="outline">Generate New Infographics</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Infographics</h2>
        <Link href="/infographic">
          <Button variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" />
            Generate New Infographics
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => {
          // 尝试从 taskResult 中解析出图片 URL（如果是同步接口生成的任务，这里会有一张或多张图片）
          let firstImageUrl: string | null = null;
          try {
            if (task.taskResult) {
              const parsed = JSON.parse(task.taskResult);
              if (Array.isArray(parsed.imageUrls) && parsed.imageUrls.length > 0) {
                firstImageUrl = parsed.imageUrls[0];
              }
            }
          } catch {
            // 解析失败时忽略图片，继续展示其它文字信息
            firstImageUrl = null;
          }

          // 状态徽标颜色简单做一个映射，后续如果要更加精细的 mapping 可以再细化
          const status = task.status || 'pending';
          const statusVariant =
            status === 'success'
              ? 'default'
              : status === 'failed'
                ? 'destructive'
                : 'secondary';

          return (
            <Card
              key={task.id}
              className="hover:border-primary group overflow-hidden transition-all hover:shadow-md"
            >
              <div className="bg-muted relative aspect-video w-full overflow-hidden">
                {firstImageUrl ? (
                  <Image
                    src={firstImageUrl}
                    alt="Infographic preview"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="bg-secondary/50 flex h-full w-full items-center justify-center">
                    <ImageIcon className="text-muted-foreground/50 h-12 w-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={statusVariant}>{status}</Badge>
                </div>
              </div>

              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {task.provider || 'Unknown Provider'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {task.model}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-2">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {/* 这里的 prompt 我们在写入时只存了一句简要描述，避免把整篇文档塞到数据库 */}
                  {task.prompt}
                </p>
              </CardContent>

              <CardFooter className="flex items-center justify-between px-4 pb-4 pt-0 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="mr-1 h-3 w-3" />
                  {task.createdAt
                    ? new Date(task.createdAt).toLocaleString()
                    : ''}
                </div>
                <span className="text-[11px]">
                  Credits: {task.costCredits ?? 0}
                </span>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
