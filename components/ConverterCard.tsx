'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Converter } from '@/lib/converters';
import {
  Youtube, Music, Instagram, Twitter, Video,
  Facebook, Volume2, PlayCircle, FileVideo,
  Download, Loader2, CheckCircle, AlertCircle, X, ChevronDown
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Youtube,
  Music,
  Instagram,
  Twitter,
  Video,
  Facebook,
  Volume2,
  PlayCircle,
  FileVideo,
};

interface ConverterCardProps {
  converter: Converter;
}

export default function ConverterCard({ converter }: ConverterCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState(converter.formats[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [ffmpegAvailable, setFfmpegAvailable] = useState<boolean | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [speed, setSpeed] = useState<string>('');
  const [eta, setEta] = useState<string>('');

  const Icon = iconMap[converter.icon] || Video;

  const handleCancel = async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/download/cancel/${jobId}`, { method: 'POST' });
      if (res.ok) {
        setMessage('Cancelling...');
      }
    } catch (e) {
      console.error('Failed to cancel:', e);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setDownloadStatus('error');
      setMessage('Please enter a valid URL');
      setTimeout(() => setDownloadStatus('idle'), 3000);
      return;
    }

    try {
      new URL(url);
    } catch {
      setDownloadStatus('error');
      setMessage('Invalid URL format');
      setTimeout(() => setDownloadStatus('idle'), 3000);
      return;
    }

    setIsDownloading(true);
    setDownloadStatus('idle');
    setMessage('Preparing download...');

    try {
      const startRes = await fetch('/api/download/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          platform: converter.platform,
          format: selectedFormat.id,
          converterId: converter.id,
        }),
      });
      const startData = await startRes.json();

      if (!startRes.ok) {
        setDownloadStatus('error');
        setMessage(startData.error || 'Failed to start download');
        setTimeout(() => setDownloadStatus('idle'), 5000);
        setIsDownloading(false);
        return;
      }

      if (!startData.ffmpegAvailable && (selectedFormat.extension === 'mp4' || selectedFormat.extension === 'mp3')) {
        const proceed = window.confirm('ffmpeg is not available. The file will be downloaded in its original format (e.g. webm). Proceed?');
        if (!proceed) {
          setIsDownloading(false);
          setMessage('Cancelled');
          return;
        }
      }

      setJobId(startData.jobId);
      setDownloadStatus('idle');
      setMessage('Starting...');

      const es = new EventSource(`/api/download/progress/${startData.jobId}`);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window._currentEventSource = es;

      es.addEventListener('status', (ev: any) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.status === 'downloading') setIsDownloading(true);
          if (data.status === 'completed') setIsDownloading(false);
        } catch (e) { }
      });

      es.addEventListener('progress', (ev: any) => {
        try {
          const data = JSON.parse(ev.data);
          const p = data.progress || 0;
          setProgress(p);
          setSpeed(data.speed || '');
          setEta(data.eta || '');
          let msg = `Downloading: ${Math.round(p)}%`;
          if (data.speed) msg += ` • ${data.speed}`;
          setMessage(msg);
        } catch (e) { }
      });

      es.addEventListener('completed', async (ev: any) => {
        try {
          const fileRes = await fetch(`/api/download/file/${startData.jobId}`);
          if (!fileRes.ok) throw new Error('Failed to fetch file');

          const disposition = fileRes.headers.get('content-disposition');
          let filename = 'download';
          if (disposition) {
            const match = disposition.match(/filename="?(.+)"?/);
            if (match) filename = match[1];
          }

          const blob = await fileRes.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);

          setDownloadStatus('success');
          setMessage('Download complete!');
          es.close();

          setTimeout(() => {
            setDownloadStatus('idle');
            setUrl('');
            setIsExpanded(false);
            setMessage('');
            setProgress(0);
          }, 3000);
        } catch (e: any) {
          setDownloadStatus('error');
          setMessage(e.message || 'Download failed');
        } finally {
          setIsDownloading(false);
        }
      });

      es.addEventListener('error', (ev: any) => {
        try {
          const data = ev.data ? JSON.parse(ev.data) : {};
          setDownloadStatus('error');
          setMessage(data.error || 'Download failed');
        } catch (e) {
          setDownloadStatus('error');
          setMessage('Download failed');
        }
        setIsDownloading(false);
        es.close();
      });

    } catch (error: any) {
      setDownloadStatus('error');
      setMessage(error.message || 'Network error');
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/download/ffmpeg');
        const j = await res.json();
        setFfmpegAvailable(!!j.ffmpegAvailable);
      } catch (e) {
        setFfmpegAvailable(false);
      }
    })();
    return () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (window._currentEventSource) window._currentEventSource.close();
    };
  }, []);

  return (
    <motion.div
      layout
      className={`glass-card rounded-2xl overflow-hidden relative group ${isExpanded ? 'ring-1 ring-purple-500/50 bg-[#0f0f16]' : 'hover:bg-[#0f0f16]'
        }`}
    >
      {/* Card Header */}
      <div
        className="p-5 cursor-pointer relative z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-xl bg-gradient-to-br ${converter.color} shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white mb-0.5 truncate">{converter.name}</h3>
            <p className="text-xs text-gray-400 truncate">{converter.description}</p>
          </div>
          <div className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 pt-0 space-y-5">
              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Video URL</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={converter.placeholder}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Format Selection */}
              {converter.formats.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Format</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {converter.formats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format)}
                        className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${selectedFormat.id === format.id
                            ? 'bg-white/10 text-white border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                            : 'bg-black/20 text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
                          }`}
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status & Progress */}
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm border ${downloadStatus === 'success'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : downloadStatus === 'error'
                          ? 'bg-red-500/10 border-red-500/20 text-red-400'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}
                  >
                    {downloadStatus === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> :
                      downloadStatus === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> :
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
                    <span className="truncate">{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar */}
              {isDownloading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{Math.round(progress)}%</span>
                    <span>{eta}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {!isDownloading ? (
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Now</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
