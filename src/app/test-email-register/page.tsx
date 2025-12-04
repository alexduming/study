import { EmailVerificationSignUp } from '@/shared/components/auth/email-verification-sign-up';
import { getAllConfigs } from '@/shared/models/config';

export const metadata = {
  title: '邮箱注册测试 - Study',
};

export default async function TestEmailRegisterPage() {
  // 获取配置
  const configs = await getAllConfigs();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            邮箱注册流程测试
          </h1>
          <p className="text-gray-600">
            测试完整的邮箱验证注册流程
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <EmailVerificationSignUp configs={configs} />
        </div>

        <div className="max-w-2xl mx-auto mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">测试流程说明</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>输入邮箱地址，点击"发送验证邮件"</li>
            <li>查看控制台输出的验证链接（开发环境）</li>
            <li>点击验证链接或手动访问链接</li>
            <li>在验证页面设置密码和姓名</li>
            <li>完成注册流程</li>
          </ol>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">开发环境说明</h3>
            <p className="text-blue-800 text-sm">
              在开发环境中，邮件服务使用模拟模式。验证链接会显示在浏览器控制台中，
              您可以直接点击链接进行测试，无需查收真实邮件。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}