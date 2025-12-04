'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

import { Link } from '@/core/i18n/navigation';
import { defaultLocale } from '@/config/locale';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

import { SocialProviders } from '@/shared/blocks/sign/social-providers';

interface Props {
  configs: Record<string, string>;
  callbackUrl?: string;
}

export function EmailVerificationSignUp({ configs, callbackUrl = '/' }: Props) {
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const isGoogleAuthEnabled = configs.google_auth_enabled === 'true';
  const isGithubAuthEnabled = configs.github_auth_enabled === 'true';
  const isEmailAuthEnabled =
    configs.email_auth_enabled !== 'false' ||
    (!isGoogleAuthEnabled && !isGithubAuthEnabled);

  const handleSendVerification = async () => {
    if (loading) return;

    if (!email || !email.trim()) {
      toast.error('请输入邮箱地址');
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          type: 'registration',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSentEmail(email);
        toast.success('验证邮件已发送，请查收邮件并点击链接完成注册');

        // 开发环境下显示调试链接
        if (data.debugUrl) {
          console.log('🔗 开发环境验证链接:', data.debugUrl);
          toast.info(`开发环境验证链接: ${data.debugUrl}`);
        }
      } else {
        toast.error(data.error || '发送失败，请稍后重试');
      }
    } catch (error) {
      console.error('发送验证邮件错误:', error);
      toast.error('发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = () => {
    // 社交登录逻辑可以在这里实现
    // 暂时跳转到原有的社交登录页面
    router.push('/sign-up');
  };

  if (callbackUrl) {
    if (
      locale !== defaultLocale &&
      callbackUrl.startsWith('/') &&
      !callbackUrl.startsWith(`/${locale}`)
    ) {
      callbackUrl = `/${locale}${callbackUrl}`;
    }
  }

  // 如果已经发送了验证邮件，显示等待页面
  if (sentEmail) {
    return (
      <Card className="mx-auto w-full md:max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-blue-500" />
          </div>
          <CardTitle className="text-lg md:text-xl">
            验证邮件已发送
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            我们已向 <span className="font-medium">{sentEmail}</span> 发送了验证邮件
            <br />
            请查收邮件并点击链接完成注册
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">接下来：</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>查收您的邮箱</li>
              <li>点击邮件中的验证链接</li>
              <li>设置密码完成注册</li>
            </ol>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              没有收到邮件？请检查垃圾邮件文件夹
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSentEmail('')}
              disabled={loading}
            >
              使用其他邮箱
            </Button>
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex w-full justify-center border-t py-4">
            <p className="text-center text-xs text-neutral-500">
              已有账户？
              <Link href="/sign-in" className="underline">
                <span className="cursor-pointer dark:text-white/70">
                  立即登录
                </span>
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full md:max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          <h1>创建账户</h1>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <h2>开始您的学习之旅</h2>
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          {isEmailAuthEnabled && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱地址"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                onClick={handleSendVerification}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    发送验证邮件
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    或
                  </span>
                </div>
              </div>
            </>
          )}

          <SocialProviders
            configs={configs}
            callbackUrl={callbackUrl}
            loading={loading}
            setLoading={setLoading}
            buttonText="使用社交账户注册"
          />
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full justify-center border-t py-4">
          <p className="text-center text-xs text-neutral-500">
            已有账户？
            <Link href="/sign-in" className="underline">
              <span className="cursor-pointer dark:text-white/70">
                立即登录
              </span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}