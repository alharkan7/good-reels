'use client';

import { useState } from 'react';
import { useLanguage } from '@/app/contexts/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, lang: 'id' | 'en') => Promise<void>;
}

export default function SearchModal({ isOpen, onClose, onSearch }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const { lang } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            autoFocus
            placeholder={lang === 'id' ? 'Cth. Sejarah Roma...' : 'e.g. History of Rome...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
            className={`w-full bg-[#1a1a1a] border py-4 px-6 text-white placeholder-white/40 focus:outline-none transition-all duration-300 rounded-full shadow-2xl ${
              isSearching 
                ? 'border-white/50 animate-pulse' 
                : 'border-white/20 focus:border-white/50'
            }`}
          />
          {error && <p className="text-red-400 text-sm px-1 text-center drop-shadow-md font-medium">{error}</p>}
        </form>
      </div>
    </div>
  );
}
