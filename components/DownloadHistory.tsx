'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Download, Trash2, RefreshCw } from 'lucide-react';

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
    return date.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="glass-strong rounded-2xl p-12 text-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading download history...</p>
      </div>
    );
  }

  if (downloads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-12 text-center"
      >
        <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No Download History</h3>
        <p className="text-gray-400">Your downloads will appear here once you start downloading.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Download History</h2>
          <p className="text-gray-400">Total downloads: {downloads.length}</p>
        </div>
        <button
          onClick={fetchDownloads}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
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
            className="glass-strong rounded-xl p-5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold mb-1 truncate">{download.title}</h4>
                <p className="text-sm text-gray-400 truncate mb-2">{download.url}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded capitalize">
                    {download.platform}
                  </span>
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded uppercase">
                    {download.format}
                  </span>
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
                    {formatFileSize(download.file_size)}
                  </span>
                  <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded">
                    {formatDate(download.download_date)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-all"
                  title="Re-download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
