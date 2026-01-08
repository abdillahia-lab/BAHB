export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type LabelColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray';

export type ViewMode = 'board' | 'list' | 'timeline';
export type GroupBy = 'none' | 'priority' | 'label' | 'dueDate';

export interface Label {
  id: string;
  name: string;
  color: LabelColor;
}

export interface Checklist {
  id: string;
  text: string;
  completed: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  startTime: string;
  endTime?: string;
  description?: string;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  columnId: string;
  position: number;
  priority: Priority;
  labels: string[];
  dueDate?: string;
  checklist: Checklist[];
  subtasks: Subtask[];
  timeEntries: TimeEntry[];
  estimatedMinutes?: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  coverColor?: LabelColor;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  color: LabelColor;
  wipLimit?: number;
  collapsed?: boolean;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
  emoji?: string;
}

export interface HistoryEntry {
  boards: Board[];
  tasks: Task[];
  activeBoardId: string;
}

export interface BoardState {
  boards: Board[];
  activeBoardId: string;
  tasks: Task[];
  selectedTaskId: string | null;
  searchQuery: string;
  filterLabels: string[];
  filterPriority: Priority | null;
  isDarkMode: boolean;
  isCompactMode: boolean;
  viewMode: ViewMode;
  groupBy: GroupBy;
  activeTimer: { taskId: string; startTime: string } | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

export interface BoardActions {
  // Board management
  addBoard: (title: string, emoji?: string) => void;
  updateBoard: (boardId: string, updates: Partial<Board>) => void;
  deleteBoard: (boardId: string) => void;
  setActiveBoard: (boardId: string) => void;
  duplicateBoard: (boardId: string) => void;

  // Active board helpers
  getActiveBoard: () => Board | undefined;

  // Column actions
  addColumn: (title: string, color?: LabelColor) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  moveColumn: (columnId: string, newPosition: number) => void;
  toggleColumnCollapse: (columnId: string) => void;

  // Task actions
  addTask: (columnId: string, title: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => void;
  archiveTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;

  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Time tracking
  startTimer: (taskId: string) => void;
  stopTimer: () => void;
  addManualTime: (taskId: string, minutes: number, description?: string) => void;
  deleteTimeEntry: (taskId: string, entryId: string) => void;
  getTaskTotalTime: (taskId: string) => number;

  // Checklist actions
  addChecklistItem: (taskId: string, text: string) => void;
  updateChecklistItem: (taskId: string, itemId: string, updates: Partial<Checklist>) => void;
  deleteChecklistItem: (taskId: string, itemId: string) => void;

  // Comment actions
  addComment: (taskId: string, text: string) => void;
  updateComment: (taskId: string, commentId: string, text: string) => void;
  deleteComment: (taskId: string, commentId: string) => void;

  // Label actions
  addLabel: (name: string, color: LabelColor) => void;
  updateLabel: (labelId: string, updates: Partial<Label>) => void;
  deleteLabel: (labelId: string) => void;

  // UI state
  setSelectedTask: (taskId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterLabels: (labelIds: string[]) => void;
  setFilterPriority: (priority: Priority | null) => void;
  toggleDarkMode: () => void;
  toggleCompactMode: () => void;
  setViewMode: (mode: ViewMode) => void;
  setGroupBy: (groupBy: GroupBy) => void;

  // History (undo/redo)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Data management
  resetBoard: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

export type BoardStore = BoardState & BoardActions;
