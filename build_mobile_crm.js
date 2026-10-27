const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function formatWaNumber(phone) {
  let clean = (phone || '').replace(/\D/g, '');
  if (clean.startsWith('05')) {
    clean = '966' + clean.slice(1);
  } else if (clean.startsWith('5') && clean.length === 9) {
    clean = '966' + clean;
  }
  return clean;
}

const db = JSON.parse(fs.readFileSync(path.join(__dirname, 'leads_database.json'), 'utf8'));

// Flatten all leads
let allLeads = [];
let idCounter = 1;

db.keywords.forEach((kwGroup) => {
  kwGroup.leads.forEach((lead) => {
    const leadId = lead.id || idCounter++;
    allLeads.push({
      id: leadId,
      name: lead.name,
      english_name: lead.english_name || '',
      phone: lead.phone,
      wa_phone: formatWaNumber(lead.phone),
      address: lead.address,
      city: lead.city || kwGroup.location.split('-')[0].trim(),
      category: kwGroup.keyword,
      license: lead.license || lead.category || 'مرخص',
      maps_url: lead.maps_url,
      status: lead.status || 'unsent',
      created_at: Date.now() - (1000 - leadId) * 60000
    });
  });
});

const leadsJsonString = JSON.stringify(allLeads);

const htmlTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl" id="html-root">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Zargham CRM - Saudi Real Estate Outreach</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --whatsapp: #22c55e;
      --whatsapp-dark: #16a34a;
      --bg: #f1f5f9;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --border-dark: #cbd5e1;
      --sent-bg: #ecfdf5;
      --sent-border: #10b981;
      --unsent-border: #f59e0b;
      --replied-border: #6366f1;
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      padding: 0 0 85px 0;
      -webkit-font-smoothing: antialiased;
    }

    html[dir="ltr"] body {
      font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Fixed Top App Bar */
    .app-header {
      background: linear-gradient(135deg, #090d16 0%, #172554 100%);
      color: white;
      padding: 10px 14px 8px 14px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.18);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .brand-icon {
      font-size: 18px;
      line-height: 1;
    }

    .brand-title {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .brand-badge {
      background: rgba(59, 130, 246, 0.35);
      color: #93c5fd;
      font-size: 9.5px;
      padding: 2px 6px;
      border-radius: 6px;
      font-weight: 700;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    /* Compact Language Switcher */
    .lang-toggle {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 18px;
      padding: 2px;
    }

    .lang-opt {
      background: transparent;
      border: none;
      color: #cbd5e1;
      padding: 3px 8px;
      border-radius: 14px;
      font-size: 10.5px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }

    .lang-opt.active {
      background: white;
      color: #0f172a;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    }

    .btn-add-mini {
      background: #2563eb;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 11.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 2px 5px rgba(37, 99, 235, 0.35);
      white-space: nowrap;
    }

    .btn-add-mini:active {
      transform: scale(0.96);
    }

    /* Streamlined Interactive Stat Chips */
    .stat-chips-row {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 2px;
      margin-bottom: 6px;
    }

    .stat-chips-row::-webkit-scrollbar {
      display: none;
    }

    .stat-chip {
      flex: 1;
      min-width: 74px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 5px 4px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }

    .stat-chip:active {
      transform: scale(0.97);
    }

    .stat-chip.active {
      background: rgba(255, 255, 255, 0.22);
      border-color: #60a5fa;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }

    .stat-chip .val {
      font-size: 16px;
      font-weight: 800;
      line-height: 1.1;
      font-family: 'Inter', sans-serif;
    }

    .stat-chip .lbl {
      font-size: 9px;
      color: #94a3b8;
      font-weight: 700;
      white-space: nowrap;
      margin-top: 2px;
    }

    .chip-unsent .val { color: #fde047; }
    .chip-sent .val { color: #4ade80; }
    .chip-replied .val { color: #a5b4fc; }
    .chip-all .val { color: #ffffff; }

    /* Micro Progress Bar */
    .progress-track {
      background: rgba(255, 255, 255, 0.12);
      border-radius: 3px;
      height: 3px;
      overflow: hidden;
    }

    .progress-fill {
      background: linear-gradient(90deg, #fde047 0%, #4ade80 100%);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
    }

    /* Compact Sticky Controls Bar */
    .controls-bar {
      background: white;
      padding: 8px 12px;
      position: sticky;
      top: 96px;
      z-index: 90;
      border-bottom: 1px solid var(--border);
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .search-input-wrap {
      position: relative;
      flex: 1;
    }

    .search-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      font-family: inherit;
      background: #f8fafc;
      transition: all 0.15s;
    }

    html[dir="rtl"] .search-input { padding-left: 28px; }
    html[dir="ltr"] .search-input { padding-right: 28px; }

    .search-input:focus {
      border-color: var(--primary);
      background: white;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
    }

    .btn-clear-search {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: #e2e8f0;
      border: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      font-size: 10px;
      color: #64748b;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    html[dir="rtl"] .btn-clear-search { left: 7px; }
    html[dir="ltr"] .btn-clear-search { right: 7px; }

    .city-select {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 6px;
      font-size: 12px;
      font-weight: 700;
      color: #334155;
      font-family: inherit;
      outline: none;
      max-width: 120px;
      cursor: pointer;
    }

    /* Leads Feed */
    .leads-container {
      padding: 10px 10px 30px 10px;
      max-width: 580px;
      margin: 0 auto;
    }

    /* Compact, High-Density Lead Card */
    .lead-card {
      background: var(--card-bg);
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 10px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
      position: relative;
      transition: all 0.2s ease;
    }

    .lead-card.status-sent {
      border-left: 4px solid var(--sent-border);
      background: #fafdfb;
    }

    html[dir="rtl"] .lead-card.status-sent {
      border-left: 1px solid var(--border);
      border-right: 4px solid var(--sent-border);
    }

    .lead-card.status-unsent {
      border-left: 4px solid var(--unsent-border);
    }

    html[dir="rtl"] .lead-card.status-unsent {
      border-left: 1px solid var(--border);
      border-right: 4px solid var(--unsent-border);
    }

    .lead-card.status-replied {
      border-left: 4px solid var(--replied-border);
      background: #fafaff;
    }

    html[dir="rtl"] .lead-card.status-replied {
      border-left: 1px solid var(--border);
      border-right: 4px solid var(--replied-border);
    }

    /* Card Top Header */
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
      margin-bottom: 4px;
    }

    .head-main {
      min-width: 0;
      flex: 1;
    }

    .biz-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 2px;
    }

    .biz-name-sub {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rank-pill {
      font-size: 11px;
      font-weight: 800;
      color: #94a3b8;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 6px;
      flex-shrink: 0;
      font-family: 'Inter', sans-serif;
    }

    /* Metadata Chips */
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px;
      margin-bottom: 8px;
    }

    .badge-chip {
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 5px;
    }

    .chip-city { background: #e0f2fe; color: #0284c7; }
    .chip-lic { background: #f1f5f9; color: #475569; }
    .chip-new { background: #fef08a; color: #854d0e; }

    .address-text {
      font-size: 11px;
      color: #64748b;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 3px;
      line-height: 1.3;
    }

    /* Main Fast Action Bar (Thumb Zone) */
    .fast-action-bar {
      display: grid;
      grid-template-columns: 1fr auto auto auto;
      gap: 6px;
      margin-bottom: 8px;
      align-items: center;
    }

    .btn-wa-main {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 800;
      padding: 10px 12px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      box-shadow: 0 2px 5px rgba(34, 197, 94, 0.3);
      white-space: nowrap;
    }

    .btn-wa-main:active {
      transform: scale(0.97);
      filter: brightness(0.95);
    }

    .btn-icon-action {
      background: #f8fafc;
      border: 1px solid var(--border);
      color: #334155;
      text-decoration: none;
      width: 38px;
      height: 38px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-icon-action:active {
      background: #e2e8f0;
      transform: scale(0.94);
    }

    .btn-drawer-toggle {
      background: #f1f5f9;
      border: 1px solid var(--border);
      color: #2563eb;
      width: 38px;
      height: 38px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-drawer-toggle.expanded {
      background: #2563eb;
      color: white;
      border-color: #2563eb;
    }

    /* Collapsible Pitch Drawer (Saves 60% Screen Space!) */
    .pitch-drawer {
      display: none;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 10px;
      margin-bottom: 8px;
      animation: fadeIn 0.15s ease-out;
    }

    .pitch-drawer.open {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .pitch-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      gap: 6px;
    }

    .pitch-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
    }

    .pitch-switch {
      display: inline-flex;
      background: #e2e8f0;
      border-radius: 12px;
      padding: 2px;
      gap: 2px;
    }

    .pitch-switch-btn {
      border: none;
      background: transparent;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 10px;
      cursor: pointer;
      color: #64748b;
      font-family: inherit;
    }

    .pitch-switch-btn.active {
      background: #2563eb;
      color: white;
    }

    .btn-copy-mini {
      background: #e2e8f0;
      border: none;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      color: #334155;
    }

    .pitch-text-box {
      font-size: 11.5px;
      line-height: 1.5;
      color: #334155;
      white-space: pre-line;
      background: white;
      padding: 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .pitch-text-box.lang-ar {
      direction: rtl;
      text-align: right;
      font-family: 'Cairo', sans-serif;
    }

    .pitch-text-box.lang-en {
      direction: ltr;
      text-align: left;
      font-family: 'Inter', sans-serif;
    }

    /* Fast Status Selector */
    .status-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 8px;
    }

    .status-btn {
      border: none;
      background: transparent;
      padding: 6px 2px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      color: #64748b;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .status-btn.active-unsent {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }

    .status-btn.active-sent {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #10b981;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }

    .status-btn.active-replied {
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #6366f1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }

    .status-indicator-badge {
      font-size: 10.5px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .status-indicator-badge.badge-sent {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .status-indicator-badge.badge-unsent {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }
    .status-indicator-badge.badge-replied {
      background: #e0e7ff;
      color: #4338ca;
      border: 1px solid #c7d2fe;
    }

    /* Floating Back to Top Button */
    .btn-fab-top {
      position: fixed;
      bottom: 20px;
      right: 18px;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #0f172a;
      color: white;
      border: none;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      cursor: pointer;
      z-index: 150;
      transition: transform 0.15s;
    }

    .btn-fab-top:active {
      transform: scale(0.92);
    }

    /* Modal Form */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: none;
      align-items: flex-end;
      justify-content: center;
    }

    .modal-card {
      background: white;
      width: 100%;
      max-width: 500px;
      border-radius: 20px 20px 0 0;
      padding: 20px 18px 28px 18px;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.25);
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .modal-head h3 {
      font-size: 16px;
      font-weight: 800;
    }

    .modal-close-btn {
      background: #f1f5f9;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      font-weight: 700;
    }

    .form-group {
      margin-bottom: 12px;
    }

    .form-group label {
      display: block;
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 4px;
    }

    .form-ctrl {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
    }

    .form-ctrl:focus {
      border-color: var(--primary);
    }

    .btn-submit-lead {
      width: 100%;
      background: #2563eb;
      color: white;
      border: none;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      margin-top: 6px;
      font-family: inherit;
    }

    /* Toast */
    .toast-pill {
      position: fixed;
      bottom: 22px;
      left: 50%;
      transform: translateX(-50%) translateY(120px);
      background: #090d16;
      color: white;
      padding: 9px 18px;
      border-radius: 22px;
      font-size: 12.5px;
      font-weight: 700;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      z-index: 300;
      opacity: 0;
      transition: all 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
      white-space: nowrap;
    }

    .toast-pill.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .empty-state {
      text-align: center;
      padding: 40px 14px;
      color: var(--text-muted);
    }

    @media print {
      .app-header, .controls-bar, .fast-action-bar, .status-bar, .modal-overlay, .btn-fab-top {
        display: none !important;
      }
      body { padding: 0 !important; background: white !important; }
      .lead-card { break-inside: avoid; border: 1px solid #ccc; box-shadow: none; margin-bottom: 16px; }
      .pitch-drawer { display: block !important; }
    }
  </style>
</head>
<body>

  <!-- Sticky Compact Top Bar -->
  <header class="app-header">
    <div class="header-top">
      <div class="brand-group">
        <span class="brand-icon">⚡</span>
        <span class="brand-title" id="ui-brand">Zargham CRM</span>
        <span class="brand-badge" id="ui-brand-tag">Outreach</span>
      </div>
      <div class="header-controls">
        <div class="lang-toggle">
          <button type="button" class="lang-opt active" id="lang-btn-ar" onclick="setLanguage('ar')">🇸🇦 ع</button>
          <button type="button" class="lang-opt" id="lang-btn-en" onclick="setLanguage('en')">🇬🇧 EN</button>
        </div>
        <button class="btn-add-mini" onclick="openAddModal()">
          <span id="ui-add-lead">➕ إضافة</span>
        </button>
      </div>
    </div>

    <!-- 1-Row Fast Metric & Filter Chips -->
    <div class="stat-chips-row">
      <div class="stat-chip chip-unsent active" id="card-unsent" onclick="setFilter('unsent')">
        <div class="val" id="stat-unsent">0</div>
        <div class="lbl" id="lbl-unsent">⚡ للمراسلة</div>
      </div>
      <div class="stat-chip chip-sent" id="card-sent" onclick="setFilter('sent')">
        <div class="val" id="stat-sent">0</div>
        <div class="lbl" id="lbl-sent">✅ تم الإرسال</div>
      </div>
      <div class="stat-chip chip-replied" id="card-replied" onclick="setFilter('replied')">
        <div class="val" id="stat-replied">0</div>
        <div class="lbl" id="lbl-replied">💬 تم الرد</div>
      </div>
      <div class="stat-chip chip-all" id="card-all" onclick="setFilter('all')">
        <div class="val" id="stat-total">0</div>
        <div class="lbl" id="lbl-total">📋 الكل</div>
      </div>
    </div>

    <!-- Progress Tracker -->
    <div class="progress-track">
      <div class="progress-fill" id="progress-bar"></div>
    </div>
  </header>

  <!-- Slim Search & City Filter Bar -->
  <section class="controls-bar">
    <div class="search-input-wrap">
      <input type="text" class="search-input" id="search-input" placeholder="🔍 بحث بالاسم أو الهاتف..." oninput="handleSearch()">
      <button type="button" class="btn-clear-search" id="btn-clear-search" onclick="clearSearch()">✕</button>
    </div>
    <select id="city-filter" class="city-select" onchange="handleCityFilter(this.value)">
      <option value="all">📍 جميع المدن</option>
      <option value="الرياض">الرياض</option>
      <option value="جدة">جدة</option>
      <option value="الدمام">الدمام</option>
      <option value="الخبر">الخبر</option>
      <option value="الطائف">الطائف</option>
      <option value="مكة المكرمة">مكة المكرمة</option>
      <option value="أبها">أبها</option>
    </select>
  </section>

  <!-- Leads Feed -->
  <main class="leads-container" id="leads-list">
    <!-- Rendered dynamically -->
  </main>

  <!-- Floating Scroll To Top -->
  <button type="button" class="btn-fab-top" id="btn-fab-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">⬆️</button>

  <!-- Add New Lead Modal -->
  <div class="modal-overlay" id="add-modal" onclick="closeAddModal(event)">
    <div class="modal-card" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3 id="ui-modal-title">إضافة ليد جديدة (New Lead)</h3>
        <button class="modal-close-btn" onclick="closeAddModal()">&times;</button>
      </div>

      <form id="add-lead-form" onsubmit="handleFormSubmit(event)">
        <div class="form-group">
          <label id="ui-lbl-modal-name">اسم المنشأة العقارية *</label>
          <input type="text" class="form-ctrl" id="new-name" placeholder="مثال: مكتب قمة الرياض للعقارات" required>
        </div>

        <div class="form-group">
          <label id="ui-lbl-modal-phone">رقم الجوال *</label>
          <input type="tel" class="form-ctrl" id="new-phone" placeholder="05XXXXXXXX" required>
        </div>

        <div class="form-group">
          <label id="ui-lbl-modal-city">المدينة</label>
          <select class="form-ctrl" id="new-city">
            <option value="الرياض">الرياض</option>
            <option value="جدة">جدة</option>
            <option value="الدمام">الدمام</option>
            <option value="الخبر">الخبر</option>
            <option value="الطائف">الطائف</option>
            <option value="مكة المكرمة">مكة المكرمة</option>
            <option value="المدينة المنورة">المدينة المنورة</option>
            <option value="أبها">أبها</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div class="form-group">
          <label id="ui-lbl-modal-address">الحي / العنوان (اختياري)</label>
          <input type="text" class="form-ctrl" id="new-address" placeholder="مثال: حي الياسمين">
        </div>

        <button type="submit" class="btn-submit-lead" id="ui-btn-submit">💾 حفظ وإضافة للأعلى</button>
      </form>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast-pill" id="toast">تم بنجاح!</div>

  <script>
    const initialLeads = LEADS_PLACEHOLDER;

    function formatWaNumber(phone) {
      let clean = (phone || '').replace(/\D/g, '');
      if (clean.startsWith('05')) {
        clean = '966' + clean.slice(1);
      } else if (clean.startsWith('5') && clean.length === 9) {
        clean = '966' + clean;
      }
      return clean;
    }

    const STORAGE_KEY = 'zargham_leads_v5';
    const LANG_STORAGE_KEY = 'zargham_crm_lang';

    let leadsData = [];
    let currentFilter = 'all'; // Default to All leads (Unsent on top, Sent moved to bottom)
    let searchQuery = '';
    let selectedCity = 'all';
    let currentLang = 'ar';
    let leadMsgLangs = {};
    let openDrawers = new Set();

    const i18n = {
      ar: {
        brand: "ضرغام CRM",
        brandTag: "Outreach",
        addLead: "➕ إضافة",
        unsentLeads: "⚡ للمراسلة",
        sentLeads: "✅ تم الإرسال",
        repliedLeads: "💬 تم الرد",
        totalLeads: "📋 الكل",
        searchPlaceholder: "🔍 بحث بالاسم أو الهاتف...",
        allCities: "📍 جميع المدن",
        cities: {
          "الرياض": "الرياض",
          "جدة": "جدة",
          "الدمام": "الدمام",
          "الخبر": "الخبر",
          "الطائف": "الطائف",
          "مكة المكرمة": "مكة المكرمة",
          "أبها": "أبها",
          "المدينة المنورة": "المدينة المنورة",
          "أخرى": "أخرى"
        },
        sendWa: "💬 واتساب ومارك تم الإرسال",
        markSent: "✅ تم الإرسال",
        markUnsent: "⏳ لم يُرسل",
        pitchMsgHeader: "📝 نص الرسالة المجهّزة:",
        copy: "نسخ",
        copied: "تم النسخ بنجاح!",
        statusUnsent: "⏳ لم يُرسل",
        statusSent: "✅ تم الإرسال",
        statusReplied: "💬 تم الرد",
        toastSent: "✅ تم الإرسال ونقل الرقم للأسفل!",
        toastReplied: "💬 تم التحديد: تم الرد",
        toastUnsent: "⏳ تم التحديد: لم يُرسل",
        modalTitle: "إضافة ليد جديدة (New Lead)",
        modalName: "اسم المنشأة العقارية *",
        modalPhone: "رقم الجوال *",
        modalCity: "المدينة",
        modalAddress: "الحي / العنوان (اختياري)",
        modalSubmit: "💾 حفظ وإضافة للأعلى",
        tagLicensed: "مرخص",
        tagNew: "⭐ جديد",
        emptyTitle: "لا توجد نتائج مطابقة",
        emptySubtitle: "جرّب تغيير خيارات البحث أو الفلتر."
      },
      en: {
        brand: "Zargham CRM",
        brandTag: "Outreach",
        addLead: "➕ Add",
        unsentLeads: "⚡ To-Do",
        sentLeads: "✅ Sent",
        repliedLeads: "💬 Replied",
        totalLeads: "📋 All",
        searchPlaceholder: "🔍 Search name or phone...",
        allCities: "📍 All Cities",
        cities: {
          "الرياض": "Riyadh",
          "جدة": "Jeddah",
          "الدمام": "Dammam",
          "الخبر": "Al Khobar",
          "الطائف": "Taif",
          "مكة المكرمة": "Makkah",
          "أبها": "Abha",
          "المدينة المنورة": "Madinah",
          "أخرى": "Other"
        },
        sendWa: "💬 WhatsApp & Move Down",
        markSent: "✅ Sent",
        markUnsent: "⏳ Unsent",
        pitchMsgHeader: "📝 Outreach Pitch Message:",
        copy: "Copy",
        copied: "Copied successfully!",
        statusUnsent: "⏳ Unsent",
        statusSent: "✅ Sent",
        statusReplied: "💬 Replied",
        toastSent: "✅ Sent marked & moved to bottom!",
        toastReplied: "💬 Marked: Replied",
        toastUnsent: "⏳ Marked: Unsent",
        modalTitle: "Add New Lead",
        modalName: "Business / Office Name *",
        modalPhone: "Mobile / Phone Number *",
        modalCity: "City",
        modalAddress: "Neighborhood / Address (Optional)",
        modalSubmit: "💾 Save to Top",
        tagLicensed: "Licensed",
        tagNew: "⭐ New",
        emptyTitle: "No matching leads found",
        emptySubtitle: "Try adjusting your search query or filter."
      }
    };

    function init() {
      // 1. Language preference
      try {
        const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
        if (savedLang === 'en' || savedLang === 'ar') {
          currentLang = savedLang;
        }
      } catch (e) {}

      // 2. Multi-Version Deep Recovery:
      // Loop over all storage versions ('zargham_leads_v5', 'v4', 'v3', 'v2', 'zargham_leads')
      // If a lead was marked 'sent' or 'replied' in ANY version, NEVER revert it to 'unsent'!
      const userStatusMap = new Map();
      const userSentAtMap = new Map();
      const allStorageKeys = ['zargham_leads_v5', 'zargham_leads_v4', 'zargham_leads_v3', 'zargham_leads_v2', 'zargham_leads'];

      allStorageKeys.forEach(key => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach(l => {
                if (l && l.phone && (l.status === 'sent' || l.status === 'replied')) {
                  const ph = formatWaNumber(l.phone);
                  if (!userStatusMap.has(ph) || l.status === 'replied') {
                    userStatusMap.set(ph, l.status);
                  }
                  if (l.sent_at) {
                    userSentAtMap.set(ph, l.sent_at);
                  }
                }
              });
            }
          }
        } catch (err) {
          console.warn('Error reading key', key, err);
        }
      });

      // 3. Build canonical leads list (merging initialLeads with recovered user statuses)
      leadsData = initialLeads.map(initLead => {
        const ph = formatWaNumber(initLead.phone);
        const recoveredStatus = userStatusMap.get(ph);
        const recoveredSentAt = userSentAtMap.get(ph) || (recoveredStatus === 'sent' ? 1 : 0);
        return {
          ...initLead,
          status: recoveredStatus || initLead.status || 'unsent',
          sent_at: recoveredSentAt
        };
      });

      // 4. Restore any user-created custom leads
      allStorageKeys.forEach(key => {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.filter(l => l && l.is_user_added).forEach(uLead => {
                const uPh = formatWaNumber(uLead.phone);
                if (!leadsData.some(l => formatWaNumber(l.phone) === uPh)) {
                  leadsData.unshift(uLead);
                }
              });
            }
          }
        } catch (e) {}
      });

      // 5. Persist unified recovered data into zargham_leads_v4
      saveToStorage();

      applyLanguage();
      render();

      window.addEventListener('scroll', () => {
        const btn = document.getElementById('btn-fab-top');
        if (btn) {
          if (window.scrollY > 300) {
            btn.style.display = 'flex';
          } else {
            btn.style.display = 'none';
          }
        }
      });
    }

    function setLanguage(lang) {
      currentLang = lang;
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      applyLanguage();
      render();
    }

    function applyLanguage() {
      const root = document.getElementById('html-root');
      const t = i18n[currentLang];

      root.setAttribute('lang', currentLang);
      root.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');

      document.getElementById('lang-btn-ar').classList.toggle('active', currentLang === 'ar');
      document.getElementById('lang-btn-en').classList.toggle('active', currentLang === 'en');

      document.getElementById('ui-brand').innerText = t.brand;
      document.getElementById('ui-brand-tag').innerText = t.brandTag;
      document.getElementById('ui-add-lead').innerText = t.addLead;

      document.getElementById('lbl-unsent').innerText = t.unsentLeads;
      document.getElementById('lbl-sent').innerText = t.sentLeads;
      document.getElementById('lbl-replied').innerText = t.repliedLeads;
      document.getElementById('lbl-total').innerText = t.totalLeads;

      document.getElementById('search-input').placeholder = t.searchPlaceholder;

      const citySelect = document.getElementById('city-filter');
      citySelect.options[0].text = t.allCities;
      for (let i = 1; i < citySelect.options.length; i++) {
        const val = citySelect.options[i].value;
        if (t.cities[val]) {
          citySelect.options[i].text = t.cities[val];
        }
      }

      document.getElementById('ui-modal-title').innerText = t.modalTitle;
      document.getElementById('ui-lbl-modal-name').innerText = t.modalName;
      document.getElementById('ui-lbl-modal-phone').innerText = t.modalPhone;
      document.getElementById('ui-lbl-modal-city').innerText = t.modalCity;
      document.getElementById('ui-lbl-modal-address').innerText = t.modalAddress;
      document.getElementById('ui-btn-submit').innerText = t.modalSubmit;

      const newCitySelect = document.getElementById('new-city');
      for (let i = 0; i < newCitySelect.options.length; i++) {
        const val = newCitySelect.options[i].value;
        if (t.cities[val]) {
          newCitySelect.options[i].text = t.cities[val];
        }
      }
    }

    function saveToStorage() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leadsData));
    }

    function getMessageEn(lead) {
      const displayName = lead.english_name || lead.name;
      return "Hi " + displayName + ", I'm Zargham, a website developer.\\n\\nI came across your real estate company and wanted to introduce myself. I build professional websites that help real estate businesses showcase properties and make it easier for clients to enquire.\\n\\nWould you be open to seeing a quick example of my work?";
    }

    function getMessageAr(lead) {
      return "مرحباً " + lead.name + "، أنا ضرغام، مطوّر ومصمم مواقع إلكترونية.\\n\\nاطّلعت على نشاطكم العقاري المميّز وحببت أن أقدّم نفسي. أعمل على تطوير وتصميم مواقع ويب احترافية تساعد المنشآت العقارية في عرض المشاريع والعقارات وتسهيل تواصل واستفسارات العملاء.\\n\\nهل يناسبكم الاطّلاع على نموذج سريع من أعمالي؟";
    }

    function getLeadMessage(lead, lang) {
      return lang === 'en' ? getMessageEn(lead) : getMessageAr(lead);
    }

    function setCardMsgLang(leadId, lang, event) {
      if (event) event.stopPropagation();
      leadMsgLangs[leadId] = lang;
      render();
    }

    function toggleDrawer(leadId, event) {
      if (event) event.stopPropagation();
      if (openDrawers.has(leadId)) {
        openDrawers.delete(leadId);
      } else {
        openDrawers.add(leadId);
      }
      render();
    }

    function updateStats() {
      const total = leadsData.length;
      const sent = leadsData.filter(l => l.status === 'sent').length;
      const unsent = leadsData.filter(l => l.status === 'unsent').length;
      const replied = leadsData.filter(l => l.status === 'replied').length;

      document.getElementById('stat-total').innerText = total;
      document.getElementById('stat-sent').innerText = sent;
      document.getElementById('stat-unsent').innerText = unsent;
      document.getElementById('stat-replied').innerText = replied;

      const pct = total > 0 ? Math.round(((sent + replied) / total) * 100) : 0;
      document.getElementById('progress-bar').style.width = pct + '%';
    }

    function setFilter(filter) {
      currentFilter = filter;
      document.querySelectorAll('.stat-chip').forEach(c => c.classList.remove('active'));
      const activeChip = document.getElementById('card-' + filter);
      if (activeChip) activeChip.classList.add('active');
      render();
    }

    function handleSearch() {
      searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
      const clearBtn = document.getElementById('btn-clear-search');
      clearBtn.style.display = searchQuery ? 'flex' : 'none';
      render();
    }

    function clearSearch() {
      document.getElementById('search-input').value = '';
      searchQuery = '';
      document.getElementById('btn-clear-search').style.display = 'none';
      render();
    }

    function handleCityFilter(city) {
      selectedCity = city;
      render();
    }

    // Fast Action: Open WhatsApp AND Automatically Mark as Sent & Move to Bottom!
    function handleWhatsAppClick(leadId, waUrl, event) {
      const lead = leadsData.find(l => l.id === leadId);
      if (lead) {
        lead.status = 'sent';
        lead.sent_at = Date.now();
        saveToStorage();
        updateStats();

        // Immediate visual update on the card in DOM
        const cardElem = document.querySelector('[data-card-id="' + leadId + '"]');
        if (cardElem) {
          cardElem.classList.remove('status-unsent');
          cardElem.classList.add('status-sent');
          const badge = cardElem.querySelector('.status-indicator-badge');
          if (badge) {
            badge.className = 'status-indicator-badge badge-sent';
            badge.textContent = '✅ ' + i18n[currentLang].statusSent;
          }
          const sBtns = cardElem.querySelectorAll('.status-btn');
          sBtns.forEach(btn => {
            btn.classList.remove('active-unsent', 'active-sent', 'active-replied');
            if (btn.classList.contains('btn-status-sent')) {
              btn.classList.add('active-sent');
            }
          });
          cardElem.style.transition = 'all 0.35s ease';
          cardElem.style.opacity = '0.75';
        }

        showToast(i18n[currentLang].toastSent);
      }

      // Delay re-render so browser initiates WhatsApp opening cleanly, then moves card down!
      setTimeout(function() {
        render();
      }, 400);
    }

    function setLeadStatus(leadId, newStatus, event) {
      if (event) event.stopPropagation();
      const lead = leadsData.find(l => l.id === leadId);
      const t = i18n[currentLang];
      if (lead) {
        lead.status = newStatus;
        if (newStatus === 'sent') {
          lead.sent_at = Date.now();
        }
        saveToStorage();
        updateStats();
        render();
        showToast(newStatus === 'sent' ? t.toastSent : (newStatus === 'replied' ? t.toastReplied : t.toastUnsent));
      }
    }

    function openAddModal() {
      document.getElementById('add-modal').style.display = 'flex';
      document.getElementById('new-name').focus();
    }

    function closeAddModal(e) {
      if (!e || e.target.id === 'add-modal' || e.target.classList.contains('modal-close-btn')) {
        document.getElementById('add-modal').style.display = 'none';
      }
    }

    function handleFormSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('new-name').value.trim();
      const phone = document.getElementById('new-phone').value.trim();
      const city = document.getElementById('new-city').value;
      const address = document.getElementById('new-address').value.trim() || city;

      if (!name || !phone) return;

      const newId = Date.now();
      const newLead = {
        id: newId,
        name: name,
        english_name: '',
        phone: phone,
        wa_phone: formatWaNumber(phone),
        address: address,
        city: city,
        category: 'مضاف يدوياً',
        license: 'جديد',
        maps_url: 'https://www.google.com/maps/search/' + encodeURIComponent(name + ' ' + city),
        status: 'unsent',
        created_at: Date.now(),
        is_user_added: true
      };

      leadsData.unshift(newLead);
      saveToStorage();

      document.getElementById('add-lead-form').reset();
      closeAddModal();

      render();
      showToast(currentLang === 'en' ? '⭐ Lead added to top!' : '⭐ تم حفظ الليد بنجاح في الأعلى!');
    }

    function copyMessage(elemId, event) {
      if (event) event.stopPropagation();
      const textElem = document.getElementById(elemId);
      if (!textElem) return;

      const text = textElem.innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showToast(i18n[currentLang].copied);
        });
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showToast(i18n[currentLang].copied);
      }
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }

    function render() {
      updateStats();
      const t = i18n[currentLang];

      let filtered = [...leadsData];

      if (searchQuery) {
        filtered = filtered.filter(l => {
          const matchName = (l.name || '').toLowerCase().includes(searchQuery);
          const matchEn = (l.english_name || '').toLowerCase().includes(searchQuery);
          const matchPhone = (l.phone || '').includes(searchQuery);
          const matchAddr = (l.address || '').toLowerCase().includes(searchQuery);
          return matchName || matchEn || matchPhone || matchAddr;
        });
      }

      if (selectedCity !== 'all') {
        filtered = filtered.filter(l => (l.city || '').includes(selectedCity));
      }

      // Filter by selected Chip
      if (currentFilter === 'unsent') {
        filtered = filtered.filter(l => l.status === 'unsent');
        filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      } else if (currentFilter === 'sent') {
        filtered = filtered.filter(l => l.status === 'sent');
        filtered.sort((a, b) => (b.sent_at || 0) - (a.sent_at || 0) || (b.created_at || 0) - (a.created_at || 0));
      } else if (currentFilter === 'replied') {
        filtered = filtered.filter(l => l.status === 'replied');
        filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      } else {
        // 'all': Priority sort:
        // 1. Unsent leads on top! (Rank 0)
        // 2. Replied leads next! (Rank 1)
        // 3. Sent leads strictly pushed DOWN to the bottom! (Rank 2)
        filtered.sort((a, b) => {
          const rankA = a.status === 'unsent' ? 0 : (a.status === 'replied' ? 1 : 2);
          const rankB = b.status === 'unsent' ? 0 : (b.status === 'replied' ? 1 : 2);
          if (rankA !== rankB) return rankA - rankB;
          if (rankA === 2) {
            // Among sent leads, recently sent goes to bottom of sent list
            return (a.sent_at || 0) - (b.sent_at || 0) || (b.created_at || 0) - (a.created_at || 0);
          }
          return (b.created_at || 0) - (a.created_at || 0);
        });
      }

      const listContainer = document.getElementById('leads-list');
      if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><h3>' + t.emptyTitle + '</h3><p>' + t.emptySubtitle + '</p></div>';
        return;
      }

      let html = '';
      filtered.forEach((lead, idx) => {
        const cardLang = leadMsgLangs[lead.id] || currentLang;
        const msg = getLeadMessage(lead, cardLang);
        const encodedMsg = encodeURIComponent(msg);
        const waNumber = lead.wa_phone || formatWaNumber(lead.phone);
        const waLink = "https://wa.me/" + waNumber + "?text=" + encodedMsg;
        const textElemId = 'msg-txt-' + lead.id;
        const isDrawerOpen = openDrawers.has(lead.id);

        const isUnsent = lead.status === 'unsent';
        const isSent = lead.status === 'sent';
        const isReplied = lead.status === 'replied';

        const cityDisplay = (t.cities && t.cities[lead.city]) ? t.cities[lead.city] : lead.city;

        html += '<article class="lead-card status-' + lead.status + '" data-card-id="' + lead.id + '">';
        
        // Card Top Bar
        html += '  <div class="card-head">';
        html += '    <div class="head-main">';
        html += '      <h3 class="biz-name">' + lead.name + '</h3>';
        if (lead.english_name) {
          html += '    <div class="biz-name-sub">' + lead.english_name + '</div>';
        }
        html += '    </div>';
        html += '    <div style="display:flex; align-items:center; gap:6px;">';
        html += '      <span class="status-indicator-badge badge-' + lead.status + '">' + (isSent ? '✅ ' + t.statusSent : (isReplied ? '💬 ' + t.statusReplied : '⏳ ' + t.statusUnsent)) + '</span>';
        html += '      <span class="rank-pill">#' + (idx + 1) + '</span>';
        html += '    </div>';
        html += '  </div>';

        // Meta tags
        html += '  <div class="meta-row">';
        html += '    <span class="badge-chip chip-city">📍 ' + cityDisplay + '</span>';
        html += '    <span class="badge-chip chip-lic">' + (lead.license || t.tagLicensed) + '</span>';
        if (lead.is_user_added) {
          html += '  <span class="badge-chip chip-new">' + t.tagNew + '</span>';
        }
        html += '  </div>';

        // Contact info
        html += '  <div class="address-text">';
        html += '    <span>📞 ' + lead.phone + '</span>';
        html += '    <span style="opacity:0.4;">•</span>';
        html += '    <span>' + lead.address + '</span>';
        html += '  </div>';

        // Fast Action Bar (Thumb-optimized!)
        html += '  <div class="fast-action-bar">';
        html += '    <a href="' + waLink + '" target="_blank" rel="noopener noreferrer" class="btn-wa-main" onclick="handleWhatsAppClick(' + lead.id + ', \\'' + waLink + '\\', event)">';
        html += '      <span>' + t.sendWa + '</span>';
        html += '    </a>';
        html += '    <a href="tel:' + lead.phone.replace(/\\s+/g, '') + '" class="btn-icon-action" title="Call">📞</a>';
        html += '    <a href="' + lead.maps_url + '" target="_blank" class="btn-icon-action" title="Google Maps">🗺️</a>';
        html += '    <button type="button" class="btn-drawer-toggle ' + (isDrawerOpen ? 'expanded' : '') + '" onclick="toggleDrawer(' + lead.id + ', event)" title="View Pitch">📝</button>';
        html += '  </div>';

        // Collapsible Pitch Drawer
        html += '  <div class="pitch-drawer ' + (isDrawerOpen ? 'open' : '') + '" id="drawer-' + lead.id + '">';
        html += '    <div class="pitch-top">';
        html += '      <span class="pitch-title">' + t.pitchMsgHeader + '</span>';
        html += '      <div style="display:flex; align-items:center; gap:4px;">';
        html += '        <div class="pitch-switch">';
        html += '          <button type="button" class="pitch-switch-btn ' + (cardLang === 'ar' ? 'active' : '') + '" onclick="setCardMsgLang(' + lead.id + ', \\'ar\\', event)">عربي</button>';
        html += '          <button type="button" class="pitch-switch-btn ' + (cardLang === 'en' ? 'active' : '') + '" onclick="setCardMsgLang(' + lead.id + ', \\'en\\', event)">EN</button>';
        html += '        </div>';
        html += '        <button type="button" class="btn-copy-mini" onclick="copyMessage(\\'' + textElemId + '\\', event)">' + t.copy + '</button>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div class="pitch-text-box ' + (cardLang === 'en' ? 'lang-en' : 'lang-ar') + '" id="' + textElemId + '">' + msg.replace(/\\n/g, '<br>') + '</div>';
        html += '  </div>';

        // Quick Status Tabs
        html += '  <div class="status-bar">';
        html += '    <button type="button" class="status-btn btn-status-unsent ' + (isUnsent ? 'active-unsent' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'unsent\\', event)">' + t.statusUnsent + '</button>';
        html += '    <button type="button" class="status-btn btn-status-sent ' + (isSent ? 'active-sent' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'sent\\', event)">' + t.statusSent + '</button>';
        html += '    <button type="button" class="status-btn btn-status-replied ' + (isReplied ? 'active-replied' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'replied\\', event)">' + t.statusReplied + '</button>';
        html += '  </div>';

        html += '</article>';
      });

      listContainer.innerHTML = html;
    }

    window.addEventListener('DOMContentLoaded', init);
    window.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        render();
      }
    });
    window.addEventListener('pageshow', function() {
      render();
    });
    window.addEventListener('focus', function() {
      render();
    });
  </script>
</body>
</html>`;

const finalHtml = htmlTemplate.replace('LEADS_PLACEHOLDER', leadsJsonString);

// Write leads_report.html
fs.writeFileSync(path.join(__dirname, 'leads_report.html'), finalHtml, 'utf8');
console.log('Mobile-First CRM leads_report.html written successfully!');

// Keep index.html in sync for Vercel
fs.writeFileSync(path.join(__dirname, 'index.html'), finalHtml, 'utf8');
console.log('index.html updated successfully for Vercel!');

// Rebuild PDF
const pdfPath = path.join(__dirname, 'leads_report.pdf');
const htmlPath = path.join(__dirname, 'leads_report.html');
const browserPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];
let browserPath = browserPaths.find(p => fs.existsSync(p));
if (browserPath) {
  try {
    const cmd = '"' + browserPath + '" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="' + pdfPath + '" "' + htmlPath + '"';
    execSync(cmd, { stdio: 'inherit' });
    console.log('PDF updated successfully!');
  } catch (e) {
    console.error('Error generating PDF:', e);
  }
}
