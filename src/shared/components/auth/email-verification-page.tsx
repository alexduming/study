'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

interface Props {
  status: 'loading' | 'success' | 'error';
  message: string;
  showResendButton?: boolean;
  email?: string;
}

export function EmailVerificationPage({
  status,
  message,
  showResendButton = false,
  email,
}: Props) {
  const t = useTranslations('common');
  const router = useRouter();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState(email || '');
  const [resendMessage, setResendMessage] = useState('');

  const handleResendEmail = async () => {
    if (!resendEmail) {
      setResendMessage('请输入邮箱地址');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: resendEmail,
          type: 'registration',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResendMessage('验证邮件已重新发送，请查收邮件');

        // 开发环境下显示调试链接
        if (data.debugUrl) {
          console.log('🔗 开发环境验证链接:', data.debugUrl);
          setResendMessage(prev => prev + `\n\n开发环境验证链接: ${data.debugUrl}`);
        }
      } else {
        setResendMessage(data.error || '发送失败，请稍后重试');
      }
    } catch (error) {
      console.error('重新发送验证邮件错误:', error);
      setResendMessage('发送失败，请稍后重试');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && '验证邮箱中...'}
            {status === 'success' && '邮箱验证成功！'}
            {status === 'error' && '邮箱验证失败'}
          </CardTitle>
          <CardDescription className={`text-center ${getStatusColor()}`}>
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              前往登录
            </Button>
          )}

          {showResendButton && (
            <div className="space-y-4 pt-4 border-t">
              <div className="text-center text-sm text-gray-600">
                需要重新发送验证邮件？
              </div>

              {!email && (
                <div className="space-y-2">
                  <Label htmlFor="resend-email">邮箱地址</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="请输入您的邮箱地址"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中...
                  </>
                ) : (
                  '重新发送验证邮件'
                )}
              </Button>

              {resendMessage && (
                <div className={`text-sm text-center ${
                  resendMessage.includes('成功') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {resendMessage}
                </div>
              )}
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => router.push('/sign-up')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              返回注册页面
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}