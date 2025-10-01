document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.querySelector('.theme-toggle');
  const body = document.body;
  const sunIcon = document.querySelector('.theme-icon.sun');
  const moonIcon = document.querySelector('.theme-icon.moon');

  // Applica tema da preferenza utente o sistema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const applyTheme = (mode) => {
    const isDark = mode === 'dark';
    body.classList.toggle('dark-mode', isDark);
    themeToggle.setAttribute('aria-pressed', String(isDark));
    sunIcon.style.display = isDark ? 'none' : 'inline';
    moonIcon.style.display = isDark ? 'inline' : 'none';
  };

  let savedTheme = localStorage.getItem('theme');
  applyTheme(savedTheme ?? (prefersDark.matches ? 'dark' : 'light'));

  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light');
  });

  themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
});
