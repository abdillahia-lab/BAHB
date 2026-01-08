import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { BoardStore, Column, Task, Label, LabelColor, Priority, Checklist } from '../types';

const defaultLabels: Label[] = [
  { id: 'label-1', name: 'Bug', color: 'red' },
  { id: 'label-2', name: 'Feature', color: 'blue' },
  { id: 'label-3', name: 'Enhancement', color: 'purple' },
  { id: 'label-4', name: 'Documentation', color: 'green' },
  { id: 'label-5', name: 'Design', color: 'pink' },
  { id: 'label-6', name: 'Research', color: 'yellow' },
];

const defaultColumns: Column[] = [
  { id: 'col-1', title: 'Backlog', position: 0, color: 'gray' },
  { id: 'col-2', title: 'To Do', position: 1, color: 'blue' },
  { id: 'col-3', title: 'In Progress', position: 2, color: 'yellow', wipLimit: 3 },
  { id: 'col-4', title: 'Review', position: 3, color: 'purple' },
  { id: 'col-5', title: 'Done', position: 4, color: 'green' },
];

const sampleTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Research competitor features',
    description: 'Analyze what features competitors offer and identify gaps we can fill.',
    columnId: 'col-5',
    position: 0,
    priority: 'medium',
    labels: ['label-6'],
    checklist: [
      { id: 'cl-1', text: 'List top 5 competitors', completed: true },
      { id: 'cl-2', text: 'Create comparison matrix', completed: true },
      { id: 'cl-3', text: 'Identify unique opportunities', completed: true },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    archived: false,
  },
  {
    id: 'task-2',
    title: 'Design new dashboard layout',
    description: 'Create wireframes and mockups for the new dashboard design.',
    columnId: 'col-4',
    position: 0,
    priority: 'high',
    labels: ['label-5'],
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    checklist: [
      { id: 'cl-4', text: 'Create wireframes', completed: true },
      { id: 'cl-5', text: 'Design high-fidelity mockups', completed: true },
      { id: 'cl-6', text: 'Get stakeholder approval', completed: false },
    ],
    comments: [
      { id: 'com-1', text: 'Looking great so far!', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    coverColor: 'pink',
  },
  {
    id: 'task-3',
    title: 'Implement user authentication',
    description: 'Add OAuth2 authentication with Google and GitHub providers.',
    columnId: 'col-3',
    position: 0,
    priority: 'urgent',
    labels: ['label-2'],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    checklist: [
      { id: 'cl-7', text: 'Set up OAuth providers', completed: true },
      { id: 'cl-8', text: 'Create login/logout flow', completed: false },
      { id: 'cl-9', text: 'Add session management', completed: false },
      { id: 'cl-10', text: 'Write tests', completed: false },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
  },
  {
    id: 'task-4',
    title: 'Fix memory leak in data fetching',
    description: 'There is a memory leak when components unmount during active fetch requests.',
    columnId: 'col-3',
    position: 1,
    priority: 'high',
    labels: ['label-1'],
    checklist: [],
    comments: [],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
    coverColor: 'red',
  },
  {
    id: 'task-5',
    title: 'Add dark mode support',
    description: 'Implement system-aware dark mode with manual toggle option.',
    columnId: 'col-2',
    position: 0,
    priority: 'medium',
    labels: ['label-2', 'label-5'],
    checklist: [
      { id: 'cl-11', text: 'Define color variables', completed: false },
      { id: 'cl-12', text: 'Update components', completed: false },
      { id: 'cl-13', text: 'Add toggle in settings', completed: false },
    ],
    comments: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
  },
  {
    id: 'task-6',
    title: 'Write API documentation',
    description: 'Document all REST endpoints with examples and response schemas.',
    columnId: 'col-2',
    position: 1,
    priority: 'low',
    labels: ['label-4'],
    checklist: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
  },
  {
    id: 'task-7',
    title: 'Optimize image loading',
    description: 'Implement lazy loading and progressive image loading for better performance.',
    columnId: 'col-1',
    position: 0,
    priority: 'medium',
    labels: ['label-3'],
    checklist: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
  },
  {
    id: 'task-8',
    title: 'Add keyboard shortcuts',
    description: 'Implement keyboard navigation and shortcuts for power users.',
    columnId: 'col-1',
    position: 1,
    priority: 'low',
    labels: ['label-2', 'label-3'],
    checklist: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
  },
];

const createDefaultBoard = () => ({
  id: uuidv4(),
  title: 'Project Board',
  description: 'Manage your project tasks efficiently',
  columns: defaultColumns,
  labels: defaultLabels,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      // Initial state
      board: createDefaultBoard(),
      tasks: sampleTasks,
      selectedTaskId: null,
      searchQuery: '',
      filterLabels: [],
      filterPriority: null,
      isDarkMode: false,
      isCompactMode: false,

      // Board actions
      updateBoard: (updates) =>
        set((state) => ({
          board: {
            ...state.board,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        })),

      // Column actions
      addColumn: (title, color = 'gray') =>
        set((state) => {
          const newColumn: Column = {
            id: uuidv4(),
            title,
            position: state.board.columns.length,
            color,
          };
          return {
            board: {
              ...state.board,
              columns: [...state.board.columns, newColumn],
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      updateColumn: (columnId, updates) =>
        set((state) => ({
          board: {
            ...state.board,
            columns: state.board.columns.map((col) =>
              col.id === columnId ? { ...col, ...updates } : col
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteColumn: (columnId) =>
        set((state) => ({
          board: {
            ...state.board,
            columns: state.board.columns
              .filter((col) => col.id !== columnId)
              .map((col, index) => ({ ...col, position: index })),
            updatedAt: new Date().toISOString(),
          },
          tasks: state.tasks.filter((task) => task.columnId !== columnId),
        })),

      moveColumn: (columnId, newPosition) =>
        set((state) => {
          const columns = [...state.board.columns];
          const columnIndex = columns.findIndex((col) => col.id === columnId);
          if (columnIndex === -1) return state;

          const [column] = columns.splice(columnIndex, 1);
          columns.splice(newPosition, 0, column);

          return {
            board: {
              ...state.board,
              columns: columns.map((col, index) => ({ ...col, position: index })),
              updatedAt: new Date().toISOString(),
            },
          };
        }),

      // Task actions
      addTask: (columnId, title) =>
        set((state) => {
          const tasksInColumn = state.tasks.filter((t) => t.columnId === columnId);
          const newTask: Task = {
            id: uuidv4(),
            title,
            description: '',
            columnId,
            position: tasksInColumn.length,
            priority: 'medium',
            labels: [],
            checklist: [],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
          };
          return { tasks: [...state.tasks, newTask] };
        }),

      updateTask: (taskId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        })),

      deleteTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== taskId),
          selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
        })),

      moveTask: (taskId, targetColumnId, newPosition) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const sourceColumnId = task.columnId;
          let updatedTasks = state.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, columnId: targetColumnId, position: newPosition, updatedAt: new Date().toISOString() };
            }
            return t;
          });

          // Reorder tasks in target column
          const targetTasks = updatedTasks
            .filter((t) => t.columnId === targetColumnId && t.id !== taskId)
            .sort((a, b) => a.position - b.position);

          targetTasks.splice(newPosition, 0, updatedTasks.find((t) => t.id === taskId)!);
          const reorderedTargetTasks = targetTasks.map((t, index) => ({ ...t, position: index }));

          // Reorder tasks in source column if different
          if (sourceColumnId !== targetColumnId) {
            const sourceTasks = updatedTasks
              .filter((t) => t.columnId === sourceColumnId)
              .sort((a, b) => a.position - b.position)
              .map((t, index) => ({ ...t, position: index }));

            updatedTasks = updatedTasks.map((t) => {
              const reorderedTarget = reorderedTargetTasks.find((rt) => rt.id === t.id);
              if (reorderedTarget) return reorderedTarget;
              const reorderedSource = sourceTasks.find((st) => st.id === t.id);
              if (reorderedSource) return reorderedSource;
              return t;
            });
          } else {
            updatedTasks = updatedTasks.map((t) => {
              const reordered = reorderedTargetTasks.find((rt) => rt.id === t.id);
              return reordered || t;
            });
          }

          return { tasks: updatedTasks };
        }),

      archiveTask: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, archived: true, updatedAt: new Date().toISOString() }
              : task
          ),
        })),

      duplicateTask: (taskId) =>
        set((state) => {
          const task = state.tasks.find((t) => t.id === taskId);
          if (!task) return state;

          const tasksInColumn = state.tasks.filter((t) => t.columnId === task.columnId);
          const newTask: Task = {
            ...task,
            id: uuidv4(),
            title: `${task.title} (copy)`,
            position: tasksInColumn.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            checklist: task.checklist.map((item) => ({ ...item, id: uuidv4() })),
            comments: [],
          };

          return { tasks: [...state.tasks, newTask] };
        }),

      // Checklist actions
      addChecklistItem: (taskId, text) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  checklist: [...task.checklist, { id: uuidv4(), text, completed: false }],
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      updateChecklistItem: (taskId, itemId, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  checklist: task.checklist.map((item) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      deleteChecklistItem: (taskId, itemId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  checklist: task.checklist.filter((item) => item.id !== itemId),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      // Comment actions
      addComment: (taskId, text) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: [
                    ...task.comments,
                    { id: uuidv4(), text, createdAt: new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      updateComment: (taskId, commentId, text) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: task.comments.map((comment) =>
                    comment.id === commentId
                      ? { ...comment, text, updatedAt: new Date().toISOString() }
                      : comment
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      deleteComment: (taskId, commentId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  comments: task.comments.filter((comment) => comment.id !== commentId),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      // Label actions
      addLabel: (name, color) =>
        set((state) => ({
          board: {
            ...state.board,
            labels: [...state.board.labels, { id: uuidv4(), name, color }],
            updatedAt: new Date().toISOString(),
          },
        })),

      updateLabel: (labelId, updates) =>
        set((state) => ({
          board: {
            ...state.board,
            labels: state.board.labels.map((label) =>
              label.id === labelId ? { ...label, ...updates } : label
            ),
            updatedAt: new Date().toISOString(),
          },
        })),

      deleteLabel: (labelId) =>
        set((state) => ({
          board: {
            ...state.board,
            labels: state.board.labels.filter((label) => label.id !== labelId),
            updatedAt: new Date().toISOString(),
          },
          tasks: state.tasks.map((task) => ({
            ...task,
            labels: task.labels.filter((id) => id !== labelId),
          })),
        })),

      // UI state
      setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterLabels: (labelIds) => set({ filterLabels: labelIds }),
      setFilterPriority: (priority) => set({ filterPriority: priority }),
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleCompactMode: () => set((state) => ({ isCompactMode: !state.isCompactMode })),

      // Persistence
      loadFromStorage: () => {
        // This is handled by persist middleware
      },

      resetBoard: () =>
        set({
          board: createDefaultBoard(),
          tasks: sampleTasks,
          selectedTaskId: null,
          searchQuery: '',
          filterLabels: [],
          filterPriority: null,
        }),
    }),
    {
      name: 'kanban-board-storage',
      partialize: (state) => ({
        board: state.board,
        tasks: state.tasks,
        isDarkMode: state.isDarkMode,
        isCompactMode: state.isCompactMode,
      }),
    }
  )
);

// Selectors
export const useFilteredTasks = () => {
  const { tasks, searchQuery, filterLabels, filterPriority } = useBoardStore();

  return tasks.filter((task) => {
    if (task.archived) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = task.title.toLowerCase().includes(query);
      const matchesDescription = task.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) return false;
    }

    // Label filter
    if (filterLabels.length > 0) {
      const hasMatchingLabel = filterLabels.some((labelId) => task.labels.includes(labelId));
      if (!hasMatchingLabel) return false;
    }

    // Priority filter
    if (filterPriority && task.priority !== filterPriority) return false;

    return true;
  });
};

export const useTasksByColumn = (columnId: string) => {
  const filteredTasks = useFilteredTasks();
  return filteredTasks
    .filter((task) => task.columnId === columnId)
    .sort((a, b) => a.position - b.position);
};

export const useLabel = (labelId: string) => {
  const labels = useBoardStore((state) => state.board.labels);
  return labels.find((label) => label.id === labelId);
};
