'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileAudio, FileVideo, FileText, Mic, Brain, Download, Share2, Zap, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { OpenRouterService } from '@/shared/services/openrouter';

const AINoteTaker = () => {
  const t = useTranslations('ai-note-taker');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');
  const [activeTab, setActiveTab] = useState('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setIsProcessing(true);
      setError('');

      try {
        // 读取文件内容
        const fileContent = await readFileContent(file);

        // 调用 AI API 生成笔记
        const aiService = OpenRouterService.getInstance();
        const result = await aiService.generateNotes({
          content: fileContent,
          type: getFileType(file.type),
          fileName: file.name
        });

        if (result.success) {
          setGeneratedNotes(result.notes);
          setActiveTab('notes');
        } else {
          setError(result.error || t('errors.generation_failed'));
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setError(t('errors.processing_failed'));
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        // 对于图片文件，我们可以提取文件名和大小作为内容
        resolve(`文件: ${file.name}\n大小: ${file.size} bytes\n类型: ${file.type}\n\n这是一个图片文件，AI 可以帮助您分析图片内容并生成相关笔记。`);
      } else {
        reader.onload = (e) => {
          resolve(e.target?.result as string);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));

        if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
          // 对于音频和视频文件，我们暂时使用文件信息
          resolve(`文件: ${file.name}\n大小: ${file.size} bytes\n类型: ${file.type}\n\n这是一个${file.type.startsWith('audio/') ? '音频' : '视频'}文件。Turbo AI 可以帮助您：\n\n1. 转录音频内容为文字\n2. 提取关键信息和要点\n3. 生成结构化的学习笔记\n4. 创建相关的闪卡和测验\n\n请稍候，AI 正在处理您的文件...`);
        } else {
          reader.readAsText(file);
        }
      }
    });
  };

  const getFileType = (mimeType: string): 'audio' | 'video' | 'pdf' | 'text' => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    return 'text';
  };

  const [error, setError] = useState('');

  const tabs = [
    { id: 'upload', label: t('tabs.upload'), icon: Upload },
    { id: 'record', label: t('tabs.record'), icon: Mic },
    { id: 'notes', label: t('tabs.notes'), icon: Brain },
  ];

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

        {/* 功能标签页 */}
        <ScrollAnimation delay={0.2}>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-lg border border-purple-500/20 bg-gray-900/50 backdrop-blur-sm p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white hover:bg-purple-500/10'
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
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8"
              >
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <Upload className="h-12 w-12 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">{t('upload.title')}</h3>
                  <p className="text-gray-400 mb-8">{t('upload.subtitle')}</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t('upload.processing')}
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 mr-2" />
                        {t('upload.upload_button')}
                      </>
                    )}
                  </Button>

                  {/* 支持的文件类型 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                    {[
                      { icon: FileAudio, label: t('upload.audio_files'), desc: 'MP3, WAV, M4A' },
                      { icon: FileVideo, label: t('upload.video_files'), desc: 'MP4, MOV, AVI' },
                      { icon: FileText, label: t('upload.pdf_docs'), desc: t('upload.pdf_desc') },
                      { icon: FileText, label: t('upload.text_docs'), desc: 'DOC, TXT, MD' },
                    ].map((type, idx) => {
                      const Icon = type.icon;
                      return (
                        <div key={idx} className="text-center">
                          <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-2">
                            <Icon className="h-6 w-6 text-purple-400" />
                          </div>
                          <p className="text-white font-medium">{type.label}</p>
                          <p className="text-gray-500 text-sm">{type.desc}</p>
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
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8"
              >
                <div className="text-center">
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <Mic className="h-12 w-12 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-4">{t('record.title')}</h3>
                  <p className="text-gray-400 mb-8">{t('record.subtitle')}</p>

                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg">
                    <Mic className="h-5 w-5 mr-2" />
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
                className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white">{t('notes.title')}</h3>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:border-purple-500/50">
                      <Download className="h-4 w-4 mr-2" />
                      {t('notes.download')}
                    </Button>
                    <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300 hover:border-purple-500/50">
                      <Share2 className="h-4 w-4 mr-2" />
                      {t('notes.share')}
                    </Button>
                  </div>
                </div>

                {error ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                      <Zap className="h-8 w-8 text-red-400" />
                    </div>
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button
                      onClick={() => setError('')}
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:border-red-500/50"
                    >
                      {t('retry')}
                    </Button>
                  </div>
                ) : generatedNotes ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-gray-800/50 rounded-lg p-6 text-gray-300 leading-relaxed">
                      {generatedNotes.split('\n').map((line, idx) => (
                        <div key={idx} className={line.startsWith('#') ? 'font-bold text-white mb-4' : 'mb-2'}>
                          {line.startsWith('##') ? (
                            <h2 className="text-xl font-semibold text-purple-400 mt-6 mb-3">{line.replace('##', '')}</h2>
                          ) : line.startsWith('###') ? (
                            <h3 className="text-lg font-medium text-blue-400 mt-4 mb-2">{line.replace('###', '')}</h3>
                          ) : line.startsWith('-') ? (
                            <li className="ml-4">{line.replace('-', '').trim()}</li>
                          ) : line.match(/^\d+\./) ? (
                            <li className="ml-4 list-decimal">{line}</li>
                          ) : (
                            line && <p>{line}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500">{t('notes.no_notes')}</p>
                  </div>
                )}

                {/* AI工具栏 */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
                    <Zap className="h-4 w-4 mr-2" />
                    {t('toolbar.generate_flashcards')}
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
                    <Brain className="h-4 w-4 mr-2" />
                    {t('toolbar.create_quiz')}
                  </Button>
                  <Button variant="outline" size="sm" className="border-purple-500/30 text-purple-300">
                    <FileAudio className="h-4 w-4 mr-2" />
                    {t('toolbar.generate_podcast')}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollAnimation>
      </div>
    </div>
  );
};

export default AINoteTaker;