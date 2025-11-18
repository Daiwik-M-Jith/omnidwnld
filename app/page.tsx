'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, Youtube, Music, Instagram, Twitter, 
  Video, Facebook, PlayCircle, FileVideo, Volume2,
  TrendingUp, Sparkles, Zap, Globe
} from 'lucide-react';
import ConverterGrid from '@/components/ConverterGrid';
import DownloadHistory from '@/components/DownloadHistory';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'converters' | 'history'>('converters');

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#16213e] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="pt-16 pb-12 px-4"
        >
          <div className="max-w-7xl mx-auto text-center">
            {/* Logo and Title */}
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-2xl">
                  <Download className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                OmniDwnld
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto"
            >
              Download videos, audio, and media from <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-bold">100+ platforms</span> instantly
            </motion.p>

            {/* Neon warning about saved file types */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-6"
            >
              <div className="flex items-center justify-center">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-red-400 relative">
                  <span className="inline-block px-4 py-2 rounded-md text-red-100 bg-red-600/10 backdrop-blur-sm" style={{ textShadow: '0 0 18px rgba(255,56,92,0.9), 0 0 36px rgba(255,56,92,0.6)' }}>
                    Save your downloading files as "<span className="underline">.mp4</span>" or "<span className="underline">.mp3</span>" to your likings
                  </span>
                  <sup className="ml-2 -translate-y-6 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold bg-gray-900/70 text-white rounded-sm border border-gray-700">1</sup>
                </h2>
              </div>
            </motion.div>
            {/* Features */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-4 mb-8"
            >
              {[
                { icon: Zap, text: 'Lightning Fast' },
                { icon: Globe, text: '100+ Platforms' },
                { icon: Sparkles, text: 'No Signup' },
                { icon: TrendingUp, text: 'Always Free' }
              ].map((feature, idx) => (
                <div key={idx} className="glass px-4 py-2 rounded-full flex items-center gap-2">
                  <feature.icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </div>
              ))}
            </motion.div>

            {/* Popular Platforms */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-wrap justify-center gap-3"
            >
              {[
                { Icon: Youtube, name: 'YouTube', color: 'text-red-400' },
                { Icon: Instagram, name: 'Instagram', color: 'text-pink-400' },
                { Icon: Twitter, name: 'Twitter', color: 'text-blue-400' },
                { Icon: Facebook, name: 'Facebook', color: 'text-blue-500' },
                { Icon: Music, name: 'SoundCloud', color: 'text-orange-400' },
                { Icon: Video, name: 'TikTok', color: 'text-purple-400' },
              ].map((platform, idx) => (
                <div key={idx} className="glass-strong px-3 py-2 rounded-lg flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                  <platform.Icon className={`w-5 h-5 ${platform.color}`} />
                  <span className="text-xs text-gray-300">{platform.name}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.section>

        {/* Navigation Tabs */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 mb-8"
        >
          <div className="glass-strong rounded-2xl p-2 flex gap-2 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('converters')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'converters'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Download className="w-5 h-5" />
                Converters
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <FileVideo className="w-5 h-5" />
                History
              </span>
            </button>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="max-w-7xl mx-auto px-4 pb-16"
        >
          {activeTab === 'converters' ? <ConverterGrid /> : <DownloadHistory />}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center text-gray-500 text-sm">
        <p>Made with ❤️ • No signup required • Always free • 100% privacy</p>
        <p className="mt-3 text-xs text-gray-400 max-w-3xl mx-auto px-4">
          <span className="inline-flex items-center justify-center w-4 h-4 mr-2 text-[10px] font-semibold bg-gray-900/70 text-white rounded-sm border border-gray-700">1</span>
          The file will be downloaded as <span className="font-medium text-white">.webm</span> in some cases — you may need to rename or convert it to <span className="font-medium text-white">.mp4</span>/.mp3 manually after download. It will still play normally after renaming.
        </p>
      </footer>
    </main>
  );
}
