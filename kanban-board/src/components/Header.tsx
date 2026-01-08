import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sun,
  Moon,
  LayoutGrid,
  List,
  Filter,
  X,
  Tag,
  AlertCircle,
  Keyboard,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { useBoardStore } from '../store/boardStore';
import { labelColors, priorityColors } from '../utils/colors';
import { shortcutsList } from '../hooks/useKeyboardShortcuts';
import type { Priority } from '../types';

export const Header = () => {
  const {
    board,
    searchQuery,
    setSearchQuery,
    filterLabels,
    setFilterLabels,
    filterPriority,
    setFilterPriority,
    isDarkMode,
    toggleDarkMode,
    isCompactMode,
    toggleCompactMode,
    resetBoard,
  } = useBoardStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const shortcutsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) {
        setShowShortcuts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = filterLabels.length > 0 || filterPriority !== null;
  const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

  const clearFilters = () => {
    setFilterLabels([]);
    setFilterPriority(null);
  };

  const toggleLabelFilter = (labelId: string) => {
    if (filterLabels.includes(labelId)) {
      setFilterLabels(filterLabels.filter((id) => id !== labelId));
    } else {
      setFilterLabels([...filterLabels, labelId]);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {board.title}
              </h1>
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                data-search-input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks... (Ctrl+K)"
                className="w-full pl-9 pr-9 py-2 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Filter button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  hasActiveFilters
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-500 text-white rounded-full">
                    {filterLabels.length + (filterPriority ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Filters
                      </h3>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Labels */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Labels
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {board.labels.map((label) => (
                          <button
                            key={label.id}
                            onClick={() => toggleLabelFilter(label.id)}
                            className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${
                              filterLabels.includes(label.id)
                                ? `${labelColors[label.color].bg} text-white ring-2 ring-offset-1 ring-${label.color}-400`
                                : `${labelColors[label.color].light} ${labelColors[label.color].text}`
                            }`}
                          >
                            {label.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Priority
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {priorities.map((priority) => (
                          <button
                            key={priority}
                            onClick={() =>
                              setFilterPriority(filterPriority === priority ? null : priority)
                            }
                            className={`px-2 py-1 text-xs font-medium rounded-md capitalize transition-all ${
                              filterPriority === priority
                                ? `${priorityColors[priority].bg} ${priorityColors[priority].text} ring-2 ring-offset-1`
                                : `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600`
                            }`}
                          >
                            {priority}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View toggle */}
            <button
              onClick={toggleCompactMode}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isCompactMode ? 'Normal view' : 'Compact view'}
            >
              {isCompactMode ? (
                <LayoutGrid className="w-4 h-4" />
              ) : (
                <List className="w-4 h-4" />
              )}
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isDarkMode ? 'Light mode' : 'Dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* Keyboard shortcuts */}
            <div className="relative" ref={shortcutsRef}>
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showShortcuts && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50"
                  >
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Keyboard Shortcuts
                    </h3>
                    <div className="space-y-2">
                      {shortcutsList.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {shortcut.description}
                          </span>
                          <div className="flex gap-1">
                            {shortcut.keys.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reset board */}
            <button
              onClick={() => {
                if (window.confirm('Reset board to default? This will clear all changes.')) {
                  resetBoard();
                }
              }}
              className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Reset board"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
