import { NextResponse } from 'next/server';

import OpenRouterService from '@/shared/services/openrouter';

/**
 * 非程序员解释：
 * - 这个接口负责把一段学习内容，转换成一组可以练习的「测验题」。
 * - 前端只需要把文本和题目数量发到 /api/ai/quiz，就能拿到 JSON 形式的问题列表。
 * - OpenRouter 的密钥仍然只在服务器端，通过 OPENROUTER_API_KEY 读取。
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    /**
     * 期望的入参结构：
     * {
     *   content: string;        // 用于出题的原始内容
     *   questionCount?: number; // 希望生成多少道题，默认 5
     * }
     */
    const { content, questionCount } = body || {};

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid content field',
          questions: [],
        },
        { status: 400 }
      );
    }

    const aiService = OpenRouterService.getInstance();

    const result = await aiService.generateQuiz(
      content,
      typeof questionCount === 'number' ? questionCount : 5
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/ai/quiz error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate quiz. Please try again later.',
        questions: [],
      },
      { status: 500 }
    );
  }
}


