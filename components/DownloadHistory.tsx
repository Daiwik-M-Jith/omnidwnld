'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, Trash2, RefreshCw, FileVideo, ExternalLink } from 'lucide-react';

interface DownloadRecord {
  id: number;
  platform: string;
  url: string;
  title: string;
  format: string;
  file_size: number;
  download_date: string;
  status: string;
}

export default function DownloadHistory() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      if (data.success) {
        setDownloads(data.downloads);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mb-4" />
        <p className="text-gray-400">Loading download history...</p>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]"
      >
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Download History</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Your download history will appear here. Start downloading videos to see them listed!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Download History</h2>
          <p className="text-gray-400 text-sm">
            You have downloaded <span className="text-purple-400 font-semibold">{downloads.length}</span> files
          </p>
        </div>
        <button
          onClick={fetchDownloads}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-2 transition-all text-sm font-medium text-gray-300 hover:text-white border border-white/5 hover:border-white/10"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh List
        </button>
      </div>

      {/* Downloads List */}
      <div className="space-y-3">
        {downloads.map((download, idx) => (
          <motion.div
            key={download.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card rounded-xl p-5 group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5 hidden sm:block">
                <FileVideo className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-white font-semibold mb-1 truncate pr-4 group-hover:text-purple-400 transition-colors">
                      {download.title || 'Untitled Video'}
                    </h4>
                    <a
                      href={download.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-3 truncate transition-colors w-fit"
                    >
                      {download.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Placeholder for future actions like delete */}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md capitalize font-medium">
                    {download.platform}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-md uppercase font-medium">
                    {download.format.replace('mp4-', '').replace('mp3-', '')}
                  </span>
                  <span className="px-2.5 py-1 bg-white/5 text-gray-300 border border-white/10 rounded-md">
                    {formatFileSize(download.file_size)}
                  </span>
                  <span className="px-2.5 py-1 bg-white/5 text-gray-400 border border-white/10 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(download.download_date)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
