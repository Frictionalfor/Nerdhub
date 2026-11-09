import { useTheme } from '../lib/theme';
import { Button } from './Button.js';

/**
 * Theme toggle that switches between dark and light theme.
 * Keyboard accessible and announces the current theme to assistive tech.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-pressed={theme === 'light'}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </Button>
  );
}
