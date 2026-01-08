import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task, LabelColor, Column as ColumnType } from '../types';
import { useBoardStore, useActiveBoard } from '../store/boardStore';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { labelColors } from '../utils/colors';

export const Board = () => {
  const { tasks, selectedTaskId, setSelectedTask, moveTask, addColumn } =
    useBoardStore();
  const board = useActiveBoard();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState<LabelColor>('gray');

  const selectedTask = selectedTaskId
    ? tasks.find((t) => t.id === selectedTaskId)
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    // Check if over a column
    const overColumn = board?.columns.find((col: ColumnType) => col.id === overId);
    if (overColumn && activeTask.columnId !== overId) {
      const tasksInColumn = tasks.filter((t) => t.columnId === overId);
      moveTask(activeId, overId, tasksInColumn.length);
      return;
    }

    // Check if over a task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && activeTask.id !== overTask.id) {
      const overColumnId = overTask.columnId;
      const tasksInColumn = tasks
        .filter((t) => t.columnId === overColumnId)
        .sort((a, b) => a.position - b.position);
      const overIndex = tasksInColumn.findIndex((t) => t.id === overId);

      if (activeTask.columnId === overColumnId) {
        // Same column reorder
        moveTask(activeId, overColumnId, overIndex);
      } else {
        // Different column
        moveTask(activeId, overColumnId, overIndex);
      }
    }
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveTask(null);
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      addColumn(newColumnTitle.trim(), newColumnColor);
      setNewColumnTitle('');
      setNewColumnColor('gray');
      setIsAddingColumn(false);
    }
  };

  const colors: LabelColor[] = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'purple',
    'pink',
  ];

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-4 p-4 min-h-full items-start">
            {/* Columns */}
            {board?.columns
              .sort((a: ColumnType, b: ColumnType) => a.position - b.position)
              .map((column: ColumnType) => (
                <Column key={column.id} column={column} />
              ))}

            {/* Add column button/form */}
            <div className="flex-shrink-0 w-72">
              {isAddingColumn ? (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 p-3 animate-scale-in">
                  <input
                    type="text"
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddColumn();
                      if (e.key === 'Escape') {
                        setNewColumnTitle('');
                        setIsAddingColumn(false);
                      }
                    }}
                    placeholder="Enter column title..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    autoFocus
                  />

                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">
                      Column color
                    </label>
                    <div className="flex gap-1.5">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewColumnColor(color)}
                          className={`w-6 h-6 rounded-full ${labelColors[color].bg} ${
                            newColumnColor === color
                              ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500'
                              : ''
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColumn}
                      disabled={!newColumnTitle.trim()}
                      className="flex-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      Add column
                    </button>
                    <button
                      onClick={() => {
                        setNewColumnTitle('');
                        setIsAddingColumn(false);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add column
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask && (
            <div className="rotate-3 opacity-90">
              <TaskCard task={activeTask} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task modal */}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </>
  );
};
