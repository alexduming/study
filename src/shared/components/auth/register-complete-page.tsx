'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
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
import { toast } from 'sonner';

interface Props {
  email: string;
  token: string;
}

export function RegisterCompletePage({ email, token }: Props) {
  const t = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (loading) return;

    // 验证表单
    if (!name.trim()) {
      toast.error('请输入您的姓名');
      return;
    }

    if (password.length < 6) {
      toast.error('密码至少需要6个字符');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register-with-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name.trim(),
          token,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('注册成功！欢迎加入Study！');
        // 跳转到登录页面或用户仪表板
        router.push('/sign-in');
      } else {
        toast.error(data.error || '注册失败，请稍后重试');
      }
    } catch (error) {
      console.error('注册错误:', error);
      toast.error('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">
            完成注册
          </CardTitle>
          <CardDescription>
            您的邮箱 <span className="font-medium text-blue-600">{email}</span> 已验证成功
            <br />
            请设置您的账户信息以完成注册
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              type="text"
              placeholder="请输入您的姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码（至少6个字符）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">确认密码</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                注册中...
              </>
            ) : (
              '完成注册'
            )}
          </Button>

          <div className="text-center pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => router.push('/sign-in')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              已有账户？前往登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}