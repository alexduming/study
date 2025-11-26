'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  Brain,
  Copy,
  Download,
  FileAudio,
  FileText,
  FileVideo,
  Loader2,
  Mic,
  Share2,
  Upload,
  Zap,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { StudyNotesViewer } from '@/shared/components/ai-elements/study-notes-viewer';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  detectLearningFileType,
  readLearningFileContent,
} from '@/shared/lib/file-reader';
import { OpenRouterService } from '@/shared/services/openrouter';

const AINoteTaker = () => {
  const t = useTranslations('ai-note-taker');
  const locale = useLocale();
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  // 输出语言选择，默认为"自动"
  const [outputLanguage, setOutputLanguage] = useState<string>('auto');
  // PDF/分享等工具的运行状态
  const [isCopying, setIsCopying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  // AI 扩展功能的弹窗状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'podcast' | null>(null);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [podcastResult, setPodcastResult] = useState('');
  const NOTE_TRANSFER_KEY = 'ai-note-transfer';
  // 用于拿到隐藏的文件输入框 DOM 节点
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 记录渲染好的笔记 DOM，方便导出 PDF
  const notesContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsProcessing(true);
      setError('');

      try {
        // 读取文件内容（支持 txt / pdf / docx 等）
        const fileContent = await readLearningFileContent(file);

        // 调用 AI API 生成笔记
        const aiService = OpenRouterService.getInstance();
        const result = await aiService.generateNotes({
          content: fileContent,
          // 使用统一的文件类型检测，便于后续统计或扩展
          type: detectLearningFileType(file.type),
          fileName: file.name,
          // 传递用户选择的输出语言
          outputLanguage: outputLanguage,
        });

        if (result.success) {
          // 成功：保存生成的笔记内容，并自动切换到“笔记”标签页
          setGeneratedNotes(result.notes);
          setActiveTab('notes');
        } else {
          // 失败：保存错误信息，并同样切到“笔记”标签页，让用户能立刻看到错误原因
          // 结合 OpenRouterService.generateNotes 中的修改，这里会展示更具体的错误提示
          setError(result.error || t('errors.generation_failed'));
          setActiveTab('notes');
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setError(t('errors.processing_failed'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  /**
   * 非程序员解释：
   * - 很多按钮都需要“已经生成的笔记”作为输入
   * - 这个小工具函数会提前帮你检查，避免白点按钮
   */
  const ensureNotesReady = () => {
    if (!generatedNotes) {
      toast.error(t('notes.toast_no_notes'));
      setActiveTab('upload');
      return false;
    }
    return true;
  };

  /**
   * 复制 Markdown 文本，方便粘贴到其它工具中继续使用
   */
  const handleCopyNotes = async () => {
    if (!ensureNotesReady()) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.error(t('notes.copy_error'));
      return;
    }

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generatedNotes);
      toast.success(t('notes.copy_success'));
    } catch (error) {
      console.error('Copy notes failed:', error);
      toast.error(t('notes.copy_error'));
    } finally {
      setIsCopying(false);
    }
  };

  /**
   * 将笔记内容带到其他功能页：先存到 sessionStorage，再跳转
   */
  const handleNavigateWithNotes = (feature: 'flashcards' | 'quiz') => {
    if (!ensureNotesReady()) return;
    if (typeof window === 'undefined') {
      toast.error(t('notes.transfer_unavailable'));
      return;
    }

    sessionStorage.setItem(
      NOTE_TRANSFER_KEY,
      JSON.stringify({
        type: feature,
        content: generatedNotes,
        timestamp: Date.now(),
      })
    );

    const targetPath =
      feature === 'flashcards' ? `/${locale}/flashcards` : `/${locale}/quiz`;
    router.push(targetPath);
  };

  /**
   * 直接用 jsPDF 将 Markdown 转成排版良好的 PDF
   * 非程序员解释：
   * - 不再截图页面，而是逐行写入文字，规避浏览器颜色格式（oklab）导致的报错
   * - 简单处理 #、##、- 这种 Markdown 语法，让导出的 PDF 结构清晰
   */
  const handleDownloadPdf = async () => {
    if (!ensureNotesReady()) return;

    setIsDownloading(true);
    try {
      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
      });
      const marginX = 48;
      const marginY = 56;
      const usableWidth = doc.internal.pageSize.getWidth() - marginX * 2;
      const pageHeight = doc.internal.pageSize.getHeight() - marginY;
      let cursorY = marginY;

      const ensureSpace = (lineHeight: number) => {
        if (cursorY + lineHeight > pageHeight) {
          doc.addPage();
          cursorY = marginY;
        }
      };

      const writeParagraph = (
        text: string,
        options: {
          fontSize?: number;
          fontStyle?: 'normal' | 'bold';
          spacing?: number;
        } = {}
      ) => {
        if (!text.trim()) {
          cursorY += options.spacing ?? 8;
          return;
        }
        const fontSize = options.fontSize ?? 12;
        const fontStyle = options.fontStyle ?? 'normal';
        const spacing = options.spacing ?? 4;
        const lineHeight = fontSize + 4;

        doc.setFont('helvetica', fontStyle);
        doc.setFontSize(fontSize);

        const lines = doc.splitTextToSize(text, usableWidth);
        lines.forEach((line: string) => {
          ensureSpace(lineHeight);
          doc.text(line, marginX, cursorY);
          cursorY += lineHeight;
        });
        cursorY += spacing;
      };

      const markdownLines = generatedNotes.split('\n');
      markdownLines.forEach((line: string) => {
        const trimmed = line.trim();
        if (!trimmed) {
          cursorY += 6;
          return;
        }

        if (trimmed.startsWith('### ')) {
          writeParagraph(trimmed.replace(/^###\s*/, ''), {
            fontSize: 14,
            fontStyle: 'bold',
            spacing: 6,
          });
        } else if (trimmed.startsWith('## ')) {
          writeParagraph(trimmed.replace(/^##\s*/, ''), {
            fontSize: 16,
            fontStyle: 'bold',
            spacing: 8,
          });
        } else if (trimmed.startsWith('# ')) {
          writeParagraph(trimmed.replace(/^#\s*/, ''), {
            fontSize: 18,
            fontStyle: 'bold',
            spacing: 10,
          });
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          writeParagraph(`• ${trimmed.slice(1).trim()}`, {
            fontSize: 12,
            spacing: 2,
          });
        } else if (/^\d+\./.test(trimmed)) {
          writeParagraph(trimmed, {
            fontSize: 12,
            spacing: 2,
          });
        } else {
          writeParagraph(trimmed, {
            fontSize: 12,
            spacing: 6,
          });
        }
      });

      const fileName = uploadedFile?.name
        ? `${uploadedFile.name}-notes.pdf`
        : 'ai-study-notes.pdf';
      doc.save(fileName);
      toast.success(t('notes.download_success'));
    } catch (error) {
      console.error('Download PDF failed:', error);
      toast.error(t('notes.download_error'));
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * 分享按钮优先走系统分享，不支持的浏览器自动退回“复制到剪贴板”
   */
  const handleShareNotes = async () => {
    if (!ensureNotesReady()) return;
    setIsSharing(true);
    try {
      const sharePayload = {
        title: uploadedFile?.name || 'AI Study Notes',
        text: generatedNotes,
      };

      if (navigator.share) {
        await navigator.share(sharePayload);
        toast.success(t('notes.share_success'));
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(generatedNotes);
        toast.success(t('notes.share_fallback'));
      } else {
        toast.error(t('notes.share_error'));
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error(t('notes.share_error'));
      }
    } finally {
      setIsSharing(false);
    }
  };

  /**
   * 生成学习播客脚本并展示在弹窗中
   */
  const handleGeneratePodcast = async () => {
    if (!ensureNotesReady()) return;

    setDialogOpen(true);
    setDialogType('podcast');
    setDialogLoading(true);
    setDialogError('');
    setPodcastResult('');

    try {
      const aiService = OpenRouterService.getInstance();
      const result = await aiService.generatePodcastScript(generatedNotes);
      if (result.success && result.script) {
        setPodcastResult(result.script);
      } else {
        setDialogError(result.error || t('notes.dialog.error'));
      }
    } catch (error) {
      console.error('AI feature failed:', error);
      setDialogError(t('notes.dialog.error'));
    } finally {
      setDialogLoading(false);
    }
  };

  const getDialogTitles = () => {
    switch (dialogType) {
      case 'podcast':
        return {
          title: t('notes.dialog.podcast_title'),
          desc: t('notes.dialog.podcast_desc'),
        };
      default:
        return { title: '', desc: '' };
    }
  };

  const renderDialogBody = () => {
    if (dialogLoading) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin text-purple-300" />
          <p>{t('notes.dialog.loading')}</p>
        </div>
      );
    }

    if (dialogError) {
      return <p className="text-center text-red-400">{dialogError}</p>;
    }

    if (dialogType === 'podcast') {
      return (
        <ScrollArea className="h-80 rounded border border-purple-500/20 bg-gray-900/60 p-4">
          <StudyNotesViewer content={podcastResult} />
        </ScrollArea>
      );
    }

    return null;
  };

  // getFileType 已由 detectLearningFileType 替代，无需在本组件重复实现

  const [error, setError] = useState('');

  const tabs = [
    { id: 'upload', label: t('tabs.upload'), icon: Upload },
    { id: 'record', label: t('tabs.record'), icon: Mic },
    { id: 'notes', label: t('tabs.notes'), icon: Brain },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950">
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24">
        <ScrollAnimation>
          <div className="mb-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="mb-6 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                {t('title')}
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-300 md:text-xl">
                {t('subtitle')}
              </p>
            </motion.div>
          </div>
        </ScrollAnimation>

        {/* 功能标签页 */}
        <ScrollAnimation delay={0.2}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex justify-center">
              <div className="inline-flex rounded-lg border border-purple-500/20 bg-gray-900/50 p-1 backdrop-blur-sm">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 rounded-md px-6 py-3 transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:bg-purple-500/10 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 上传区域 */}
            {activeTab === 'upload' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-purple-500/20 bg-gray-900/50 p-8 backdrop-blur-sm"
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
                    <Upload className="h-12 w-12 text-white" />
                  </div>

                  <h3 className="mb-4 text-2xl font-bold text-white">
                    {t('upload.title')}
                  </h3>
                  <p className="mb-8 text-gray-400">{t('upload.subtitle')}</p>

                  {/* 语言选择器 */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    <label
                      htmlFor="output-language-select"
                      className="text-sm font-medium text-gray-300"
                    >
                      {t('upload.output_language')}:
                    </label>
                    <Select
                      value={outputLanguage}
                      onValueChange={setOutputLanguage}
                      disabled={isProcessing}
                    >
                      <SelectTrigger
                        id="output-language-select"
                        className="w-[280px] border-purple-500/30 bg-gray-800/50 text-white hover:border-purple-500/50"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-purple-500/30 bg-gray-900">
                        <SelectItem value="auto">
                          {t('languages.auto')}
                        </SelectItem>
                        <SelectItem value="zh">{t('languages.zh')}</SelectItem>
                        <SelectItem value="en">{t('languages.en')}</SelectItem>
                        <SelectItem value="es">{t('languages.es')}</SelectItem>
                        <SelectItem value="fr">{t('languages.fr')}</SelectItem>
                        <SelectItem value="de">{t('languages.de')}</SelectItem>
                        <SelectItem value="ja">{t('languages.ja')}</SelectItem>
                        <SelectItem value="ko">{t('languages.ko')}</SelectItem>
                        <SelectItem value="pt">{t('languages.pt')}</SelectItem>
                        <SelectItem value="ru">{t('languages.ru')}</SelectItem>
                        <SelectItem value="ar">{t('languages.ar')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="mb-6 text-xs text-gray-500">
                    {t('upload.output_language_desc')}
                  </p>

                  {/* 
                    非程序员解释：
                    - 浏览器出于安全原因，有时不允许用 JS 直接"点"隐藏的 <input type="file">
                    - 更稳妥的方式是：用 <label htmlFor="..."> 绑定到 input 上
                    - 用户点按钮本质上是在点 label，浏览器就会乖乖弹出"选择文件"的对话框
                  */}
                  <input
                    id="ai-note-file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* 使用 Button 作为外壳，把 label 当作子元素渲染（asChild） */}
                  <Button
                    asChild
                    className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg text-white hover:from-purple-700 hover:to-blue-700"
                    disabled={isProcessing}
                  >
                    <label
                      htmlFor="ai-note-file-input"
                      className="flex cursor-pointer items-center"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          {t('upload.processing')}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          {t('upload.upload_button')}
                        </>
                      )}
                    </label>
                  </Button>

                  {/* 支持的文件类型 */}
                  <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      {
                        icon: FileAudio,
                        label: t('upload.audio_files'),
                        desc: 'MP3, WAV, M4A',
                      },
                      {
                        icon: FileVideo,
                        label: t('upload.video_files'),
                        desc: 'MP4, MOV, AVI',
                      },
                      {
                        icon: FileText,
                        label: t('upload.pdf_docs'),
                        desc: t('upload.pdf_desc'),
                      },
                      {
                        icon: FileText,
                        label: t('upload.text_docs'),
                        desc: 'DOC, TXT, MD',
                      },
                    ].map((type, idx) => {
                      const Icon = type.icon;
                      return (
                        <div key={idx} className="text-center">
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                            <Icon className="h-6 w-6 text-purple-400" />
                          </div>
                          <p className="font-medium text-white">{type.label}</p>
                          <p className="text-sm text-gray-500">{type.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 录音区域 */}
            {activeTab === 'record' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-purple-500/20 bg-gray-900/50 p-8 backdrop-blur-sm"
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600">
                    <Mic className="h-12 w-12 text-white" />
                  </div>

                  <h3 className="mb-4 text-2xl font-bold text-white">
                    {t('record.title')}
                  </h3>
                  <p className="mb-8 text-gray-400">{t('record.subtitle')}</p>

                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 text-lg text-white hover:from-purple-700 hover:to-blue-700">
                    <Mic className="mr-2 h-5 w-5" />
                    {t('record.start_button')}
                  </Button>

                  <div className="mt-8 text-sm text-gray-500">
                    <p>支持最长60分钟的连续录音</p>
                    <p>自动降噪和语音识别优化</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 生成的笔记区域 */}
            {activeTab === 'notes' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-2xl border border-purple-500/20 bg-gray-900/50 p-8 backdrop-blur-sm"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">
                    {t('notes.title')}
                  </h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyNotes}
                      disabled={isCopying || !generatedNotes}
                      className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 disabled:opacity-40"
                    >
                      {isCopying ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {t('notes.copy')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPdf}
                      disabled={isDownloading || !generatedNotes}
                      className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 disabled:opacity-40"
                    >
                      {isDownloading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      {isDownloading
                        ? t('upload.processing')
                        : t('notes.download')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareNotes}
                      disabled={isSharing || !generatedNotes}
                      className="border-purple-500/30 text-purple-300 hover:border-purple-500/50 disabled:opacity-40"
                    >
                      {isSharing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Share2 className="mr-2 h-4 w-4" />
                      )}
                      {isSharing ? t('upload.processing') : t('notes.share')}
                    </Button>
                  </div>
                </div>

                {error ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                      <Zap className="h-8 w-8 text-red-400" />
                    </div>
                    <p className="mb-4 text-red-400">{error}</p>
                    <Button
                      onClick={() => setError('')}
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:border-red-500/50"
                    >
                      {t('retry')}
                    </Button>
                  </div>
                ) : generatedNotes ? (
                  <div
                    ref={notesContainerRef}
                    className="rounded-lg bg-gray-800/50 p-6 text-base leading-relaxed text-gray-200"
                  >
                    <StudyNotesViewer content={generatedNotes} />
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Brain className="mx-auto mb-4 h-16 w-16 text-gray-600" />
                    <p className="text-gray-500">{t('notes.no_notes')}</p>
                  </div>
                )}

                {/* AI工具栏 */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateWithNotes('flashcards')}
                    disabled={!generatedNotes || dialogLoading}
                    className="border-purple-500/30 text-purple-300 disabled:opacity-40"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    {t('toolbar.generate_flashcards')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavigateWithNotes('quiz')}
                    disabled={!generatedNotes || dialogLoading}
                    className="border-purple-500/30 text-purple-300 disabled:opacity-40"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    {t('toolbar.create_quiz')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePodcast}
                    disabled={!generatedNotes || dialogLoading}
                    className="border-purple-500/30 text-purple-300 disabled:opacity-40"
                  >
                    <FileAudio className="mr-2 h-4 w-4" />
                    {t('toolbar.generate_podcast')}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollAnimation>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setDialogType(null);
            setDialogError('');
            setDialogLoading(false);
          }
        }}
      >
        <DialogContent className="border-purple-500/30 bg-gray-950/95 text-white">
          <DialogHeader>
            <DialogTitle>{getDialogTitles().title}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {getDialogTitles().desc}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">{renderDialogBody()}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AINoteTaker;
