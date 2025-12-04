import { NextResponse } from 'next/server';

import OpenRouterService from '@/shared/services/openrouter';

/**
 * 非程序员解释：
 * - 这个接口负责把已经整理好的学习笔记，转换为一篇「播客脚本」。
 * - 前端只需要把笔记文本发到 /api/ai/podcast，就能拿到完整的播客脚本文字。
 * - OpenRouter 的密钥同样只在服务器端读取，前端永远看不到。
 */
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

    const aiService = OpenRouterService.getInstance();

    const result = await aiService.generatePodcastScript(
      content,
      voiceStyle ?? 'professional'
    );

    return NextResponse.json(result);
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


