'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { converters } from '@/lib/converters';
import ConverterCard from './ConverterCard';
import { Search } from 'lucide-react';

export default function ConverterGrid() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'youtube', 'instagram', 'twitter', 'tiktok', 'facebook', 'audio', 'other'];

  const filteredConverters = converters.filter(converter => {
    const matchesSearch = converter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      converter.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      converter.platform.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      converter.platform === selectedCategory ||
      (selectedCategory === 'audio' && (converter.icon === 'Music' || converter.icon === 'Volume2')) ||
      (selectedCategory === 'other' && !['youtube', 'instagram', 'twitter', 'tiktok', 'facebook'].includes(converter.platform));
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-2xl p-6 space-y-4"
      >
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search converters (e.g., YouTube, Instagram, MP3)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-400">
          Showing <span className="text-purple-400 font-semibold">{filteredConverters.length}</span> converter{filteredConverters.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      {/* Converters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConverters.map((converter, idx) => (
          <motion.div
            key={converter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <ConverterCard converter={converter} />
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredConverters.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-strong rounded-2xl p-12 text-center"
        >
          <p className="text-gray-400 text-lg">No converters found matching your search.</p>
          <p className="text-gray-500 text-sm mt-2">Try different keywords or select another category.</p>
        </motion.div>
      )}
    </div>
  );
}
