'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

import { Link } from '@/core/i18n/navigation';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Hero as HeroType } from '@/shared/types/blocks/landing';

// 动画光束效果组件
const Beams = () => {
  return (
    <svg
      viewBox="0 0 1200 800"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="beam1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="beam2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="800" fill="url(#beam1)" opacity="0.5">
        <animate
          attributeName="x"
          from="-1200"
          to="1200"
          dur="20s"
          repeatCount="indefinite"
        />
      </rect>
      <rect x="0" y="0" width="1200" height="800" fill="url(#beam2)" opacity="0.5">
        <animate
          attributeName="x"
          from="1200"
          to="-1200"
          dur="25s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
};

// Turbo 吉祥物组件
const TurboMascot = () => {
  return (
    <motion.div
      className="relative mx-auto h-32 w-32"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        duration: 0.8,
        ease: "backOut",
        delay: 0.2
      }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 p-1">
        <div className="h-full w-full rounded-full bg-gray-950 flex items-center justify-center">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="h-12 w-12 text-purple-400" />
          </motion.div>
        </div>
      </div>
      {/* 动画光环 */}
      <motion.div
        className="absolute -inset-2 rounded-full border-2 border-purple-500/30"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
};

const createFadeInVariant = (delay: number) => ({
  initial: {
    opacity: 0,
    y: 30,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  transition: {
    duration: 0.8,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

export function Hero({
  hero,
  className,
}: {
  hero: HeroType;
  className?: string;
}) {
  const highlightText = hero.highlight_text ?? '';
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <section
        id={hero.id}
        className={cn(
          "relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950",
          hero.className,
          className
        )}
      >
        {/* 光束效果背景 */}
        <div className="absolute inset-0 overflow-hidden">
          <Beams />
        </div>

        {/* 渐变叠加 */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-950/50" />

        {/* 动画粒子背景 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-purple-400"
              initial={{
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
                opacity: Math.random() * 0.5,
              }}
              animate={{
                y: [0, -100, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
          {/* 公告栏 */}
          {hero.announcement && (
            <motion.div {...createFadeInVariant(0)}>
              <Link
                href={hero.announcement.url || ''}
                target={hero.announcement.target || '_self'}
                className="group mx-auto mb-8 inline-flex items-center gap-3 rounded-full border border-purple-500/30 bg-purple-500/10 px-6 py-3 text-sm backdrop-blur-sm transition-all duration-300 hover:border-purple-500/50 hover:bg-purple-500/20"
              >
                <Zap className="h-4 w-4 text-purple-400" />
                <span className="text-purple-200">
                  {hero.announcement.title}
                </span>
                <ArrowRight className="h-4 w-4 text-purple-400 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          )}

          {/* 吉祥物 */}
          <motion.div {...createFadeInVariant(0.2)}>
            <TurboMascot />
          </motion.div>

          {/* 主标题 */}
          <motion.div {...createFadeInVariant(0.4)} className="mt-8">
            {texts && texts.length > 0 ? (
              <h1 className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
                {texts[0]}
                <span className="relative">
                  <span className="absolute inset-0 blur-xl bg-gradient-to-r from-purple-400 to-blue-400 opacity-50"></span>
                  <span className="relative bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {highlightText}
                  </span>
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-5xl font-bold text-transparent sm:text-6xl md:text-7xl lg:text-8xl">
                {hero.title}
              </h1>
            )}
          </motion.div>

          {/* 描述文本 */}
          <motion.p
            {...createFadeInVariant(0.6)}
            className="mx-auto mt-8 max-w-2xl text-lg text-gray-300 sm:text-xl md:text-2xl"
            dangerouslySetInnerHTML={{ __html: hero.description ?? '' }}
          />

          {/* 按钮组 */}
          {hero.buttons && (
            <motion.div
              {...createFadeInVariant(0.8)}
              className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              {hero.buttons.map((button, idx) => (
                <Button
                  asChild
                  size={button.size || 'lg'}
                  variant={idx === 0 ? 'default' : 'outline'}
                  className={cn(
                    "px-8 py-6 text-lg font-medium transition-all duration-300",
                    idx === 0
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-purple-500/25"
                      : "border-purple-500/30 text-purple-200 hover:border-purple-500/50 hover:bg-purple-500/10"
                  )}
                  key={idx}
                >
                  <Link
                    href={button.url ?? ''}
                    target={button.target ?? '_self'}
                  >
                    {button.title}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ))}
            </motion.div>
          )}

          {/* 提示文本 */}
          {hero.tip && (
            <motion.p
              {...createFadeInVariant(1)}
              className="mt-8 text-center text-sm text-gray-400"
              dangerouslySetInnerHTML={{ __html: hero.tip ?? '' }}
            />
          )}
        </div>

        {/* 底部渐变淡出效果 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-950 to-transparent" />
      </section>
    </>
  );
}