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

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, lang: 'id' | 'en') => Promise<void>;
  onSelectCategory: (category: string | null) => void;
  activeCategory: string | null;
}

export default function SearchModal({
  isOpen,
  onClose,
  onSearch,
  onSelectCategory,
  activeCategory
}: SearchModalProps) {
  const [mode, setMode] = useState<'category' | 'search'>('category');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError('');
    try {
      await onSearch(query, lang);
      setQuery('');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : null;
      setError(msg || (lang === 'id' ? 'Tidak ada hasil. Coba kata kunci lain.' : 'No results found. Please try another term.'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSelectCategory(query.trim());
    setQuery('');
    onClose();
  };

  const handleClearCategory = () => {
    onSelectCategory(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>

        {/* Toggle between Search and Category */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 p-1 rounded-full flex gap-1">
            <button
              onClick={() => setMode('search')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'search' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
            >
              {lang === 'id' ? 'Pencarian' : 'Search'}
            </button>
            <button
              onClick={() => setMode('category')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === 'category' ? 'bg-white text-black' : 'text-white/60 hover:text-white'
                }`}
            >
              {lang === 'id' ? 'Algoritma' : 'Algorithm'}
            </button>
          </div>
        </div>

        {mode === 'search' ? (
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              autoFocus
              placeholder={lang === 'id' ? 'Cth. Sejarah Roma...' : 'e.g. History of Rome...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              className={`w-full bg-[#1a1a1a] border py-4 px-6 text-white placeholder-white/40 focus:outline-none transition-all duration-300 rounded-full shadow-2xl ${isSearching
                ? 'border-white/50 animate-pulse'
                : 'border-white/20 focus:border-white/50'
                }`}
            />
            {error && <p className="text-red-400 text-sm px-1 text-center drop-shadow-md font-medium">{error}</p>}
          </form>
        ) : (
          <div className="bg-[#1a1a1a] p-5 rounded-3xl border border-white/10 shadow-2xl">
            <div className="flex flex-wrap gap-2 justify-center mb-5">
              {PREDEFINED_CATEGORIES[lang].map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => {
                    onSelectCategory(cat.value);
                    onClose();
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${activeCategory === cat.value
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleCategorySubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={lang === 'id' ? 'Atau buat algoritma sendiri...' : 'Or create a custom algorithm...'}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-full py-3 px-5 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors shadow-inner"
              />
            </form>

            {activeCategory && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleClearCategory}
                  className="px-5 py-2 hover:border-white/50 bg-white/5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-all text-xs font-medium tracking-wide flex items-center justify-center gap-2"
                >
                  {lang === 'id' ? 'Reset Kategori' : 'Reset Category'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
