const THEMES = ['pride', 'light', 'dark'];
const DEFAULT_THEME = 'pride';

const THEME_COLORS = {
  light: '#ffffff',
  dark: '#0d1117',
  pride: '#732982',
};

function switchTheme() {
  const current = currentTheme();
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx + 1) % THEMES.length];
  setTheme(next);
  setIconTheme(next);
  updateThemeMeta(next);
}

function setTheme(style) {
  document.querySelectorAll('.isInitialToggle').forEach(elem => {
    elem.classList.remove('isInitialToggle');
  });
  document.documentElement.setAttribute('data-color-mode', style);
  localStorage.setItem('data-color-mode', style);
}

function setIconTheme(theme) {
  const twitterIconElement = document.getElementById('twitter-icon');
  const githubIconElement = document.getElementById('github-icon');

  if (twitterIconElement) {
    if (theme === 'light') {
      twitterIconElement.setAttribute('fill', 'black');
    } else {
      twitterIconElement.setAttribute('fill', 'white');
    }
  }

  if (githubIconElement) {
    if (theme === 'light') {
      githubIconElement.removeAttribute('color');
      githubIconElement.removeAttribute('class');
      githubIconElement.setAttribute('fill', '#24292e');
    } else {
      githubIconElement.removeAttribute('fill');
      githubIconElement.setAttribute('class', 'octicon');
      githubIconElement.setAttribute('color', '#f0f6fc');
    }
  }
}

function updateThemeMeta(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[theme] || THEME_COLORS.pride);
  }
}

function currentTheme() {
  const localStyle = localStorage.getItem('data-color-mode');
  if (localStyle && THEMES.includes(localStyle)) {
    return localStyle;
  }
  return DEFAULT_THEME;
}

(() => {
  const theme = currentTheme();
  setTheme(theme);
  setIconTheme(theme);
  updateThemeMeta(theme);
})();
