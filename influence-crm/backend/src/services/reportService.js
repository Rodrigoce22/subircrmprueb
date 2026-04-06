const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const REPORTS_DIR = path.join(__dirname, '../../reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

const generateReportHTML = (data) => {
  const { title, subtitle, generatedBy, date, sections, stats } = data;

  const statsHTML = stats?.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('') || '';

  const sectionsHTML = sections?.map(section => `
    <div class="section">
      <h2 class="section-title">${section.title}</h2>
      ${section.table ? `
        <table>
          <thead>
            <tr>${section.table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${section.table.rows.map(row => `
              <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      ${section.text ? `<p>${section.text}</p>` : ''}
    </div>
  `).join('') || '';

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1a1a2e;
      background: #fff;
      padding: 40px;
      position: relative;
    }

    /* MARCA DE AGUA */
    body::before {
      content: 'INFLUENCE';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 110px;
      font-weight: 900;
      color: rgba(99, 102, 241, 0.07);
      letter-spacing: 20px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
    }

    .content { position: relative; z-index: 1; }

    /* HEADER */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-icon {
      width: 48px; height: 48px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 22px; font-weight: 900;
    }
    .logo-text { font-size: 28px; font-weight: 800; color: #6366f1; letter-spacing: -1px; }
    .logo-sub { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
    .header-meta { text-align: right; color: #64748b; font-size: 12px; line-height: 1.8; }

    /* TITULO */
    .report-title { font-size: 26px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
    .report-subtitle { color: #64748b; font-size: 14px; margin-bottom: 30px; }

    /* STATS */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 36px;
    }
    .stat-card {
      background: linear-gradient(135deg, #f8faff, #eef2ff);
      border: 1px solid #e0e7ff;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-value { font-size: 32px; font-weight: 800; color: #6366f1; }
    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }

    /* SECCIONES */
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 16px; font-weight: 700; color: #1e293b;
      border-left: 4px solid #6366f1;
      padding-left: 12px; margin-bottom: 16px;
    }

    /* TABLA */
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead tr { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
    th { padding: 12px 14px; text-align: left; font-weight: 600; }
    tbody tr:nth-child(even) { background: #f8faff; }
    tbody tr:hover { background: #eef2ff; }
    td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }

    /* FOOTER */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .badge {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="content">
    <div class="header">
      <div class="logo-area">
        <div class="logo-icon">I</div>
        <div>
          <div class="logo-text">influence</div>
          <div class="logo-sub">CRM & Marketing</div>
        </div>
      </div>
      <div class="header-meta">
        <div><strong>Generado por:</strong> ${generatedBy}</div>
        <div><strong>Fecha:</strong> ${date}</div>
        <div><strong>Documento:</strong> CONFIDENCIAL</div>
      </div>
    </div>

    <div class="report-title">${title}</div>
    <div class="report-subtitle">${subtitle || ''}</div>

    <div class="stats-grid">${statsHTML}</div>

    ${sectionsHTML}

    <div class="footer">
      <div>© ${new Date().getFullYear()} Influence CRM — Documento generado automaticamente</div>
      <div class="badge">INFLUENCE</div>
    </div>
  </div>
</body>
</html>`;
};

const generatePDF = async (data) => {
  const html = generateReportHTML(data);
  const filename = `report_${Date.now()}.pdf`;
  const filepath = path.join(REPORTS_DIR, filename);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: filepath,
    format: 'A4',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    printBackground: true
  });

  await browser.close();
  return { filename, filepath };
};

module.exports = { generatePDF };
