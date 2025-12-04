import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationService } from '@/shared/services/email-verification-service';

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();

    if (!token || !email) {
      return NextResponse.json(
        { error: '验证令牌和邮箱是必填项' },
        { status: 400 }
      );
    }

    const result = await EmailVerificationService.verifyToken(token, email);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('验证令牌 API 错误:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}