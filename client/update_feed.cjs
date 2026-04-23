const fs = require('fs');
const path = require('path');

const feedCssPath = path.join(__dirname, 'src', 'pages', 'Feed.css');
let css = fs.readFileSync(feedCssPath, 'utf8');

// Replace linear gradients with solid colors
css = css.replace(/background:\s*linear-gradient\([^)]+\)/g, 'background: var(--defi-orange-primary)');
css = css.replace(/background-image:\s*linear-gradient\([^)]+\)/g, 'background-image: none');
css = css.replace(/linear-gradient\([^)]+\)/g, 'var(--defi-orange-primary)');

// Remove -webkit-background-clip: text (gradient text)
css = css.replace(/-webkit-background-clip:\s*text;/g, '');
css = css.replace(/-webkit-text-fill-color:\s*transparent;/g, '');
css = css.replace(/background-clip:\s*text;/g, '');

// Update box shadows to be subtle
css = css.replace(/box-shadow:\s*0\s+4px\s+12px\s+rgba\(0,\s*0,\s*0,\s*0\.15\)/g, 'box-shadow: var(--shadow-sm)');
css = css.replace(/box-shadow:\s*0\s+0\s+12px\s+rgba\([^)]+\)/g, 'box-shadow: none');
css = css.replace(/box-shadow:\s*0\s+0\s+8px\s+rgba\([^)]+\)/g, 'box-shadow: none');
css = css.replace(/box-shadow:\s*0\s+0\s+20px\s+[^;]+;/g, 'box-shadow: none;');

// Ensure flat look
css = css.replace(/border:\s*1px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'border: 1px solid var(--defi-border)');
css = css.replace(/border-color:\s*rgba\(247,\s*147,\s*26,\s*0\.3\)/g, 'border-color: var(--defi-border-hover)');

fs.writeFileSync(feedCssPath, css);
console.log('Updated Feed.css');
