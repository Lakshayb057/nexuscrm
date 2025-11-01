import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  :root {
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    /* Theme variables */
    --primary: ${({ theme }) => theme.colors.primary};
    --text: ${({ theme }) => theme.colors.text};
    --muted: ${({ theme }) => theme.colors.muted};
    --app-bg: ${({ theme }) => theme.colors.appBg};
    --card-bg: ${({ theme }) => theme.colors.cardBg};
    --border: ${({ theme }) => theme.colors.border};
    --sidebar-bg: ${({ theme }) => theme.colors.sidebarBg};
    /* Breakpoints */
    --bp-xs: 480px;
    --bp-sm: 640px;
    --bp-md: 768px;
    --bp-lg: 1024px;
    --bp-xl: 1280px;
    /* Compat for Reports CSS */
    --light: ${({ theme }) => theme.colors.cardBg};
    --dark: ${({ theme }) => theme.colors.text};
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: ${({ theme }) => theme.colors.appBg}; color: ${({ theme }) => theme.colors.text}; }
  a { color: inherit; text-decoration: none; }
  .btn { padding: 8px 12px; border-radius: 8px; border: 1px solid ${({ theme }) => theme.colors.border}; background: ${({ theme }) => theme.colors.cardBg}; color: ${({ theme }) => theme.colors.text}; cursor: pointer; }
  .btn-primary { background: ${({ theme }) => theme.colors.primary}; color: #fff; border-color: ${({ theme }) => theme.colors.primary}; }
  .btn-primary:hover { filter: brightness(0.95); }
  .btn-ghost { background: var(--card-bg); color: var(--text); border-color: var(--border); }
  .btn-ghost:hover { background: ${({ theme }) => theme.colors.primary + '10'}; }
  .btn-danger { background: ${({ theme }) => theme.colors.danger}; color: #fff; border-color: ${({ theme }) => theme.colors.danger}; }
  .btn-danger:hover { filter: brightness(0.95); }
  .card { background: ${({ theme }) => theme.colors.cardBg}; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 12px; }
  .card-header { padding: 12px 16px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; background: ${({ theme }) => theme.colors.appBg}; }
  .card-title { font-weight: 600; }
  .card-body { padding: 16px; }
  table { border-collapse: collapse; }
  th, td { padding: 10px 8px; border-bottom: 1px solid ${({ theme }) => theme.colors.border}; text-align: left; }
  thead th { background: ${({ theme }) => theme.colors.appBg}; color: ${({ theme }) => theme.colors.muted}; }
  .data-table thead th { background: ${({ theme }) => theme.colors.appBg}; color: ${({ theme }) => theme.colors.muted}; }
  .badge-success { background: #16a34a22; color: #16a34a; padding: 4px 8px; border-radius: 999px; }
  .badge-warning { background: #d9770622; color: #b45309; padding: 4px 8px; border-radius: 999px; }

  /* Smooth theme transitions */
  body, .card, .card-header, .card-body, .btn, .btn-primary, table, th, td, input, select, textarea {
    transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
  }

  /* Themed scrollbars */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.colors.border} ${({ theme }) => theme.colors.appBg};
  }
  *::-webkit-scrollbar { width: 10px; height: 10px; }
  *::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.colors.border}; border-radius: 8px; }
  *::-webkit-scrollbar-track { background: ${({ theme }) => theme.colors.appBg}; }

  /* Table zebra and hover */
  table.zebra tbody tr:nth-child(odd) { background: ${({ theme }) => theme.colors.appBg}; }
  table.hover tbody tr:hover { background: ${({ theme }) => theme.colors.primary + '10'}; }

  /* Override some hard-coded styles in Reports CSS to respect theme */
  #reports-view .card { background: var(--card-bg); }
  #reports-view .card-header { background: ${({ theme }) => theme.colors.appBg}; border-bottom-color: var(--border); }
  #reports-view .card-title { color: var(--text); }
  #reports-view .filter-item { background: var(--card-bg); border-color: var(--border); color: var(--text); }
  #reports-view .report-fields { background: var(--card-bg); }
  #reports-view .report-fields h4 { color: var(--text); background: ${({ theme }) => theme.colors.appBg}; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; }
  #reports-view .report-canvas { background: var(--card-bg); }
  #reports-view .report-component { background: ${({ theme }) => theme.colors.appBg}; border-color: var(--border); }
  #reports-view .component-action { background: var(--card-bg); border-color: var(--border); color: var(--text); }
  #reports-view .field-item { background: ${({ theme }) => theme.colors.appBg}; border: 1px solid var(--border); color: var(--text); }
  #reports-view .field-item:hover { background: ${({ theme }) => theme.colors.primary + '10'}; }
  #reports-view .table th { background: ${({ theme }) => theme.colors.appBg}; color: var(--muted); }
  #reports-view .modal-content { background: var(--card-bg); }
  #reports-view .modal-header, #reports-view .modal-footer { background: ${({ theme }) => theme.colors.appBg}; border-color: var(--border); }
  #reports-view .form-group label { color: var(--muted); }
  #reports-view .form-control, #reports-view .form-group select, #reports-view .form-group input, #reports-view .form-group textarea {
    background: ${({ theme }) => theme.colors.appBg}; border-color: var(--border); color: var(--text);
  }

  /* Layout primitives */
  .container {
    width: 100%;
    margin-left: auto;
    margin-right: auto;
    padding-left: 16px;
    padding-right: 16px;
  }
  @media (min-width: 640px) { .container { max-width: 640px; } }
  @media (min-width: 768px) { .container { max-width: 768px; } }
  @media (min-width: 1024px) { .container { max-width: 1024px; } }
  @media (min-width: 1280px) { .container { max-width: 1280px; } }

  /* Table responsiveness helper */
  .table-responsive {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Compact tables */
  .table-sm th, .table-sm td { padding: 6px 8px; font-size: 13px; }
  /* Sticky table header */
  .table-sticky thead th { position: sticky; top: 0; z-index: 1; }

  /* Visibility utilities */
  .hide-xs { display: none; }
  @media (min-width: 480px) { .hide-xs { display: table-cell; } }
  .hide-sm { display: none; }
  @media (min-width: 640px) { .hide-sm { display: table-cell; } }
`;
