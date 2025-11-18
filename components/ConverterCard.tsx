'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Converter } from '@/lib/converters';
import { 
  Youtube, Music, Instagram, Twitter, Video, 
  Facebook, Volume2, PlayCircle, FileVideo,
  Download, Loader2, CheckCircle, AlertCircle, X
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

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setDownloadStatus('error');
      setMessage('Invalid URL format. Please enter a complete URL (e.g., https://...)');
      setTimeout(() => setDownloadStatus('idle'), 3000);
      return;
    }

    setIsDownloading(true);
    setDownloadStatus('idle');
    setMessage('Preparing download...');

    try {
      // Start the job and get a jobId
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
      console.log('Start job response', startRes.status, startData);
      if (!startRes.ok) {
        setDownloadStatus('error');
        setMessage(startData.error || 'Failed to start download job');
        setTimeout(() => setDownloadStatus('idle'), 5000);
        setIsDownloading(false);
        return;
      }
      // If ffmpeg is not available but the user requested mp4/mp3, confirm that they want to proceed
      if (!startData.ffmpegAvailable && (selectedFormat.extension === 'mp4' || selectedFormat.extension === 'mp3' || selectedFormat.id.includes('mp4') || selectedFormat.id.includes('mp3'))) {
        const proceed = window.confirm('ffmpeg is not available. Converting to MP4/MP3 requires ffmpeg; without it, the file will be downloaded in its original container (e.g., webm or m4a). Do you want to proceed?');
        if (!proceed) {
          setIsDownloading(false);
          setMessage('Download cancelled. Install ffmpeg for MP4/MP3 conversion.');
          setTimeout(() => setMessage(''), 5000);
          return;
        }
      }
      setJobId(startData.jobId);
      setDownloadStatus('idle');
      setMessage('Download started...');

      // Subscribe to SSE progress
      const es = new EventSource(`/api/download/progress/${startData.jobId}`);
      console.log(`SSE connecting to job ${startData.jobId}`);
      
      es.onerror = (err) => {
        console.error('SSE connection error:', err);
        // Don't immediately fail - SSE will auto-reconnect
      };
      
      es.onmessage = (ev: MessageEvent) => {
        // Generic messages if any
        try {
          const payload = JSON.parse(ev.data);
          console.log('SSE message', payload);
        } catch (e) {
          console.log('SSE message data:', ev.data);
        }
      };
      es.addEventListener('status', (ev: any) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.status) {
            if (data.status === 'downloading') {
              setIsDownloading(true);
            }
            if (data.status === 'completed') {
              setIsDownloading(false);
            }
          }
        } catch (e) {
          // ignore
        }
      });
      es.addEventListener('progress', (ev: any) => {
        try {
          const data = JSON.parse(ev.data);
          const p = data.progress || 0;
          setProgress(p);
          setSpeed(data.speed || '');
          setEta(data.eta || '');
          let msg = `Downloading: ${p}%`;
          if (data.speed) msg += ` at ${data.speed}`;
          if (data.eta) msg += ` | ETA: ${data.eta}`;
          setMessage(msg);
        } catch (e) {
          // ignore
        }
      });
      es.addEventListener('completed', async (ev: any) => {
        try {
          const data = JSON.parse(ev.data);
          // Download file
          const fileRes = await fetch(`/api/download/file/${startData.jobId}`);
          if (!fileRes.ok) {
            const err = await fileRes.json();
            setDownloadStatus('error');
            setMessage(err.error || 'Failed to fetch file');
            es.close();
            setIsDownloading(false);
            return;
          }
          const disposition = fileRes.headers.get('content-disposition');
          let filename = 'download';
          if (disposition) {
            const filenameMatch = disposition.match(/filename="?(.+)"?/);
            if (filenameMatch) filename = filenameMatch[1];
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
          }, 3000);
        } catch (e: any) {
          setDownloadStatus('error');
          setMessage(e.message || 'Failed to complete download');
        } finally {
          setIsDownloading(false);
        }
      });
      es.addEventListener('cancelled', (ev: any) => {
        setDownloadStatus('idle');
        setMessage('Download cancelled');
        setIsDownloading(false);
        es.close();
        setTimeout(() => setMessage(''), 3000);
      });
      es.addEventListener('error', (ev: any) => {
        try {
          const data = ev.data ? JSON.parse(ev.data) : undefined;
          const errorMessage = (data && data.error) || 'Download failed due to an unknown error';
          console.error('SSE error', errorMessage, data);
          setDownloadStatus('error');
          setMessage(`Download error: ${errorMessage}`);
        } catch (e) {
          setDownloadStatus('error');
          setMessage('Download failed due to an unknown error');
        }
        setIsDownloading(false);
        // fetch recent logs for debugging and show them in UI
        (async () => {
          try {
            const logsRes = await fetch(`/api/download/logs/${startData.jobId}`);
            if (logsRes.ok) {
              const logs = await logsRes.json();
              console.log('Download logs:', logs.logs);
              if (logs.logs && logs.logs.length) {
                setMessage(prev => `${prev} See logs in console for details.`);
              }
            }
          } catch (e) {
            // ignore
          }
        })();
        es.close();
      });

      // keep the EventSource in the state, cleanup on finish/unmount
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window._currentEventSource = es;

      setIsDownloading(true);
      setDownloadStatus('idle');
      setMessage('Downloading...');
      return;
    
      // Old sync flow removed; using job + SSE
    } catch (error: any) {
      console.error('Download error:', error);
      setDownloadStatus('error');
      setMessage(error.message || 'Network error. Please check your connection.');
      setTimeout(() => setDownloadStatus('idle'), 5000);
    } finally {
      // keep IsDownloading state handled by SSE completion
    }
  };

  useEffect(() => {
    // Check ffmpeg availability on mount
    (async () => {
      try {
        const res = await fetch('/api/download/ffmpeg');
        const j = await res.json();
        if (res.ok && j.ffmpegAvailable !== undefined) {
          setFfmpegAvailable(!!j.ffmpegAvailable);
        } else {
          setFfmpegAvailable(false);
        }
      } catch (e) {
        setFfmpegAvailable(false);
      }
    })();
    return () => {
      // cleanup any event source if present
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const es = window._currentEventSource as EventSource | undefined;
      if (es) {
        es.close();
      }
    };
  }, []);

  return (
    <motion.div
      className={`glass-strong rounded-2xl overflow-hidden transition-all duration-300 ${
        isExpanded ? 'ring-2 ring-purple-500' : ''
      }`}
      whileHover={{ scale: isExpanded ? 1 : 1.02 }}
    >
      {/* Card Header */}
      <div
        className={`p-6 cursor-pointer bg-gradient-to-br ${converter.color} bg-opacity-10`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${converter.color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{converter.name}</h3>
            <p className="text-sm text-gray-400">{converter.description}</p>
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
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-4 border-t border-white/10">
              {/* URL Input */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Paste URL</label>
                <input
                  type="text"
                  placeholder={converter.placeholder}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Format Selection */}
              {converter.formats.length > 1 && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Select Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    {converter.formats.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedFormat.id === format.id
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      downloadStatus === 'success'
                        ? 'bg-green-500/20 text-green-400'
                        : downloadStatus === 'error'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {downloadStatus === 'success' && <CheckCircle className="w-5 h-5" />}
                    {downloadStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                    <span className="text-sm flex-1">{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FFmpeg Warning */}
              {ffmpegAvailable === false && (selectedFormat.extension === 'mp4' || selectedFormat.extension === 'mp3') && (
                <div className="p-3 rounded-lg bg-yellow-800/20 text-yellow-300 text-sm">
                  ffmpeg not detected. MP4/MP3 conversion requires ffmpeg. You can proceed to download the original file container, or install ffmpeg / ffmpeg-static for conversion.
                </div>
              )}

              {/* Progress Bar */}
              {isDownloading && (
                <div className="mt-2">
                  <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                    <div style={{ width: `${progress}%` }} className="h-2 bg-purple-500 transition-all" />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isDownloading ? (
                  <>
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30 text-white"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        setIsExpanded(false);
                        setUrl('');
                        setDownloadStatus('idle');
                        setMessage('');
                      }}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCancel}
                      className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all bg-red-600 hover:bg-red-500 text-white"
                    >
                      <X className="w-5 h-5" />
                      Cancel Download
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
