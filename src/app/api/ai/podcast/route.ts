import { NextResponse } from 'next/server';

import OpenRouterService from '@/shared/services/openrouter';
import { getUserInfo } from '@/shared/models/user';
import { consumeCredits, getRemainingCredits } from '@/shared/models/credit';

/**
 * 非程序员解释：
 * - 这个接口负责把已经整理好的学习笔记，转换为一篇「播客脚本」。
 * - 前端只需要把笔记文本发到 /api/ai/podcast，就能拿到完整的播客脚本文字。
 * - OpenRouter 的密钥同样只在服务器端读取，前端永远看不到。
 */

// Vercel 配置：设置最大执行时间为 60 秒（需要 Pro 计划）
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /**
     * 期望的入参结构：
     * {
     *   content: string;                         // 用于生成播客的文字内容（通常是学习笔记）
     *   voiceStyle?: 'professional' | 'friendly' | 'academic'; // 语气风格
     * }
     */
    const { content, voiceStyle } = body || {};

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid content field',
          script: '',
        },
        { status: 400 }
      );
    }

    /**
     * Podcast功能升级提示
     * 
     * 非程序员解释：
     * - 根据需求3，Podcast功能正在升级中
     * - 在功能完善之前，暂时返回升级提示
     * - 用户点击"生成播客"后会看到友好的提示信息
     */
    return NextResponse.json(
      {
        success: false,
        error: 'Podcast feature is currently being upgraded. Please try again later.',
        upgrading: true, // 标记为升级中
        script: '',
      },
      { status: 503 } // 503 Service Unavailable
    );

    /* 
    // 以下代码在Podcast功能升级完成后启用：
    
    // 积分验证和消耗
    const user = await getUserInfo();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please sign in to use AI features',
          script: '',
        },
        { status: 401 }
      );
    }

    const remainingCredits = await getRemainingCredits(user.id);
    const requiredCredits = 3;

    if (remainingCredits < requiredCredits) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient credits. Required: ${requiredCredits}, Available: ${remainingCredits}`,
          insufficientCredits: true,
          requiredCredits,
          remainingCredits,
          script: '',
        },
        { status: 402 }
      );
    }

    // 消耗积分
    try {
      await consumeCredits({
        userId: user.id,
        credits: requiredCredits,
        scene: 'ai_podcast',
        description: `AI Podcast - Generate podcast script`,
        metadata: JSON.stringify({ voiceStyle }),
      });
    } catch (creditError: any) {
      console.error('Failed to consume credits:', creditError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to consume credits. Please try again.',
          script: '',
        },
        { status: 500 }
      );
    }

    const aiService = OpenRouterService.getInstance();

    const result = await aiService.generatePodcastScript(
      content,
      voiceStyle ?? 'professional'
    );

    return NextResponse.json(result);
    */
  } catch (error: any) {
    console.error('API /api/ai/podcast error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate podcast script. Please try again later.',
        script: '',
      },
      { status: 500 }
    );
  }
}


