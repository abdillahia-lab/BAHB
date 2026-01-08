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
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  labels: Label[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  board: Board;
  tasks: Task[];
  selectedTaskId: string | null;
  searchQuery: string;
  filterLabels: string[];
  filterPriority: Priority | null;
  isDarkMode: boolean;
  isCompactMode: boolean;
}

export interface BoardActions {
  // Board actions
  updateBoard: (updates: Partial<Board>) => void;

  // Column actions
  addColumn: (title: string, color?: LabelColor) => void;
  updateColumn: (columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (columnId: string) => void;
  moveColumn: (columnId: string, newPosition: number) => void;

  // Task actions
  addTask: (columnId: string, title: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (taskId: string, targetColumnId: string, newPosition: number) => void;
  archiveTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => void;

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

  // Persistence
  loadFromStorage: () => void;
  resetBoard: () => void;
}

export type BoardStore = BoardState & BoardActions;
