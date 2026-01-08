import { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import type { Column as ColumnType } from '../types';
import { useBoardStore, useTasksByColumn } from '../store/boardStore';
import { TaskCard } from './TaskCard';
import { columnHeaderColors, labelColors } from '../utils/colors';

interface ColumnProps {
  column: ColumnType;
}

export const Column = ({ column }: ColumnProps) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { addTask, updateColumn, deleteColumn, isCompactMode } = useBoardStore();
  const tasks = useTasksByColumn(column.id);

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const isOverWipLimit = column.wipLimit && tasks.length >= column.wipLimit;

  useEffect(() => {
    if (isAddingTask && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingTask]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      addTask(column.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== column.title) {
      updateColumn(column.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  const handleDelete = () => {
    if (tasks.length > 0) {
      if (!window.confirm(`Delete "${column.title}" and all ${tasks.length} task(s)?`)) {
        return;
      }
    }
    deleteColumn(column.id);
  };

  const headerGradient = columnHeaderColors[column.color];
  const dotColor = labelColors[column.color].bg;

  return (
    <div
      className={`
        flex-shrink-0 w-72 flex flex-col max-h-full
        bg-gray-50 dark:bg-gray-900/50 rounded-xl
        border border-gray-200 dark:border-gray-800
        transition-all duration-200 animate-slide-in
        ${isOver ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''}
      `}
    >
      {/* Column Header */}
      <div
        className={`
          px-3 py-3 border-l-4 rounded-t-xl
          bg-gradient-to-r ${headerGradient}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />

            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="flex-1 px-1.5 py-0.5 text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <h2
                className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                onClick={() => setIsEditingTitle(true)}
              >
                {column.title}
              </h2>
            )}

            <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded">
              {tasks.length}
              {column.wipLimit && (
                <span className={isOverWipLimit ? 'text-red-500' : ''}>
                  /{column.wipLimit}
                </span>
              )}
            </span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-scale-in">
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit2 className="w-4 h-4" />
                  Rename column
                </button>
                <button
                  onClick={() => {
                    handleDelete();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete column
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WIP Limit Warning */}
        {isOverWipLimit && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WIP limit reached</span>
          </div>
        )}
      </div>

      {/* Task List */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2 min-h-[100px]"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} isCompact={isCompactMode} />
          ))}
        </SortableContext>

        {/* Drop zone indicator */}
        {isOver && tasks.length === 0 && (
          <div className="h-20 border-2 border-dashed border-indigo-300 dark:border-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-sm text-indigo-500 dark:text-indigo-400">
              Drop here
            </span>
          </div>
        )}
      </div>

      {/* Add Task */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        {isAddingTask ? (
          <div className="space-y-2 animate-slide-in">
            <input
              ref={inputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter task title..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Add
              </button>
              <button
                onClick={() => {
                  setNewTaskTitle('');
                  setIsAddingTask(false);
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            data-add-task-button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        )}
      </div>
    </div>
  );
};
