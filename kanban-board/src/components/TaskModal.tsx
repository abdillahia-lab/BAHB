import { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Tag,
  CheckSquare,
  MessageSquare,
  Trash2,
  Copy,
  Archive,
  Check,
  AlertCircle,
  Flag,
  Palette,
} from 'lucide-react';
import type { Task, Priority, LabelColor } from '../types';
import { useBoardStore } from '../store/boardStore';
import { labelColors, priorityColors, coverColors } from '../utils/colors';
import { formatRelativeTime, formatDateForInput } from '../utils/dates';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

export const TaskModal = ({ task, onClose }: TaskModalProps) => {
  const {
    board,
    updateTask,
    deleteTask,
    duplicateTask,
    archiveTask,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    addComment,
    deleteComment,
  } = useBoardStore();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const currentColumn = board.columns.find((col) => col.id === task.columnId);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      updateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      updateTask(task.id, { description });
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      addChecklistItem(task.id, newChecklistItem.trim());
      setNewChecklistItem('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
      onClose();
    }
  };

  const handleDuplicate = () => {
    duplicateTask(task.id);
    onClose();
  };

  const handleArchive = () => {
    archiveTask(task.id);
    onClose();
  };

  const toggleLabel = (labelId: string) => {
    const newLabels = task.labels.includes(labelId)
      ? task.labels.filter((id) => id !== labelId)
      : [...task.labels, labelId];
    updateTask(task.id, { labels: newLabels });
  };

  const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  const colors: LabelColor[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'];

  const completedChecklist = task.checklist.filter((item) => item.completed).length;
  const totalChecklist = task.checklist.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 pb-12 px-4 bg-black/50 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in"
      >
        {/* Cover */}
        {task.coverColor && (
          <div className={`h-24 ${coverColors[task.coverColor]}`} />
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            {/* Column indicator */}
            <div className="mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                in list{' '}
                <span className="text-gray-700 dark:text-gray-300">{currentColumn?.title}</span>
              </span>
            </div>

            {/* Title */}
            {isEditingTitle ? (
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleBlur();
                  if (e.key === 'Escape') {
                    setTitle(task.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full text-xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-indigo-500 focus:outline-none"
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                {task.title}
              </h2>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Main content */}
            <div className="col-span-2 space-y-6">
              {/* Labels */}
              {task.labels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Labels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.labels.map((labelId) => {
                      const label = board.labels.find((l) => l.id === labelId);
                      if (!label) return null;
                      return (
                        <span
                          key={labelId}
                          className={`px-3 py-1 text-sm font-medium text-white rounded-full ${labelColors[label.color].bg}`}
                        >
                          {label.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescriptionBlur}
                  placeholder="Add a more detailed description..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Checklist
                    {totalChecklist > 0 && (
                      <span className="text-xs text-gray-500">
                        ({completedChecklist}/{totalChecklist})
                      </span>
                    )}
                  </h3>
                </div>

                {totalChecklist > 0 && (
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          completedChecklist === totalChecklist ? 'bg-green-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-3">
                  {task.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 group"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) =>
                          updateChecklistItem(task.id, item.id, { completed: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span
                        className={`flex-1 text-sm ${
                          item.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {item.text}
                      </span>
                      <button
                        onClick={() => deleteChecklistItem(task.id, item.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                    placeholder="Add an item..."
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddChecklistItem}
                    disabled={!newChecklistItem.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Activity
                </h3>

                <div className="space-y-3 mb-3">
                  {task.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="group p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {comment.text}
                        </p>
                        <button
                          onClick={() => deleteComment(task.id, comment.id)}
                          className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 rounded-lg transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p>Created {formatRelativeTime(task.createdAt)}</p>
                <p>Updated {formatRelativeTime(task.updatedAt)}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-3">
              {/* Add to card */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Add to card
                </h4>
                <div className="space-y-2">
                  {/* Labels */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLabelPicker(!showLabelPicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Tag className="w-4 h-4" />
                      Labels
                    </button>
                    {showLabelPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 animate-scale-in">
                        <div className="space-y-1">
                          {board.labels.map((label) => (
                            <button
                              key={label.id}
                              onClick={() => toggleLabel(label.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-white ${labelColors[label.color].bg} hover:opacity-90`}
                            >
                              <span className="flex-1 text-left">{label.name}</span>
                              {task.labels.includes(label.id) && (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Due date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={formatDateForInput(task.dueDate)}
                      onChange={(e) =>
                        updateTask(task.id, {
                          dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        })
                      }
                      className="flex-1 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Priority */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPriorityPicker(!showPriorityPicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Flag className="w-4 h-4" />
                      Priority: {task.priority}
                    </button>
                    {showPriorityPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 animate-scale-in">
                        {priorities.map((priority) => (
                          <button
                            key={priority}
                            onClick={() => {
                              updateTask(task.id, { priority });
                              setShowPriorityPicker(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${priorityColors[priority].bg} ${priorityColors[priority].text} hover:opacity-80`}
                          >
                            {priority === 'urgent' && <AlertCircle className="w-4 h-4" />}
                            <span className="flex-1 text-left capitalize">{priority}</span>
                            {task.priority === priority && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cover color */}
                  <div className="relative">
                    <button
                      onClick={() => setShowCoverPicker(!showCoverPicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Palette className="w-4 h-4" />
                      Cover
                    </button>
                    {showCoverPicker && (
                      <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 animate-scale-in">
                        <div className="grid grid-cols-4 gap-1">
                          <button
                            onClick={() => {
                              updateTask(task.id, { coverColor: undefined });
                              setShowCoverPicker(false);
                            }}
                            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-400"
                          >
                            <X className="w-4 h-4 text-gray-400" />
                          </button>
                          {colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => {
                                updateTask(task.id, { coverColor: color });
                                setShowCoverPicker(false);
                              }}
                              className={`w-8 h-8 rounded ${labelColors[color].bg} hover:ring-2 ring-offset-2 ring-gray-400`}
                            >
                              {task.coverColor === color && (
                                <Check className="w-4 h-4 text-white mx-auto" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Actions
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={handleDuplicate}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={handleArchive}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
