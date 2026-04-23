const fs = require('fs');
const path = require('path');

const defiThemePath = path.join(__dirname, 'src', 'styles', 'defi-theme.css');
let themeCss = fs.readFileSync(defiThemePath, 'utf8');

// Replace fonts
themeCss = themeCss.replace(
  /@import url\([^)]+\);/,
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');"
);

// Replace root variables
const newRoot = `:root {
  /* ─── Colors: Refined Minimalism (Option A) ─── */
  --defi-bg: #0F0C0A;
  --defi-surface: #1A1715;
  --defi-card: #1A1715;
  --defi-fg: #F5F1EB;
  --defi-muted: #8A837D;
  --defi-border: rgba(245, 241, 235, 0.08);
  --defi-border-hover: rgba(245, 241, 235, 0.15);

  --defi-orange-primary: #D4741A;
  --defi-orange-dark: #B56012;
  --defi-gold: #C4915C;
  --defi-accent-2: #6B8E7A;

  --font-heading: 'Inter', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4rem;

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
  
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
}`;
themeCss = themeCss.replace(/:root\s*{[^}]+}/, newRoot);

// Replace light mode overrides
const newLightMode = `[data-theme="light"] {
  --defi-bg: #FAF9F7;
  --defi-surface: #FFFFFF;
  --defi-card: #FFFFFF;
  --defi-fg: #0F0C0A;
  --defi-muted: #8A837D;
  --defi-border: rgba(15, 12, 10, 0.08);
  --defi-border-hover: rgba(15, 12, 10, 0.15);
}`;
themeCss = themeCss.replace(/\[data-theme="light"\]\s*{[^}]+}/, newLightMode);

// Remove grid pattern background
themeCss = themeCss.replace(/body::before\s*{[^}]+}/g, "body::before { display: none !important; }");
themeCss = themeCss.replace(/\[data-theme="light"\] body::before\s*{[^}]+}/g, "");

// Replace buttons
themeCss = themeCss.replace(/\.btn-primary\s*{[^}]+}/, `.btn-primary {
  background: var(--defi-orange-primary);
  color: #0F0C0A;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: none;
}`);
themeCss = themeCss.replace(/\.btn-primary:hover:not\(:disabled\)\s*{[^}]+}/, `.btn-primary:hover:not(:disabled) {
  background: var(--defi-orange-dark);
  transform: none;
  box-shadow: var(--shadow-sm);
}`);

// Remove glow pulse animations and other dramatic shadows
themeCss = themeCss.replace(/box-shadow:[^;]+;/g, (match) => {
  if (match.includes('rgba(247, 147, 26') || match.includes('rgba(234, 88, 12')) {
    return 'box-shadow: none;';
  }
  return match;
});

// Update borders and shadows on cards
themeCss = themeCss.replace(/\.card:hover\s*{[^}]+}/, `.card:hover {
  transform: none;
  border-color: var(--defi-border-hover);
  box-shadow: var(--shadow-sm);
}`);

fs.writeFileSync(defiThemePath, themeCss);
console.log('Updated defi-theme.css');
