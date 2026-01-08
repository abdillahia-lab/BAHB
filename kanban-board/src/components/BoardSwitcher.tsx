import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Plus,
  Copy,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { useBoardStore, useActiveBoard } from '../store/boardStore';
import type { Board } from '../types';

const emojis = ['📋', '🚀', '💡', '🎯', '📊', '🔧', '📱', '🎨', '📝', '⚡', '🏠', '💼'];

export const BoardSwitcher = () => {
  const {
    boards,
    addBoard,
    setActiveBoard,
    deleteBoard,
    duplicateBoard,
    updateBoard,
  } = useBoardStore();
  const activeBoard = useActiveBoard();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('📋');
  const [editTitle, setEditTitle] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingBoardId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isCreating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating]);

  const handleCreateBoard = () => {
    if (newBoardTitle.trim()) {
      addBoard(newBoardTitle.trim(), newBoardEmoji);
      setNewBoardTitle('');
      setNewBoardEmoji('📋');
      setIsCreating(false);
    }
  };

  const handleUpdateBoard = (boardId: string) => {
    if (editTitle.trim()) {
      updateBoard(boardId, { title: editTitle.trim() });
      setEditingBoardId(null);
    }
  };

  const handleDeleteBoard = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    if (boards.length > 1 && window.confirm('Delete this board? This cannot be undone.')) {
      deleteBoard(boardId);
    }
  };

  const handleDuplicateBoard = (e: React.MouseEvent, boardId: string) => {
    e.stopPropagation();
    duplicateBoard(boardId);
  };

  const startEditing = (e: React.MouseEvent, board: Board) => {
    e.stopPropagation();
    setEditingBoardId(board.id);
    setEditTitle(board.title);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 border border-gray-200 dark:border-gray-700 transition-all"
      >
        <span className="text-lg">{activeBoard?.emoji || '📋'}</span>
        <span className="font-semibold text-gray-900 dark:text-white max-w-[150px] truncate">
          {activeBoard?.title || 'Select Board'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-scale-in">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2">
              Your Boards
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => {
                  if (editingBoardId !== board.id) {
                    setActiveBoard(board.id);
                    setIsOpen(false);
                  }
                }}
                className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  board.id === activeBoard?.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <span className="text-lg flex-shrink-0">{board.emoji || '📋'}</span>

                {editingBoardId === board.id ? (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateBoard(board.id);
                        if (e.key === 'Escape') setEditingBoardId(null);
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateBoard(board.id);
                      }}
                      className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBoardId(null);
                      }}
                      className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">
                      {board.title}
                    </span>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => startEditing(e, board)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicateBoard(e, board.id)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {boards.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteBoard(e, board.id)}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Create new board */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            {isCreating ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <button
                      className="text-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Select emoji"
                    >
                      {newBoardEmoji}
                    </button>
                    <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 grid grid-cols-6 gap-1 z-10">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setNewBoardEmoji(emoji)}
                          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 ${
                            newBoardEmoji === emoji ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateBoard();
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewBoardTitle('');
                      }
                    }}
                    placeholder="Board name..."
                    className="flex-1 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateBoard}
                    disabled={!newBoardTitle.trim()}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 rounded-lg transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewBoardTitle('');
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Board
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
