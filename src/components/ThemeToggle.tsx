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
  const lightMode = theme === 'light';

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
    <button
      type="button"
      className={`theme-toggle${lightMode ? ' is-light' : ''}`}
      data-testid="theme-toggle"
      aria-label={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-pressed={lightMode}
      title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      onClick={() => setTheme(lightMode ? 'dark' : 'light')}
    >
      <svg className="theme-icon theme-icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="theme-icon theme-icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.4 15.4A8.5 8.5 0 0 1 8.6 3.6 8.5 8.5 0 1 0 20.4 15.4Z" />
      </svg>
    </button>
  );
}
