import { useEffect, useCallback } from 'react';
import { useBoardStore } from '../store/boardStore';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const {
    toggleDarkMode,
    toggleCompactMode,
    setSearchQuery,
    setSelectedTask,
    undo,
    redo,
  } = useBoardStore();

  const shortcuts: ShortcutConfig[] = [
    {
      key: 'z',
      ctrl: true,
      handler: undo,
      description: 'Undo',
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      handler: redo,
      description: 'Redo',
    },
    {
      key: 'y',
      ctrl: true,
      handler: redo,
      description: 'Redo (alternative)',
    },
    {
      key: 'd',
      ctrl: true,
      handler: toggleDarkMode,
      description: 'Toggle dark mode',
    },
    {
      key: 'b',
      ctrl: true,
      handler: toggleCompactMode,
      description: 'Toggle compact mode',
    },
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        searchInput?.focus();
      },
      description: 'Focus search',
    },
    {
      key: 'Escape',
      handler: () => {
        setSelectedTask(null);
        setSearchQuery('');
        const activeElement = document.activeElement as HTMLElement;
        activeElement?.blur();
      },
      description: 'Close modal / Clear search',
    },
    {
      key: 'n',
      ctrl: true,
      handler: () => {
        const firstColumnAddButton = document.querySelector<HTMLButtonElement>('[data-add-task-button]');
        firstColumnAddButton?.click();
      },
      description: 'Add new task',
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const metaMatch = shortcut.meta ? event.metaKey : true;
        const shiftMatch = shortcut.shift === undefined ? true : shortcut.shift === event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
};

export const shortcutsList = [
  { keys: ['Ctrl', 'Z'], description: 'Undo' },
  { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
  { keys: ['Ctrl', 'D'], description: 'Toggle dark mode' },
  { keys: ['Ctrl', 'B'], description: 'Toggle compact mode' },
  { keys: ['Ctrl', 'K'], description: 'Focus search' },
  { keys: ['Ctrl', 'N'], description: 'Add new task' },
  { keys: ['Esc'], description: 'Close modal / Clear' },
];
