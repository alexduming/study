'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCw, Check, X, Plus, Brain, BarChart3, Clock, Target, Loader2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { OpenRouterService } from '@/shared/services/openrouter';
import { useTranslations } from 'next-intl';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
  reviewCount: number;
}

const FlashcardsApp = () => {
  const t = useTranslations('flashcards');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    {
      id: 1,
      front: "什么是机器学习？",
      back: "机器学习是人工智能的一个分支，它使计算机系统能够从经验中学习和改进，而无需明确编程。",
      difficulty: 'medium',
      reviewCount: 3,
      lastReviewed: new Date(Date.now() - 86400000), // 1天前
      nextReview: new Date(Date.now() + 86400000), // 1天后
    },
    {
      id: 2,
      front: "深度学习与机器学习的区别是什么？",
      back: "深度学习是机器学习的一个子集，使用多层神经网络来学习数据的复杂模式。它特别适合处理大规模、高维度的数据。",
      difficulty: 'hard',
      reviewCount: 1,
      lastReviewed: new Date(Date.now() - 172800000), // 2天前
      nextReview: new Date(Date.now() - 86400000), // 应该复习
    },
    {
      id: 3,
      front: "什么是神经网络？",
      back: "神经网络是一种受生物大脑启发的计算模型，由相互连接的节点（神经元）组成，能够处理和学习复杂的模式。",
      difficulty: 'easy',
      reviewCount: 5,
      lastReviewed: new Date(Date.now() - 432000000), // 5天前
      nextReview: new Date(Date.now() + 2592000000), // 30天后
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCardContent, setNewCardContent] = useState('');
  const [generationError, setGenerationError] = useState('');

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<'review' | 'new' | 'all'>('review');
  const [showStats, setShowStats] = useState(false);

  const currentCard = flashcards[currentCardIndex];
  const dueCards = flashcards.filter(card =>
    !card.nextReview || card.nextReview <= new Date()
  );

  useEffect(() => {
    // 自动切换到需要复习的卡片
    if (dueCards.length > 0 && studyMode === 'review') {
      const dueIndex = flashcards.findIndex(card => card.id === dueCards[0].id);
      setCurrentCardIndex(dueIndex);
    }
  }, [studyMode]);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const updatedCards = [...flashcards];
    const card = updatedCards[currentCardIndex];

    // 更新复习间隔（简化的间隔重复算法）
    card.reviewCount++;
    card.lastReviewed = new Date();

    let intervalDays = 1;
    switch (rating) {
      case 'again':
        intervalDays = 1;
        card.difficulty = 'hard';
        break;
      case 'hard':
        intervalDays = 3;
        if (card.difficulty === 'easy') card.difficulty = 'medium';
        break;
      case 'good':
        intervalDays = card.difficulty === 'easy' ? 7 : card.difficulty === 'medium' ? 5 : 4;
        if (card.difficulty === 'hard') card.difficulty = 'medium';
        break;
      case 'easy':
        intervalDays = card.difficulty === 'easy' ? 14 : 10;
        card.difficulty = 'easy';
        break;
    }

    card.nextReview = new Date(Date.now() + intervalDays * 86400000);

    setFlashcards(updatedCards);
    setIsFlipped(false);

    // 移动到下一张卡片
    moveToNextCard();
  };

  const handleGenerateFlashcards = async () => {
    if (!newCardContent.trim()) {
      setGenerationError(t('create.error'));
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const aiService = OpenRouterService.getInstance();
      const result = await aiService.generateFlashcards(newCardContent, 10);

      if (result.success && result.flashcards.length > 0) {
        const newFlashcards: Flashcard[] = result.flashcards.map((fc, index) => ({
          id: Date.now() + index, // 确保唯一ID
          front: fc.front,
          back: fc.back,
          difficulty: fc.difficulty as 'easy' | 'medium' | 'hard',
          reviewCount: 0,
          lastReviewed: undefined,
          nextReview: new Date(),
        }));

        setFlashcards([...newFlashcards, ...flashcards]);
        setNewCardContent('');
        setShowCreateForm(false);
        setCurrentCardIndex(0);
        setStudyMode('new');
      } else {
        setGenerationError(result.error || t('create.generation_error'));
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setGenerationError(t('create.generation_error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const moveToNextCard = () => {
    const availableCards = studyMode === 'review' ? dueCards :
                         studyMode === 'new' ? flashcards.filter(card => card.reviewCount === 0) :
                         flashcards;

    if (availableCards.length > 1) {
      const currentIndex = availableCards.findIndex(card => card.id === currentCard.id);
      const nextIndex = (currentIndex + 1) % availableCards.length;
      const nextCard = availableCards[nextIndex];
      const nextGlobalIndex = flashcards.findIndex(card => card.id === nextCard.id);
      setCurrentCardIndex(nextGlobalIndex);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const stats = {
    total: flashcards.length,
    due: dueCards.length,
    mastered: flashcards.filter(card => card.difficulty === 'easy' && card.reviewCount >= 3).length,
    learning: flashcards.filter(card => card.difficulty !== 'easy' || card.reviewCount < 3).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        <ScrollAnimation>
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl mb-6">
                {t('title')}
              </h1>
              <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto">
                {t('subtitle')}
              </p>
            </motion.div>
          </div>
        </ScrollAnimation>

        {/* 统计信息 */}
        <ScrollAnimation delay={0.2}>
          <div className="max-w-4xl mx-auto mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Brain, label: t('stats.total_cards'), value: stats.total, color: 'text-purple-400' },
                { icon: Clock, label: t('stats.due_cards'), value: stats.due, color: 'text-yellow-400' },
                { icon: Target, label: t('stats.mastered_cards'), value: stats.mastered, color: 'text-green-400' },
                { icon: BarChart3, label: t('stats.learning_cards'), value: stats.learning, color: 'text-blue-400' },
              ].map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-purple-500/20 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                      <div>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                        <p className="text-white text-xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </ScrollAnimation>

        {/* 学习模式选择 */}
        <ScrollAnimation delay={0.3}>
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex justify-center gap-4">
              {[
                { id: 'review', label: t('modes.review'), count: dueCards.length },
                { id: 'new', label: t('modes.new_cards'), count: flashcards.filter(card => card.reviewCount === 0).length },
                { id: 'all', label: t('modes.all_cards'), count: flashcards.length },
              ].map((mode) => (
                <Button
                  key={mode.id}
                  onClick={() => setStudyMode(mode.id as any)}
                  variant={studyMode === mode.id ? 'default' : 'outline'}
                  className={studyMode === mode.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'border-purple-500/30 text-purple-300 hover:border-purple-500/50'
                  }
                >
                  {mode.label}
                  {mode.count > 0 && (
                    <span className="ml-2 bg-purple-500/20 px-2 py-1 rounded-full text-xs">
                      {mode.count}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* 闪卡主体 */}
        <ScrollAnimation delay={0.4}>
          <div className="max-w-2xl mx-auto">
            {currentCard ? (
              <div className="relative">
                {/* 闪卡 */}
                <motion.div
                  className="relative h-96 cursor-pointer"
                  onClick={handleFlip}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl" />

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isFlipped ? 'back' : 'front'}
                      initial={{ rotateY: 180, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -180, opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="relative bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-8 h-full flex flex-col justify-center items-center text-center"
                    >
                      {!isFlipped ? (
                        <div>
                          <div className="mb-4">
                            <span className={`text-sm font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
                              {t(`card.difficulty.${currentCard.difficulty}`)}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">
                              {t('card.review_count')} {currentCard.reviewCount}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-white mb-4">
                            {currentCard.front}
                          </h3>
                          <p className="text-gray-400 text-sm">{t('card.click_to_flip')}</p>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-4">
                            {currentCard.back}
                          </h3>
                          <p className="text-gray-400 text-sm">{t('card.click_to_return')}</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                {/* 进度指示器 */}
                <div className="flex justify-center gap-2 mt-6">
                  {flashcards.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        idx === currentCardIndex
                          ? 'bg-purple-400 w-8'
                          : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* 评分按钮 */}
                {isFlipped && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-center gap-3 mt-8"
                  >
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRating('again'); }}
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:border-red-500/50 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t('rating.again')}
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRating('hard'); }}
                      variant="outline"
                      className="border-orange-500/30 text-orange-400 hover:border-orange-500/50 hover:bg-orange-500/10"
                    >
                      {t('rating.hard')}
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRating('good'); }}
                      variant="outline"
                      className="border-blue-500/30 text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/10"
                    >
                      {t('rating.good')}
                    </Button>
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleRating('easy'); }}
                      variant="outline"
                      className="border-green-500/30 text-green-400 hover:border-green-500/50 hover:bg-green-500/10"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {t('rating.easy')}
                    </Button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <Brain className="h-20 w-20 text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white mb-4">
                  {studyMode === 'review' ? t('empty_state.no_due_cards') : t('empty_state.no_cards')}
                </h3>
                <p className="text-gray-400 mb-6">
                  {studyMode === 'review' ? t('empty_state.no_due_cards_desc') : t('empty_state.no_cards_desc')}
                </p>
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('empty_state.create_cards')}
                </Button>
              </div>
            )}
          </div>
        </ScrollAnimation>

        {/* 快捷操作 */}
        <ScrollAnimation delay={0.5}>
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('quick_actions.ai_generate')}
                </Button>
                <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 justify-start">
                  <RotateCw className="h-4 w-4 mr-2" />
                  {t('quick_actions.reset_progress')}
                </Button>
                <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 justify-start">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('quick_actions.view_stats')}
                </Button>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* 创建闪卡表单 */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl border border-purple-500/20 p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-6">{t('create.title')}</h3>
              <textarea
                value={newCardContent}
                onChange={(e) => setNewCardContent(e.target.value)}
                placeholder={t('create.placeholder')}
                className="w-full h-48 p-4 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none mb-4"
              />
              {generationError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{generationError}</p>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setGenerationError('');
                    setNewCardContent('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:border-gray-500"
                >
                  {t('buttons.cancel')}
                </Button>
                <Button
                  onClick={handleGenerateFlashcards}
                  disabled={isGenerating || !newCardContent.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('create.ai_generating')}
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      {t('create.generate')}
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FlashcardsApp;