import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  AlertCircle,
  Clock,
  GripVertical,
} from 'lucide-react';
import type { Task } from '../types';
import { useBoardStore, useLabel } from '../store/boardStore';
import { labelColors, priorityColors, coverColors } from '../utils/colors';
import { formatDueDate, isOverdue, isDueSoon } from '../utils/dates';

interface TaskCardProps {
  task: Task;
  isCompact?: boolean;
}

const LabelBadge = ({ labelId }: { labelId: string }) => {
  const label = useLabel(labelId);
  if (!label) return null;

  const colors = labelColors[label.color];
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors.bg} text-white`}
      title={label.name}
    >
      {label.name}
    </span>
  );
};

export const TaskCard = ({ task, isCompact = false }: TaskCardProps) => {
  const { setSelectedTask } = useBoardStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedChecklist = task.checklist.filter((item) => item.completed).length;
  const totalChecklist = task.checklist.length;
  const checklistProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

  const dueDateStatus = task.dueDate
    ? isOverdue(task.dueDate)
      ? 'overdue'
      : isDueSoon(task.dueDate)
      ? 'soon'
      : 'normal'
    : null;

  const priorityStyle = priorityColors[task.priority];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm
        border border-gray-200 dark:border-gray-700
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-200 cursor-pointer
        ${isDragging ? 'shadow-xl ring-2 ring-indigo-500 ring-opacity-50' : ''}
      `}
      onClick={() => setSelectedTask(task.id)}
    >
      {/* Cover color */}
      {task.coverColor && (
        <div className={`h-2 rounded-t-lg ${coverColors[task.coverColor]}`} />
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-opacity cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      <div className={`p-3 ${isCompact ? 'py-2' : ''}`}>
        {/* Priority indicator */}
        {task.priority === 'urgent' && (
          <div className="flex items-center gap-1 mb-2">
            <AlertCircle className={`w-3.5 h-3.5 ${priorityStyle.icon}`} />
            <span className={`text-xs font-medium ${priorityStyle.text}`}>
              Urgent
            </span>
          </div>
        )}

        {/* Labels */}
        {!isCompact && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.labels.slice(0, 3).map((labelId) => (
              <LabelBadge key={labelId} labelId={labelId} />
            ))}
            {task.labels.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-1">
                +{task.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 pr-6 leading-snug">
          {task.title}
        </h3>

        {/* Description preview */}
        {!isCompact && task.description && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Checklist progress bar */}
        {totalChecklist > 0 && !isCompact && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {completedChecklist}/{totalChecklist}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(checklistProgress)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  checklistProgress === 100
                    ? 'bg-green-500'
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer with metadata */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Due date */}
            {task.dueDate && (
              <div
                className={`flex items-center gap-1 text-xs rounded-md px-1.5 py-0.5 ${
                  dueDateStatus === 'overdue'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : dueDateStatus === 'soon'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {dueDateStatus === 'overdue' ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span>{formatDueDate(task.dueDate)}</span>
              </div>
            )}

            {/* Checklist count (compact view) */}
            {isCompact && totalChecklist > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <CheckSquare className="w-3 h-3" />
                <span>
                  {completedChecklist}/{totalChecklist}
                </span>
              </div>
            )}

            {/* Comments count */}
            {task.comments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-3 h-3" />
                <span>{task.comments.length}</span>
              </div>
            )}
          </div>

          {/* Priority badge (non-urgent) */}
          {task.priority !== 'urgent' && task.priority !== 'medium' && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${priorityStyle.bg} ${priorityStyle.text}`}
            >
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
