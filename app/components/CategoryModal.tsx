'use client';

import { useState } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';

const PREDEFINED_CATEGORIES: Record<'en' | 'id', { label: string; value: string }[]> = {
  en: [
    { label: 'Science', value: 'Science' },
    { label: 'History', value: 'History' },
    { label: 'Arts', value: 'Arts' },
    { label: 'Technology', value: 'Technology' },
    { label: 'Geography', value: 'Geography' },
    { label: 'Music', value: 'Music' },
    { label: 'Films', value: 'Films' },
    { label: 'Literature', value: 'Literature' },
  ],
  id: [
    { label: 'Sains', value: 'Sains' },
    { label: 'Sejarah', value: 'Sejarah' },
    { label: 'Seni', value: 'Seni' },
    { label: 'Teknologi', value: 'Teknologi' },
    { label: 'Geografi', value: 'Geografi' },
    { label: 'Musik', value: 'Musik' },
    { label: 'Film', value: 'Film' },
    { label: 'Sastra', value: 'Sastra' },
  ]
};

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: string | null) => void;
  activeCategory: string | null;
}

export default function CategoryModal({ isOpen, onClose, onSelectCategory, activeCategory }: CategoryModalProps) {
  const [query, setQuery] = useState('');
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSelectCategory(query.trim());
    onClose();
  };

  const handleClear = () => {
    onSelectCategory(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1a1a1a] p-5 rounded-3xl w-full max-w-sm border border-white/10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 text-center">
          <h3 className="text-xl font-bold text-white mb-1">
            {lang === 'id' ? 'Pilih Kategori' : 'Select Category'}
          </h3>
          <p className="text-white/50 text-xs text-center px-2">
            {lang === 'id' ? 'Wikipedia memiliki jutaan topik, coba satu di bawah ini:' : 'Wikipedia has millions of topics, try one below:'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-5">
          {PREDEFINED_CATEGORIES[lang].map((cat) => (
            <button
              key={cat.value}
              onClick={() => {
                onSelectCategory(cat.value);
                onClose();
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === cat.value 
                  ? 'bg-white/20 border-white/40 text-white' 
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={lang === 'id' ? 'Atau cari kategori kustom...' : 'Or search custom category...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-full py-3 px-5 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors shadow-inner"
          />
        </form>

        {activeCategory && (
          <button 
            onClick={handleClear}
            className="w-full mt-4 text-red-400 hover:text-red-300 transition-colors text-sm font-medium py-2 text-center"
          >
            {lang === 'id' ? 'Hapus Kategori (Acak Semua)' : 'Clear Category (Random All)'}
          </button>
        )}
      </div>
    </div>
  );
}
