import { useLayoutEffect, useState } from 'react';

type Theme = 'dark' | 'light';

function savedTheme(): Theme {
  try {
    return localStorage.getItem('clankers-theme') === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(savedTheme);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'light' ? '#f5f6ef' : '#111411');
    try {
      localStorage.setItem('clankers-theme', theme);
    } catch {
      // Theme switching still works when browser storage is unavailable.
    }
  }, [theme]);

  return (
    <div className="theme-toolbar">
      <button
        type="button"
        className="theme-toggle"
        aria-pressed={theme === 'light'}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        Light mode
        <span aria-hidden="true">{theme === 'light' ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}
