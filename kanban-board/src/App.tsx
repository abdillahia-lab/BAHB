import { useEffect } from 'react';
import { Board, Header } from './components';
import { useBoardStore } from './store/boardStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const { isDarkMode } = useBoardStore();
  useKeyboardShortcuts();

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 flex flex-col">
      <Header />
      <main className="flex-1 flex overflow-hidden">
        <Board />
      </main>
    </div>
  );
}

export default App;
