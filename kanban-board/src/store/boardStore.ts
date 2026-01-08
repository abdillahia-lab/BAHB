import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { BoardStore, Board, Column, Task, Label, HistoryEntry } from '../types';

const MAX_HISTORY = 50;

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

const defaultBoardId = 'board-default';

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
    subtasks: [],
    timeEntries: [],
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
    subtasks: [
      { id: 'st-1', title: 'Mobile responsive design', completed: false, createdAt: new Date().toISOString() },
      { id: 'st-2', title: 'Accessibility review', completed: false, createdAt: new Date().toISOString() },
    ],
    timeEntries: [
      { id: 'te-1', startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), description: 'Initial wireframes' },
    ],
    estimatedMinutes: 480,
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
    subtasks: [],
    timeEntries: [],
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
    subtasks: [],
    timeEntries: [],
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
    subtasks: [],
    timeEntries: [],
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
    subtasks: [],
    timeEntries: [],
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
    subtasks: [],
    timeEntries: [],
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
    subtasks: [],
    timeEntries: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archived: false,
  },
];

const createDefaultBoard = (id?: string): Board => ({
  id: id || uuidv4(),
  title: 'Project Board',
  description: 'Manage your project tasks efficiently',
  columns: defaultColumns.map(col => ({ ...col, id: id ? col.id : uuidv4() })),
  labels: defaultLabels.map(label => ({ ...label, id: id ? label.id : uuidv4() })),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  emoji: '📋',
});

interface StateSnapshot {
  boards: Board[];
  tasks: Task[];
  activeBoardId: string;
}

const getDefaultState = () => ({
  boards: [createDefaultBoard(defaultBoardId)],
  activeBoardId: defaultBoardId,
  tasks: sampleTasks,
  selectedTaskId: null as string | null,
  searchQuery: '',
  filterLabels: [] as string[],
  filterPriority: null as null,
  isDarkMode: false,
  isCompactMode: false,
  viewMode: 'board' as const,
  groupBy: 'none' as const,
  activeTimer: null as { taskId: string; startTime: string } | null,
  past: [] as HistoryEntry[],
  future: [] as HistoryEntry[],
});

