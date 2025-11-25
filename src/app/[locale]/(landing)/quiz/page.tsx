'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Target, Trophy, Brain, BookOpen, Lightbulb, Loader2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { OpenRouterService } from '@/shared/services/openrouter';
import { useTranslations } from 'next-intl';

interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  hints?: string[];
}

interface UserAnswer {
  questionId: number;
  userAnswer: string | number;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
}

const QuizApp = () => {
  const t = useTranslations('quiz');
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 1,
      type: 'multiple-choice',
      question: "机器学习中的过拟合是指什么？",
      options: [
        "模型在训练数据上表现很好，但在新数据上表现较差",
        "模型在训练数据和新数据上都表现很好",
        "模型在训练数据上表现较差，但在新数据上表现很好",
        "模型在训练数据和新数据上都表现较差"
      ],
      correctAnswer: 0,
      explanation: "过拟合是指模型过于复杂，过度适应了训练数据的噪声和特征，导致在新的、未见过的数据上表现不佳。",
      difficulty: 'medium',
      topic: "机器学习基础",
      hints: ["考虑模型在不同数据集上的表现差异", "训练误差和测试误差的对比"]
    },
    {
      id: 2,
      type: 'true-false',
      question: "深度学习必须使用GPU才能运行。",
      correctAnswer: 1, // false
      explanation: "虽然GPU能显著加速深度学习训练，但并不是必需的。深度学习模型也可以在CPU上运行，只是速度较慢。",
      difficulty: 'easy',
      topic: "深度学习硬件",
      hints: ["考虑CPU和GPU的作用差异"]
    },
    {
      id: 3,
      type: 'fill-blank',
      question: "在监督学习中，我们通常将数据集分为训练集、______和测试集。",
      correctAnswer: "验证集",
      explanation: "验证集用于调整模型的超参数和评估模型性能，测试集用于最终评估模型的泛化能力。",
      difficulty: 'easy',
      topic: "数据集划分",
      hints: ["思考模型训练过程中需要哪些数据集"]
    }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [quizContent, setQuizContent] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [questionCount, setQuestionCount] = useState(5);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number>('');
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [currentHints, setCurrentHints] = useState<string[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [usedHints, setUsedHints] = useState<Set<number>>(new Set());

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (quizStarted && !quizCompleted) {
      setQuestionStartTime(Date.now());
    }
  }, [currentQuestionIndex, quizStarted, quizCompleted]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuestionStartTime(Date.now());
  };

  const handleGenerateQuiz = async () => {
    if (!quizContent.trim()) {
      setGenerationError('请输入要生成测验的内容');
      return;
    }

    setIsGenerating(true);
    setGenerationError('');

    try {
      const aiService = OpenRouterService.getInstance();
      const result = await aiService.generateQuiz(quizContent, questionCount);

      if (result.success && result.questions.length > 0) {
        const newQuestions: Question[] = result.questions.map((q, index) => ({
          id: Date.now() + index, // 确保唯一ID
          type: q.type,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
          topic: q.topic,
          hints: q.hints || []
        }));

        setQuestions(newQuestions);
        setQuizContent('');
        setShowGenerateForm(false);
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setSelectedAnswer('');
        setIsFlipped(false);
        setShowResult(false);
        setQuizCompleted(false);
      } else {
        setGenerationError(result.error || '生成测验时出错');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setGenerationError('生成测验时出错，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answer: string | number) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === '') return;

    const timeSpent = Date.now() - questionStartTime;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const hintsUsedCount = currentHints.length;

    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpent,
      hintsUsed: hintsUsedCount
    };

    setUserAnswers([...userAnswers, answer]);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setShowResult(false);
      setShowExplanation(false);
      setCurrentHints([]);
      setUsedHints(new Set());
    } else {
      setQuizCompleted(true);
    }
  };

  const handleShowHint = () => {
    if (currentQuestion.hints && currentHints.length < currentQuestion.hints.length) {
      const nextHintIndex = currentHints.length;
      setCurrentHints([...currentHints, currentQuestion.hints[nextHintIndex]]);
      setUsedHints(new Set([...usedHints, currentQuestion.id]));
    }
  };

  const calculateScore = () => {
    const correctAnswers = userAnswers.filter(answer => answer.isCorrect).length;
    return {
      correct: correctAnswers,
      total: questions.length,
      percentage: Math.round((correctAnswers / questions.length) * 100),
      averageTime: Math.round(userAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0) / userAnswers.length / 1000),
      totalHintsUsed: usedHints.size
    };
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950 flex items-center justify-center">
        <div className="relative z-10 container mx-auto px-4">
          <ScrollAnimation>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-8">
                <Brain className="h-12 w-12 text-white" />
              </div>

              <h1 className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl mb-6">
                {t('title')}
              </h1>
              <p className="text-gray-300 text-lg mb-8">
                {t('subtitle')}
              </p>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 mb-8">
                <h3 className="text-xl font-semibold text-white mb-6">测验信息</h3>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-gray-400 mb-2">{t('stats.total_questions')}</p>
                    <p className="text-white text-lg font-medium">{questions.length} 题</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">{t('stats.time_spent')}</p>
                    <p className="text-white text-lg font-medium">{questions.length * 2-3} 分钟</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">{t('question.multiple_choice')}, {t('question.true_false')}, {t('question.fill_blank')}</p>
                    <p className="text-white text-lg font-medium"></p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">智能提示</p>
                    <p className="text-white text-lg font-medium">每题提供学习提示</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setShowGenerateForm(true)}
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 px-8 py-4 text-lg"
                >
                  <Brain className="h-5 w-5 mr-2" />
                  {t('create.generate')}
                </Button>
                <Button
                  onClick={handleStartQuiz}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                >
                  {t('actions.start_quiz')}
                </Button>
              </div>
            </motion.div>
          </ScrollAnimation>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const score = calculateScore();

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950 flex items-center justify-center">
        <div className="relative z-10 container mx-auto px-4">
          <ScrollAnimation>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-8">
                <Trophy className="h-12 w-12 text-white" />
              </div>

              <h1 className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl mb-6">
                {t('results.title')}
              </h1>

              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8 mb-8">
                <div className="text-center mb-8">
                  <div className="text-6xl font-bold text-white mb-2">{score.percentage}%</div>
                  <p className="text-gray-400">您的得分</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div>
                    <p className="text-gray-400 mb-2">正确答案</p>
                    <p className="text-green-400 text-xl font-medium">{score.correct}/{score.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">平均用时</p>
                    <p className="text-blue-400 text-xl font-medium">{score.averageTime}秒</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-2">使用提示</p>
                    <p className="text-yellow-400 text-xl font-medium">{score.totalHintsUsed}次</p>
                  </div>
                </div>

                {/* 详细答案 */}
                <div className="text-left space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">答题详情</h3>
                  {userAnswers.map((answer, idx) => {
                    const question = questions.find(q => q.id === answer.questionId);
                    return (
                      <div key={idx} className="bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {answer.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-400 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-white font-medium">{question?.question}</p>
                            {!answer.isCorrect && (
                              <p className="text-gray-400 text-sm mt-1">
                                正确答案: {question?.options ? question.options[question.correctAnswer as number] : question?.correctAnswer}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  重新测验
                </Button>
                <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:border-purple-500/50">
                  返回主页
                </Button>
              </div>
            </motion.div>
          </ScrollAnimation>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* 进度条 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">
              问题 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className={`text-sm ${getDifficultyColor(currentQuestion.difficulty)}`}>
              {currentQuestion.difficulty === 'easy' ? '简单' :
               currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 题目内容 */}
        <ScrollAnimation>
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8"
            >
              {/* 题目 */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  <span className="text-purple-400 text-sm">{currentQuestion.topic}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* 答案选项 */}
              <div className="space-y-3 mb-8">
                {currentQuestion.type === 'multiple-choice' && currentQuestion.options?.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(idx)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${
                      showResult
                        ? idx === currentQuestion.correctAnswer
                          ? 'border-green-500 bg-green-500/10'
                          : idx === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-gray-600 bg-gray-800/50'
                        : selectedAnswer === idx
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-600 bg-gray-800/50 hover:border-purple-500/50 hover:bg-purple-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        showResult
                          ? idx === currentQuestion.correctAnswer
                            ? 'border-green-500 bg-green-500'
                            : idx === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-500'
                          : selectedAnswer === idx
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-500'
                      }`}>
                        {showResult && idx === currentQuestion.correctAnswer && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                        {showResult && idx === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer && (
                          <XCircle className="h-4 w-4 text-white" />
                        )}
                        {!showResult && selectedAnswer === idx && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className={showResult && idx === currentQuestion.correctAnswer ? 'text-green-400' : 'text-white'}>
                        {option}
                      </span>
                    </div>
                  </button>
                ))}

                {currentQuestion.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['正确', '错误'].map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerSelect(idx)}
                        disabled={showResult}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          showResult
                            ? idx === currentQuestion.correctAnswer
                              ? 'border-green-500 bg-green-500/10'
                              : idx === selectedAnswer && selectedAnswer !== currentQuestion.correctAnswer
                              ? 'border-red-500 bg-red-500/10'
                              : 'border-gray-600 bg-gray-800/50'
                            : selectedAnswer === idx
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-600 bg-gray-800/50 hover:border-purple-500/50 hover:bg-purple-500/5'
                        }`}
                      >
                        <span className={showResult && idx === currentQuestion.correctAnswer ? 'text-green-400' : 'text-white'}>
                          {option}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'fill-blank' && (
                  <input
                    type="text"
                    value={selectedAnswer as string}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    disabled={showResult}
                    placeholder="请输入答案..."
                    className={`w-full p-4 rounded-lg border transition-all duration-300 bg-gray-800/50 ${
                      showResult
                        ? selectedAnswer === currentQuestion.correctAnswer
                          ? 'border-green-500'
                          : 'border-red-500'
                        : 'border-gray-600 focus:border-purple-500'
                    } text-white`}
                  />
                )}
              </div>

              {/* 提示 */}
              {!showResult && currentQuestion.hints && currentHints.length < currentQuestion.hints.length && (
                <Button
                  onClick={handleShowHint}
                  variant="outline"
                  className="mb-4 border-yellow-500/30 text-yellow-400 hover:border-yellow-500/50 hover:bg-yellow-500/10"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  显示提示 ({currentHints.length + 1}/{currentQuestion.hints.length})
                </Button>
              )}

              {currentHints.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200">
                    💡 提示: {currentHints[currentHints.length - 1]}
                  </p>
                </div>
              )}

              {/* 答案解析 */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                >
                  <p className="text-blue-200">
                    📚 解析: {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-between">
                {!showResult ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={selectedAnswer === ''}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    提交答案
                  </Button>
                ) : (
                  <Button
                    onClick={handleNextQuestion}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    {currentQuestionIndex < questions.length - 1 ? '下一题' : '完成测验'}
                  </Button>
                )}

                {!showResult && (
                  <Button
                    onClick={() => setShowExplanation(true)}
                    variant="outline"
                    className="border-purple-500/30 text-purple-300 hover:border-purple-500/50"
                  >
                    跳过此题
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </ScrollAnimation>

        {/* 生成测验表单 */}
        {showGenerateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowGenerateForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl border border-purple-500/20 p-8 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-6">生成 AI 测验</h3>
              <div className="mb-6">
                <label className="block text-white font-medium mb-3">测验题目数量</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value={3}>3 题</option>
                  <option value={5}>5 题</option>
                  <option value={10}>10 题</option>
                  <option value={15}>15 题</option>
                </select>
              </div>
              <textarea
                value={quizContent}
                onChange={(e) => setQuizContent(e.target.value)}
                placeholder="粘贴您的学习笔记、课程内容或任何想要转换为测验的文本..."
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
                    setShowGenerateForm(false);
                    setGenerationError('');
                    setQuizContent('');
                  }}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:border-gray-500"
                >
                  取消
                </Button>
                <Button
                  onClick={handleGenerateQuiz}
                  disabled={isGenerating || !quizContent.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      AI 正在生成...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      生成测验
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

export default QuizApp;