'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { converters } from '@/lib/converters';
import ConverterCard from './ConverterCard';
import { Search, Filter } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Search and Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 space-y-6"
      >
        {/* Search Input */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
            <input
              type="text"
              placeholder="Search converters (e.g., YouTube, Instagram, MP3)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#0a0a0f] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-gray-400 text-sm min-w-fit">
            <Filter className="w-4 h-4" />
            <span>Filter by:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${selectedCategory === category
                    ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] border border-purple-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center border-t border-white/5 pt-4">
          <p className="text-sm text-gray-400">
            Found <span className="text-white font-semibold">{filteredConverters.length}</span> converter{filteredConverters.length !== 1 ? 's' : ''}
          </p>
        </div>
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
          className="glass rounded-2xl p-12 text-center border border-white/5"
        >
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No converters found</h3>
          <p className="text-gray-400">Try adjusting your search or filter to find what you're looking for.</p>
        </motion.div>
      )}
    </div>
  );
}
