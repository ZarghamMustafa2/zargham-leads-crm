const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function formatWaNumber(phone) {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('05')) {
    clean = '966' + clean.slice(1);
  } else if (clean.startsWith('5') && clean.length === 9) {
    clean = '966' + clean;
  }
  return clean;
}

function generateHtmlAndPdf() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'leads_database.json'), 'utf8'));

  let sectionsHtml = '';
  let globalLeadCounter = 0;

  data.keywords.forEach((kwGroup, kwIdx) => {
    let cardsHtml = '';

    kwGroup.leads.forEach((lead, idx) => {
      globalLeadCounter++;
      const waNumber = formatWaNumber(lead.phone);
      
      const customMessage = `Hi ${lead.name}, I'm Zargham, a website developer.

I came across your real estate company and wanted to introduce myself. I build professional websites that help real estate businesses showcase properties and make it easier for clients to enquire.

Would you be open to seeing a quick example of my work?`;

      const encodedMsg = encodeURIComponent(customMessage);
      const waUrl = `https://wa.me/${waNumber}?text=${encodedMsg}`;

      cardsHtml += `
        <tr class="lead-row" id="lead-${globalLeadCounter}">
          <td class="col-num">${idx + 1}</td>
          
          <td class="col-business">
            <div class="biz-name-ar">${lead.name}</div>
            <div class="biz-name-en">${lead.english_name || ''}</div>
            <div class="biz-addr">📍 ${lead.address}</div>
            <div class="biz-tag">${lead.license || lead.category || 'مرخص'}</div>
          </td>

          <td class="col-contact">
            <div class="phone-num">📞 ${lead.phone}</div>
            <a href="${waUrl}" target="_blank" class="wa-btn">
              <span>💬 Open in WhatsApp</span>
            </a>
            <div style="margin-top: 6px;">
              <a href="${lead.maps_url}" target="_blank" class="maps-btn">
                🗺️ Google Maps
              </a>
            </div>
          </td>

          <td class="col-msg">
            <div class="msg-box">
              <div class="msg-header">
                <strong>📝 Ready-made Outreach Message:</strong>
                <button class="copy-btn" onclick="copyText('msg-text-${globalLeadCounter}')" type="button">Copy</button>
              </div>
              <div class="msg-content" id="msg-text-${globalLeadCounter}">${customMessage.replace(/\n/g, '<br>')}</div>
            </div>
          </td>

          <td class="col-status">
            <label class="status-option">
              <input type="checkbox" class="tracker-cb" data-id="sent-${globalLeadCounter}" onchange="saveStatus(this)">
              <span class="cb-label sent-label">✅ Sent</span>
            </label>
            <label class="status-option">
              <input type="checkbox" class="tracker-cb" data-id="notsent-${globalLeadCounter}" onchange="saveStatus(this)">
              <span class="cb-label notsent-label">⏳ Not Sent</span>
            </label>
            <label class="status-option">
              <input type="checkbox" class="tracker-cb" data-id="replied-${globalLeadCounter}" onchange="saveStatus(this)">
              <span class="cb-label replied-label">💬 Replied</span>
            </label>
          </td>
        </tr>
      `;
    });

    sectionsHtml += `
      <div class="keyword-section">
        <div class="keyword-header">
          <div class="kw-title-group">
            <span class="kw-badge">Keyword #${kwIdx + 1}</span>
            <h2 class="kw-title">${kwGroup.keyword}</h2>
          </div>
          <div class="kw-meta">
            <span>📍 ${kwGroup.location}</span>
            <span class="kw-count-pill">${kwGroup.leads.length} Leads (No Website)</span>
          </div>
        </div>

        <table class="leads-table">
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 25%;">Business Details / المنشأة</th>
              <th style="width: 18%;">Contact & WhatsApp / التواصل</th>
              <th style="width: 38%;">Personalized Message / الرسالة الجاهزة</th>
              <th style="width: 15%;">Status / حالة الإرسال</th>
            </tr>
          </thead>
          <tbody>
            ${cardsHtml}
          </tbody>
        </table>
      </div>
    `;
  });

  const totalLeads = data.keywords.reduce((acc, k) => acc + k.leads.length, 0);

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Zargham - Real Estate Client Leads & 1-Click WhatsApp System</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
    
    @page {
      size: A4 landscape;
      margin: 8mm;
    }

    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', 'Cairo', Arial, sans-serif;
      margin: 0;
      padding: 15px;
      color: #1a202c;
      background-color: #f7fafc;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .dashboard-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: white;
      padding: 22px 30px;
      border-radius: 12px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .dashboard-header h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .dashboard-header p {
      margin: 0;
      color: #94a3b8;
      font-size: 13px;
    }

    .developer-badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.3);
      border: 1px solid rgba(147, 197, 253, 0.4);
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #bfdbfe;
    }

    .stats-container {
      display: flex;
      gap: 12px;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      padding: 10px 18px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .stat-card .val {
      font-size: 20px;
      font-weight: 700;
      color: #38bdf8;
    }

    .stat-card .lbl {
      font-size: 11px;
      color: #cbd5e1;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .keyword-section {
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      margin-bottom: 25px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .keyword-header {
      background: #f1f5f9;
      padding: 12px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .kw-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .kw-badge {
      background: #2563eb;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
    }

    .kw-title {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      direction: rtl;
    }

    .kw-meta {
      display: flex;
      gap: 12px;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }

    .kw-count-pill {
      background: #fee2e2;
      color: #991b1b;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
    }

    .leads-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .leads-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }

    .leads-table td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }

    .leads-table tr:hover {
      background-color: #f8fafc;
    }

    .col-num {
      font-weight: 700;
      color: #94a3b8;
      text-align: center;
    }

    .biz-name-ar {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      direction: rtl;
      margin-bottom: 2px;
    }

    .biz-name-en {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 6px;
    }

    .biz-addr {
      font-size: 11px;
      color: #475569;
      margin-bottom: 4px;
      direction: rtl;
    }

    .biz-tag {
      display: inline-block;
      font-size: 10px;
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    .phone-num {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 8px;
    }

    .wa-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      background-color: #22c55e;
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 11px;
      padding: 7px 12px;
      border-radius: 6px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: background 0.2s;
      width: 100%;
    }

    .wa-btn:hover {
      background-color: #16a34a;
    }

    .maps-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: #f1f5f9;
      color: #3b82f6;
      border: 1px solid #cbd5e1;
      text-decoration: none;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      width: 100%;
    }

    .msg-box {
      background: #fdfdfd;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #3b82f6;
      border-radius: 6px;
      padding: 8px 10px;
    }

    .msg-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 10px;
      color: #64748b;
    }

    .copy-btn {
      background: #e2e8f0;
      border: none;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
      font-weight: 600;
    }

    .copy-btn:hover {
      background: #cbd5e1;
    }

    .msg-content {
      font-size: 11px;
      line-height: 1.45;
      color: #334155;
      font-family: inherit;
      white-space: pre-line;
      background: #f8fafc;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px dashed #e2e8f0;
    }

    .status-option {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      cursor: pointer;
      user-select: none;
    }

    .tracker-cb {
      width: 15px;
      height: 15px;
      accent-color: #2563eb;
      cursor: pointer;
    }

    .cb-label {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .sent-label {
      background: #dcfce7;
      color: #166534;
    }

    .notsent-label {
      background: #fef3c7;
      color: #92400e;
    }

    .replied-label {
      background: #e0e7ff;
      color: #3730a3;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }
      .copy-btn {
        display: none;
      }
      .keyword-section {
        box-shadow: none;
        border: 1px solid #ccc;
        page-break-inside: avoid;
        margin-bottom: 15px;
      }
      .leads-table th, .leads-table td {
        padding: 6px 8px;
      }
      .wa-btn {
        border: 1px solid #16a34a;
        color: #166534 !important;
        background: #f0fdf4 !important;
      }
    }
  </style>
</head>
<body>

  <div class="dashboard-header">
    <div>
      <div style="margin-bottom: 6px;">
        <span class="developer-badge">Zargham | Web Development Outreach Lead Gen</span>
      </div>
      <h1>Real Estate Business Leads & WhatsApp Outreach Kit</h1>
      <p>Target Market: Saudi Arabia (Google Business Verified - Zero Website Presence)</p>
    </div>

    <div class="stats-container">
      <div class="stat-card">
        <div class="val">${data.keywords.length}</div>
        <div class="lbl">Cities / Keywords</div>
      </div>
      <div class="stat-card">
        <div class="val">${totalLeads}</div>
        <div class="lbl">Total Leads</div>
      </div>
      <div class="stat-card">
        <div class="val">100%</div>
        <div class="lbl">No Website</div>
      </div>
    </div>
  </div>

  ${sectionsHtml}

  <script>
    function copyText(elemId) {
      const el = document.getElementById(elemId);
      if (el) {
        navigator.clipboard.writeText(el.innerText).then(() => {
          alert('Copied message to clipboard!');
        });
      }
    }

    function saveStatus(checkbox) {
      const key = 'lead_tracker_' + checkbox.getAttribute('data-id');
      localStorage.setItem(key, checkbox.checked ? '1' : '0');
    }

    window.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.tracker-cb').forEach(cb => {
        const key = 'lead_tracker_' + cb.getAttribute('data-id');
        if (localStorage.getItem(key) === '1') {
          cb.checked = true;
        }
      });
    });
  </script>
</body>
</html>`;

  const htmlPath = path.join(__dirname, 'leads_report.html');
  fs.writeFileSync(htmlPath, fullHtml, 'utf8');
  console.log('HTML report generated at:', htmlPath);

  // Try generating PDF using Chrome or Edge
  const pdfPath = path.join(__dirname, 'leads_report.pdf');
  const browserPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  let browserPath = browserPaths.find(p => fs.existsSync(p));

  if (browserPath) {
    try {
      const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
      console.log('Running print command...');
      execSync(cmd, { stdio: 'inherit' });
      console.log('PDF generated successfully at:', pdfPath);
    } catch (e) {
      console.error('Error generating PDF:', e);
    }
  } else {
    console.log('No Chrome or Edge found to print PDF.');
  }
}

generateHtmlAndPdf();
