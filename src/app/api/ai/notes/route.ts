import { NextResponse } from 'next/server';

import OpenRouterService from '@/shared/services/openrouter';

/**
 * 非程序员解释：
 * - 这个接口是「后端专用的 AI 网关」，专门负责帮前端调用 OpenRouter 生成学习笔记。
 * - 前端页面不会直接拿着 API Key 去请求 OpenRouter，而是只请求我们自己的 /api/ai/notes。
 * - 好处：真正的 OPENROUTER_API_KEY 只存在服务器环境变量里，用户在浏览器里看不到。
 *
 * 安全设计要点（对应"精 / 准 / 净"）：
 * - 精：前端只知道一个简单的 HTTP 接口，复杂提示词和 OpenRouter 细节全部藏在服务端。
 * - 准：所有与 OpenRouter 相关的逻辑都集中在 OpenRouterService + 这条路由里，出错好排查。
 * - 净：不改动现有的 AI 页面业务逻辑结构，只是把"直接调 service"改成"调后端接口"。
 *
 * Vercel 配置：
 * - maxDuration: 60 秒（需要 Pro 计划，避免超时）
 * - dynamic: 强制动态渲染（不缓存 AI 生成的内容）
 */

// Vercel 配置：设置最大执行时间为 60 秒（需要 Pro 计划）
// 如果使用 Hobby 计划，此设置无效，最大 10 秒
export const maxDuration = 60;

// 强制动态渲染，不缓存 AI 生成的内容
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    /**
     * 期望的入参结构（前端会按照这个格式传）：
     * {
     *   content: string;       // 资料的文字内容（已经从文件中提取好）
     *   type: 'audio' | 'video' | 'pdf' | 'text';
     *   fileName?: string;     // 原始文件名，方便用于提示词
     *   outputLanguage?: string; // 目标语言，'auto' | 'zh' | 'en' | 其他语言编码
     * }
     */
    const { content, type, fileName, outputLanguage } = body || {};

    if (!content || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: content or type',
        },
        { status: 400 }
      );
    }

    const aiService = OpenRouterService.getInstance();

    const result = await aiService.generateNotes({
      content,
      type,
      fileName,
      outputLanguage,
    });

    // 这里直接把 service 的返回透传给前端，保证前端改动最小。
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /api/ai/notes error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate notes. Please try again later.',
      },
      { status: 500 }
    );
  }
}


