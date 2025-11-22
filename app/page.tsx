'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Youtube, Music, Instagram, Twitter,
  Video, Facebook, FileVideo, Zap, Globe, Sparkles, TrendingUp
} from 'lucide-react';
import ConverterGrid from '@/components/ConverterGrid';
import DownloadHistory from '@/components/DownloadHistory';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'converters' | 'history'>('converters');

  return (
    <main className="min-h-screen bg-[#050505] relative overflow-hidden selection:bg-purple-500/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/10 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Download className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 font-outfit">
                OmniDwnld
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/Daiwik-M-Jith/omnidwnld" target="_blank" rel="noopener noreferrer" aria-label="Open repository on GitHub" className="text-sm text-gray-400 hover:text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">
                Universal <span className="text-gradient">Media Downloader</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Download high-quality videos and audio from YouTube, Instagram, TikTok, and <span className="text-white font-semibold">100+ other platforms</span>.
                Fast, free, and secure.
              </p>
            </motion.div>

            {/* Feature Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-3 mb-12"
            >
              {[
                { icon: Zap, text: 'Lightning Fast' },
                { icon: Globe, text: '100+ Sites' },
                { icon: Sparkles, text: 'High Quality' },
                { icon: TrendingUp, text: 'Always Free' }
              ].map((feature, idx) => (
                <div key={idx} className="glass px-4 py-2 rounded-full flex items-center gap-2 border border-white/5 hover:border-white/10 transition-colors">
                  <feature.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Supported Platforms Marquee (Static for now, could be animated) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4 opacity-70 hover:opacity-100 transition-opacity duration-300"
            >
              {[
                { Icon: Youtube, color: 'text-red-500' },
                { Icon: Instagram, color: 'text-pink-500' },
                { Icon: Twitter, color: 'text-blue-400' },
                { Icon: Video, color: 'text-purple-500' }, // TikTok
                { Icon: Facebook, color: 'text-blue-600' },
                { Icon: Music, color: 'text-orange-500' },
              ].map((platform, idx) => (
                <div key={idx} className="p-3 glass rounded-xl hover:scale-110 transition-transform duration-300">
                  <platform.Icon className={`w-6 h-6 ${platform.color}`} />
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Main App Area */}
        <section className="max-w-7xl mx-auto px-4 pb-20">
          {/* Tabs */}
          <div className="flex justify-center mb-10">
            <div className="glass p-1.5 rounded-2xl flex gap-1">
              <button
                onClick={() => setActiveTab('converters')}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'converters'
                    ? 'bg-white/10 text-white shadow-lg shadow-purple-500/10 border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Converters
                </span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'history'
                    ? 'bg-white/10 text-white shadow-lg shadow-purple-500/10 border border-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4" />
                  History
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'converters' ? <ConverterGrid /> : <DownloadHistory />}
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-12 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} OmniDwnld. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            For educational purposes only. Please respect copyright laws.
          </p>
        </footer>
      </div>
    </main>
  );
}
