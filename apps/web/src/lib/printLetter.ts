export function printLetter(html: string, title: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; background: #fff; }
    .page { max-width: 700px; margin: 40px auto; padding: 48px; border: 1px solid #ddd; }
    .org-header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .org-name { font-size: 20pt; font-weight: bold; letter-spacing: 1px; }
    .org-sub { font-size: 9pt; color: #555; margin-top: 4px; }
    .letter-title { text-align: center; font-size: 14pt; font-weight: bold; text-decoration: underline; margin: 24px 0; letter-spacing: 1px; }
    .date-line { text-align: right; margin-bottom: 20px; font-size: 10pt; }
    .salutation { margin-bottom: 16px; }
    .body-text { line-height: 1.9; margin-bottom: 14px; text-align: justify; }
    .highlight { font-weight: bold; }
    .table-block { margin: 16px 0; border-collapse: collapse; width: 100%; }
    .table-block td { padding: 6px 10px; border: 1px solid #999; font-size: 11pt; }
    .table-block td:first-child { font-weight: bold; width: 45%; background: #f5f5f5; }
    .sign-block { margin-top: 48px; }
    .sign-line { margin-top: 40px; border-top: 1px solid #333; width: 180px; }
    @media print { .no-print { display: none; } .page { border: none; margin: 0; padding: 32px; } }
  </style>
</head>
<body>
  <div class="no-print" style="background:#1e40af;color:#fff;padding:10px 24px;display:flex;align-items:center;gap:12px;">
    <span style="font-family:sans-serif;font-size:13px;">Preview — </span>
    <button onclick="window.print()" style="background:#fff;color:#1e40af;border:none;padding:6px 18px;font-size:13px;font-weight:bold;cursor:pointer;border-radius:4px;">Print / Save as PDF</button>
  </div>
  <div class="page">
    ${html}
  </div>
</body>
</html>`);
  win.document.close();
}
