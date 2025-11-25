'use client';

import { motion } from 'framer-motion';
import { Brain, FileText, MessageSquare, Users, Zap, Headphones } from 'lucide-react';

import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Features as FeaturesType } from '@/shared/types/blocks/landing';

// 图标映射
const iconMap = {
  Brain,
  FileText,
  MessageSquare,
  Users,
  Zap,
  Headphones,
};

export function Features({
  features,
  className,
}: {
  features: FeaturesType;
  className?: string;
}) {
  return (
    <section
      id={features.id}
      className={cn(
        'relative py-24 md:py-32 bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950',
        features.className,
        className
      )}
    >
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative container">
        <ScrollAnimation>
          <div className="mx-auto max-w-4xl text-center text-balance mb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl mb-6">
                {features.title}
              </h2>
              <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
                {features.description}
              </p>
            </motion.div>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.items?.map((item, idx) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Brain;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: idx * 0.1,
                    ease: "backOut"
                  }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="relative h-full p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5 backdrop-blur-sm transition-all duration-300 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10">

                    {/* 背景光效 */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* 内容 */}
                    <div className="relative z-10 space-y-6">
                      {/* 图标容器 */}
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-1">
                        <div className="h-full w-full rounded-xl bg-gray-950 flex items-center justify-center">
                          <IconComponent className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>

                      {/* 标题和描述 */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-bold text-white">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* 装饰线 */}
                      <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
                    </div>

                    {/* 悬停效果 */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border border-purple-400/30"
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ opacity: 1, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        boxShadow: '0 0 40px rgba(168, 85, 247, 0.1)',
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollAnimation>

        {/* 底部装饰 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 flex justify-center"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}