// Helper to save state to history
const saveToHistory = (state: StateSnapshot): HistoryEntry => ({
  boards: JSON.parse(JSON.stringify(state.boards)),
  tasks: JSON.parse(JSON.stringify(state.tasks)),
  activeBoardId: state.activeBoardId,
});

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      ...getDefaultState(),

      // Helper to get active board
      getActiveBoard: () => {
        const state = get();
        return state.boards.find(b => b.id === state.activeBoardId);
      },

      // For backwards compatibility, expose board getter
      get board() {
        const state = get();
        return state.boards.find(b => b.id === state.activeBoardId) || state.boards[0];
      },

      // Board management
      addBoard: (title, emoji) =>
        set((state) => {
          const history = saveToHistory(state);
          const newBoard = createDefaultBoard();
          newBoard.title = title;
          newBoard.emoji = emoji;
          newBoard.columns = [
            { id: uuidv4(), title: 'To Do', position: 0, color: 'blue' },
            { id: uuidv4(), title: 'In Progress', position: 1, color: 'yellow' },
            { id: uuidv4(), title: 'Done', position: 2, color: 'green' },
          ];
          return {
            boards: [...state.boards, newBoard],
            activeBoardId: newBoard.id,
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      updateBoard: (boardId, updates) =>
        set((state) => {
          const history = saveToHistory(state);
          return {
            boards: state.boards.map((board) =>
              board.id === boardId
                ? { ...board, ...updates, updatedAt: new Date().toISOString() }
                : board
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      deleteBoard: (boardId) =>
        set((state) => {
          if (state.boards.length <= 1) return state;
          const history = saveToHistory(state);
          const newBoards = state.boards.filter((b) => b.id !== boardId);
          const newActiveBoardId = state.activeBoardId === boardId
            ? newBoards[0].id
            : state.activeBoardId;
          return {
            boards: newBoards,
            activeBoardId: newActiveBoardId,
            tasks: state.tasks.filter((t) => {
              const board = state.boards.find(b => b.id === boardId);
              return !board?.columns.some(col => col.id === t.columnId);
            }),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      setActiveBoard: (boardId) =>
        set((state) => {
          if (!state.boards.find(b => b.id === boardId)) return state;
          return { activeBoardId: boardId, selectedTaskId: null };
        }),

      duplicateBoard: (boardId) =>
        set((state) => {
          const history = saveToHistory(state);
          const board = state.boards.find((b) => b.id === boardId);
          if (!board) return state;

          const idMap: Record<string, string> = {};
          const newBoardId = uuidv4();

          const newColumns = board.columns.map(col => {
            const newId = uuidv4();
            idMap[col.id] = newId;
            return { ...col, id: newId };
          });

          const newLabels = board.labels.map(label => {
            const newId = uuidv4();
            idMap[label.id] = newId;
            return { ...label, id: newId };
          });

          const boardTasks = state.tasks.filter(t =>
            board.columns.some(col => col.id === t.columnId)
          );

          const newTasks = boardTasks.map(task => ({
            ...task,
            id: uuidv4(),
            columnId: idMap[task.columnId] || task.columnId,
            labels: task.labels.map(l => idMap[l] || l),
            checklist: task.checklist.map(c => ({ ...c, id: uuidv4() })),
            subtasks: task.subtasks.map(s => ({ ...s, id: uuidv4() })),
            timeEntries: task.timeEntries.map(t => ({ ...t, id: uuidv4() })),
            comments: task.comments.map(c => ({ ...c, id: uuidv4() })),
          }));

          const newBoard: Board = {
            ...board,
            id: newBoardId,
            title: `${board.title} (copy)`,
            columns: newColumns,
            labels: newLabels,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          return {
            boards: [...state.boards, newBoard],
            tasks: [...state.tasks, ...newTasks],
            activeBoardId: newBoardId,
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      // Column actions
      addColumn: (title, color = 'gray') =>
        set((state) => {
          const history = saveToHistory(state);
          const board = state.boards.find(b => b.id === state.activeBoardId);
          if (!board) return state;

          const newColumn: Column = {
            id: uuidv4(),
            title,
            position: board.columns.length,
            color,
          };

          return {
            boards: state.boards.map(b =>
              b.id === state.activeBoardId
                ? { ...b, columns: [...b.columns, newColumn], updatedAt: new Date().toISOString() }
                : b
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      updateColumn: (columnId, updates) =>
        set((state) => {
          const history = saveToHistory(state);
          return {
            boards: state.boards.map(b =>
              b.id === state.activeBoardId
                ? {
                    ...b,
                    columns: b.columns.map((col) =>
                      col.id === columnId ? { ...col, ...updates } : col
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      deleteColumn: (columnId) =>
        set((state) => {
          const history = saveToHistory(state);
          return {
            boards: state.boards.map(b =>
              b.id === state.activeBoardId
                ? {
                    ...b,
                    columns: b.columns
                      .filter((col) => col.id !== columnId)
                      .map((col, index) => ({ ...col, position: index })),
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
            tasks: state.tasks.filter((task) => task.columnId !== columnId),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      moveColumn: (columnId, newPosition) =>
        set((state) => {
          const history = saveToHistory(state);
          const board = state.boards.find(b => b.id === state.activeBoardId);
          if (!board) return state;

          const columns = [...board.columns];
          const columnIndex = columns.findIndex((col) => col.id === columnId);
          if (columnIndex === -1) return state;

          const [column] = columns.splice(columnIndex, 1);
          columns.splice(newPosition, 0, column);

          return {
            boards: state.boards.map(b =>
              b.id === state.activeBoardId
                ? {
                    ...b,
                    columns: columns.map((col, index) => ({ ...col, position: index })),
                    updatedAt: new Date().toISOString(),
                  }
                : b
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      toggleColumnCollapse: (columnId) =>
        set((state) => ({
          boards: state.boards.map(b =>
            b.id === state.activeBoardId
              ? {
                  ...b,
                  columns: b.columns.map((col) =>
                    col.id === columnId ? { ...col, collapsed: !col.collapsed } : col
                  ),
                }
              : b
          ),
        })),

      // Task actions
      addTask: (columnId, title) =>
        set((state) => {
          const history = saveToHistory(state);
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
            subtasks: [],
            timeEntries: [],
            comments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: false,
          };
          return {
            tasks: [...state.tasks, newTask],
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      updateTask: (taskId, updates) =>
        set((state) => {
          const history = saveToHistory(state);
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, ...updates, updatedAt: new Date().toISOString() }
                : task
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      deleteTask: (taskId) =>
        set((state) => {
          const history = saveToHistory(state);
          return {
            tasks: state.tasks.filter((task) => task.id !== taskId),
            selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
            activeTimer: state.activeTimer?.taskId === taskId ? null : state.activeTimer,
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

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
        set((state) => {
          const history = saveToHistory(state);
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? { ...task, archived: true, updatedAt: new Date().toISOString() }
                : task
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      duplicateTask: (taskId) =>
        set((state) => {
          const history = saveToHistory(state);
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
            subtasks: task.subtasks.map((item) => ({ ...item, id: uuidv4() })),
            timeEntries: [],
            comments: [],
          };

          return {
            tasks: [...state.tasks, newTask],
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      // Subtask actions
      addSubtask: (taskId, title) =>
        set((state) => {
          const history = saveToHistory(state);
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: [
                      ...task.subtasks,
                      { id: uuidv4(), title, completed: false, createdAt: new Date().toISOString() },
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : task
            ),
            past: [...state.past.slice(-MAX_HISTORY + 1), history],
            future: [],
          };
        }),

      toggleSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((s) =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      deleteSubtask: (taskId, subtaskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      // Time tracking
      startTimer: (taskId) =>
        set((state) => {
          if (state.activeTimer) {
            // Stop existing timer first
            const existingTask = state.tasks.find(t => t.id === state.activeTimer!.taskId);
            if (existingTask) {
              const endTime = new Date().toISOString();
              return {
                tasks: state.tasks.map((task) =>
                  task.id === state.activeTimer!.taskId
                    ? {
                        ...task,
                        timeEntries: [
                          ...task.timeEntries,
                          { id: uuidv4(), startTime: state.activeTimer!.startTime, endTime },
                        ],
                        updatedAt: new Date().toISOString(),
                      }
                    : task
                ),
                activeTimer: { taskId, startTime: new Date().toISOString() },
              };
            }
          }
          return { activeTimer: { taskId, startTime: new Date().toISOString() } };
        }),

      stopTimer: () =>
        set((state) => {
          if (!state.activeTimer) return state;
          const endTime = new Date().toISOString();
          return {
            tasks: state.tasks.map((task) =>
              task.id === state.activeTimer!.taskId
                ? {
                    ...task,
                    timeEntries: [
                      ...task.timeEntries,
                      { id: uuidv4(), startTime: state.activeTimer!.startTime, endTime },
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : task
            ),
            activeTimer: null,
          };
        }),

      addManualTime: (taskId, minutes, description) =>
        set((state) => {
          const startTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
          const endTime = new Date().toISOString();
          return {
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    timeEntries: [
                      ...task.timeEntries,
                      { id: uuidv4(), startTime, endTime, description },
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : task
            ),
          };
        }),

      deleteTimeEntry: (taskId, entryId) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  timeEntries: task.timeEntries.filter((e) => e.id !== entryId),
                  updatedAt: new Date().toISOString(),
                }
              : task
          ),
        })),

      getTaskTotalTime: (taskId) => {
        const state = get();
        const task = state.tasks.find((t) => t.id === taskId);
        if (!task) return 0;

        let total = task.timeEntries.reduce((acc, entry) => {
          if (entry.endTime) {
            return acc + (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime());
          }
          return acc;
        }, 0);

        // Add active timer if running for this task
        if (state.activeTimer?.taskId === taskId) {
          total += Date.now() - new Date(state.activeTimer.startTime).getTime();
        }

        return Math.round(total / 60000); // Return minutes
      },

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
          boards: state.boards.map(b =>
            b.id === state.activeBoardId
              ? {
                  ...b,
                  labels: [...b.labels, { id: uuidv4(), name, color }],
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        })),

      updateLabel: (labelId, updates) =>
        set((state) => ({
          boards: state.boards.map(b =>
            b.id === state.activeBoardId
              ? {
                  ...b,
                  labels: b.labels.map((label) =>
                    label.id === labelId ? { ...label, ...updates } : label
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        })),

      deleteLabel: (labelId) =>
        set((state) => ({
          boards: state.boards.map(b =>
            b.id === state.activeBoardId
              ? {
                  ...b,
                  labels: b.labels.filter((label) => label.id !== labelId),
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
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
      setViewMode: (mode) => set({ viewMode: mode }),
      setGroupBy: (groupBy) => set({ groupBy }),

      // Undo/Redo
      undo: () =>
        set((state) => {
          if (state.past.length === 0) return state;
          const previous = state.past[state.past.length - 1];
          const current = saveToHistory(state);
          return {
            boards: previous.boards,
            tasks: previous.tasks,
            activeBoardId: previous.activeBoardId,
            past: state.past.slice(0, -1),
            future: [current, ...state.future].slice(0, MAX_HISTORY),
          };
        }),

      redo: () =>
        set((state) => {
          if (state.future.length === 0) return state;
          const next = state.future[0];
          const current = saveToHistory(state);
          return {
            boards: next.boards,
            tasks: next.tasks,
            activeBoardId: next.activeBoardId,
            past: [...state.past, current].slice(-MAX_HISTORY),
            future: state.future.slice(1),
          };
        }),

      canUndo: () => get().past.length > 0,
      canRedo: () => get().future.length > 0,

      // Data management
      resetBoard: () =>
        set({
          ...getDefaultState(),
        }),

      exportData: () => {
        const state = get();
        return JSON.stringify({
          boards: state.boards,
          tasks: state.tasks,
          activeBoardId: state.activeBoardId,
          exportedAt: new Date().toISOString(),
          version: '2.0',
        }, null, 2);
      },

      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          if (!data.boards || !data.tasks) return false;

          set((state) => {
            const history = saveToHistory(state);
            return {
              boards: data.boards,
              tasks: data.tasks,
              activeBoardId: data.activeBoardId || data.boards[0]?.id,
              past: [...state.past.slice(-MAX_HISTORY + 1), history],
              future: [],
            };
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'kanban-board-storage-v2',
      partialize: (state) => ({
        boards: state.boards,
        tasks: state.tasks,
        activeBoardId: state.activeBoardId,
        isDarkMode: state.isDarkMode,
        isCompactMode: state.isCompactMode,
        viewMode: state.viewMode,
        groupBy: state.groupBy,
      }),
    }
  )
);

// Selectors
export const useFilteredTasks = () => {
  const { tasks, searchQuery, filterLabels, filterPriority, activeBoardId, boards } = useBoardStore();
  const board = boards.find(b => b.id === activeBoardId);
  const columnIds = board?.columns.map(c => c.id) || [];

  return tasks.filter((task) => {
    if (task.archived) return false;
    if (!columnIds.includes(task.columnId)) return false;

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
  const { boards, activeBoardId } = useBoardStore();
  const board = boards.find(b => b.id === activeBoardId);
  return board?.labels.find((label) => label.id === labelId);
};

export const useActiveBoard = () => {
  const { boards, activeBoardId } = useBoardStore();
  return boards.find(b => b.id === activeBoardId);
};
