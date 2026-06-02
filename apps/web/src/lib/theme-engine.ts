/**
 * Derives a white or near-black foreground color from a hex background.
 * Uses W3C relative luminance formula.
 */
function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function foregroundFor(hex: string): string {
  return hexLuminance(hex) > 0.179 ? '#1a1a1a' : '#ffffff';
}

export interface OrgThemeConfig {
  primaryColor?: string | null;
  primaryForeground?: string | null;
  sidebarStyle?: string | null;
  bgImageUrl?: string | null;
  backgroundColor?: string | null;
  cardColor?: string | null;
}

const DEFAULT_PRIMARY = '#2563eb';

export function applyOrgTheme(config: OrgThemeConfig | null | undefined) {
  const root = document.documentElement;
  const main = document.getElementById('org-theme-main');

  if (!config) {
    clearOrgTheme();
    return;
  }

  // ── Primary color ───────────────────────────────────────────
  const primary = config.primaryColor ?? DEFAULT_PRIMARY;
  const primaryFg = config.primaryForeground ?? foregroundFor(primary);
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-foreground', primaryFg);

  // ── Background color ────────────────────────────────────────
  if (config.backgroundColor) {
    root.style.setProperty('--background', config.backgroundColor);
    root.style.setProperty('--foreground', foregroundFor(config.backgroundColor));
  } else {
    root.style.removeProperty('--background');
    root.style.removeProperty('--foreground');
  }

  // ── Card color ──────────────────────────────────────────────
  if (config.cardColor) {
    root.style.setProperty('--card', config.cardColor);
    root.style.setProperty('--card-foreground', foregroundFor(config.cardColor));
  } else {
    root.style.removeProperty('--card');
    root.style.removeProperty('--card-foreground');
  }

  // ── Sidebar preset ──────────────────────────────────────────
  const sidebar = config.sidebarStyle ?? 'light';
  root.setAttribute('data-sidebar-style', sidebar);

  if (sidebar === 'dark') {
    root.style.setProperty('--sidebar', '#1e293b');
    root.style.setProperty('--sidebar-foreground', '#f1f5f9');
    root.style.setProperty('--sidebar-primary', '#334155');
    root.style.setProperty('--sidebar-primary-foreground', '#ffffff');
    root.style.setProperty('--sidebar-accent', '#334155');
    root.style.setProperty('--sidebar-accent-foreground', '#f1f5f9');
    root.style.setProperty('--sidebar-border', 'rgba(255,255,255,0.08)');
  } else if (sidebar === 'branded') {
    root.style.setProperty('--sidebar', primary);
    root.style.setProperty('--sidebar-foreground', primaryFg);
    root.style.setProperty('--sidebar-primary', 'color-mix(in srgb, ' + primary + ' 75%, black)');
    root.style.setProperty('--sidebar-primary-foreground', primaryFg);
    root.style.setProperty('--sidebar-accent', 'color-mix(in srgb, ' + primary + ' 80%, black)');
    root.style.setProperty('--sidebar-accent-foreground', primaryFg);
    root.style.setProperty('--sidebar-border', 'rgba(255,255,255,0.15)');
  } else {
    // light (default) — remove any overrides
    root.style.removeProperty('--sidebar');
    root.style.removeProperty('--sidebar-foreground');
    root.style.removeProperty('--sidebar-primary');
    root.style.removeProperty('--sidebar-primary-foreground');
    root.style.removeProperty('--sidebar-accent');
    root.style.removeProperty('--sidebar-accent-foreground');
    root.style.removeProperty('--sidebar-border');
  }

  // ── Background image ────────────────────────────────────────
  if (main) {
    if (config.bgImageUrl) {
      main.style.backgroundImage = `url(${config.bgImageUrl})`;
      main.style.backgroundSize = 'cover';
      main.style.backgroundPosition = 'center';
      main.style.backgroundAttachment = 'fixed';
    } else {
      main.style.backgroundImage = '';
      main.style.backgroundSize = '';
      main.style.backgroundPosition = '';
      main.style.backgroundAttachment = '';
    }
  }
}

export function clearOrgTheme() {
  const root = document.documentElement;
  const main = document.getElementById('org-theme-main');

  for (const prop of [
    '--primary',
    '--primary-foreground',
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-border',
  ]) {
    root.style.removeProperty(prop);
  }

  root.removeAttribute('data-sidebar-style');

  if (main) {
    main.style.backgroundImage = '';
    main.style.backgroundSize = '';
    main.style.backgroundPosition = '';
    main.style.backgroundAttachment = '';
  }
}
