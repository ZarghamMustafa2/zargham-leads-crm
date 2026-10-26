const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function formatWaNumber(phone) {
  let clean = phone.replace(/\D/g, '');
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Zargham Leads CRM - Real Estate Outreach</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary: #2563eb;
      --primary-dark: #1d4ed8;
      --whatsapp: #25d366;
      --whatsapp-dark: #128c7e;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --sent-bg: #dcfce7;
      --sent-text: #166534;
      --unsent-bg: #fef3c7;
      --unsent-text: #92400e;
      --replied-bg: #e0e7ff;
      --replied-text: #3730a3;
    }

    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      margin: 0;
      padding: 0 0 90px 0;
      transition: all 0.2s ease;
    }

    html[dir="ltr"] body {
      font-family: 'Inter', 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* Top Sticky App Bar */
    .app-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: white;
      padding: 14px 16px 12px 16px;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      gap: 8px;
    }

    .brand-title {
      font-size: 17px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }

    .brand-tag {
      background: rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Bilingual Switcher */
    .lang-switcher {
      display: inline-flex;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 2px;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }

    .lang-btn {
      background: transparent;
      border: none;
      color: #e2e8f0;
      padding: 4px 9px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }

    .lang-btn.active {
      background: white;
      color: #1e3a8a;
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
    }

    .add-lead-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      white-space: nowrap;
    }

    .add-lead-btn:active {
      transform: scale(0.97);
    }

    /* Live Analytics / Counter Cards */
    .counters-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .counter-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 8px 4px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
    }

    .counter-card.active {
      background: rgba(255, 255, 255, 0.25);
      border-color: #60a5fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .counter-card .num {
      font-size: 20px;
      font-weight: 800;
      line-height: 1.1;
      font-family: 'Inter', sans-serif;
    }

    .counter-card .label {
      font-size: 10px;
      color: #cbd5e1;
      margin-top: 2px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .num-total { color: #ffffff; }
    .num-unsent { color: #fde047; }
    .num-sent { color: #4ade80; }
    .num-replied { color: #a5b4fc; }

    /* Outreach Progress Bar */
    .progress-wrap {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 4px;
      height: 4px;
      overflow: hidden;
      margin-top: 4px;
    }

    .progress-bar {
      background: linear-gradient(90deg, #fde047 0%, #4ade80 100%);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
    }

    /* Sticky Search & Quick Filter Bar */
    .controls-bar {
      background: white;
      padding: 12px 16px;
      position: sticky;
      top: 114px;
      z-index: 90;
      border-bottom: 1px solid var(--border);
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .search-box {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
      background: #f8fafc;
      transition: border-color 0.2s;
      margin-bottom: 8px;
    }

    .search-box:focus {
      border-color: var(--primary);
      background: white;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
    }

    .filter-pills::-webkit-scrollbar {
      display: none;
    }

    .pill-btn {
      border: 1px solid var(--border);
      background: white;
      color: var(--text-muted);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pill-btn.active {
      background: #1e3a8a;
      color: white;
      border-color: #1e3a8a;
    }

    /* Leads Feed Container */
    .leads-container {
      padding: 14px 14px 20px 14px;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Lead Card */
    .lead-card {
      background: var(--card-bg);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 14px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      transition: transform 0.15s, box-shadow 0.15s;
      position: relative;
    }

    .lead-card.status-sent {
      border-left: 4px solid #16a34a;
      background: #fafdfb;
    }

    html[dir="rtl"] .lead-card.status-sent {
      border-left: 1px solid var(--border);
      border-right: 4px solid #16a34a;
    }

    .lead-card.status-unsent {
      border-left: 4px solid #eab308;
    }

    html[dir="rtl"] .lead-card.status-unsent {
      border-left: 1px solid var(--border);
      border-right: 4px solid #eab308;
    }

    .lead-card.status-replied {
      border-left: 4px solid #6366f1;
      background: #fafaff;
    }

    html[dir="rtl"] .lead-card.status-replied {
      border-left: 1px solid var(--border);
      border-right: 4px solid #6366f1;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 6px;
    }

    .biz-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
      margin: 0 0 2px 0;
      line-height: 1.3;
    }

    .biz-meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }

    .tag-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 700;
    }

    .tag-city { background: #e0f2fe; color: #0369a1; }
    .tag-license { background: #f1f5f9; color: #475569; }
    .tag-new { background: #fef08a; color: #854d0e; }

    .biz-address {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Big Action Buttons */
    .action-buttons {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 8px;
      margin-bottom: 12px;
    }

    .btn-wa-action {
      background: linear-gradient(135deg, #25d366 0%, #16a34a 100%);
      color: white;
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
      padding: 12px 14px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 3px 6px rgba(37, 211, 102, 0.25);
    }

    .btn-wa-action:active {
      transform: scale(0.98);
      filter: brightness(0.95);
    }

    .btn-map-action {
      background: #f1f5f9;
      border: 1px solid var(--border);
      color: #3b82f6;
      text-decoration: none;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }

    /* Message Accordion */
    .message-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
      position: relative;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .msg-pills {
      display: inline-flex;
      background: #e2e8f0;
      border-radius: 14px;
      padding: 2px;
      gap: 2px;
    }

    .btn-msg-lang {
      border: none;
      background: transparent;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 12px;
      cursor: pointer;
      color: #64748b;
      font-family: inherit;
      transition: all 0.2s;
    }

    .btn-msg-lang.active {
      background: #2563eb;
      color: white;
    }

    .btn-copy {
      background: #e2e8f0;
      border: none;
      padding: 3px 9px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
    }

    .message-text {
      font-size: 12px;
      line-height: 1.55;
      color: #334155;
      white-space: pre-line;
    }

    .message-text.lang-ar {
      direction: rtl;
      text-align: right;
      font-family: 'Cairo', sans-serif;
    }

    .message-text.lang-en {
      direction: ltr;
      text-align: left;
      font-family: 'Inter', sans-serif;
    }

    /* Status Selector (Thumb-Friendly Tap Buttons) */
    .status-selector {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      background: #f1f5f9;
      padding: 4px;
      border-radius: 8px;
    }

    .status-tab {
      border: none;
      background: transparent;
      padding: 8px 4px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      color: var(--text-muted);
      transition: all 0.2s;
      white-space: nowrap;
    }

    .status-tab.active-unsent {
      background: #fef08a;
      color: #854d0e;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .status-tab.active-sent {
      background: #bbf7d0;
      color: #14532d;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .status-tab.active-replied {
      background: #c7d2fe;
      color: #312e81;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Modal for Adding New Lead */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: none;
      align-items: flex-end;
      justify-content: center;
    }

    .modal-content {
      background: white;
      width: 100%;
      max-width: 500px;
      border-radius: 20px 20px 0 0;
      padding: 22px 20px 30px 20px;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
      animation: slideUp 0.25s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
    }

    .modal-close {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 16px;
      cursor: pointer;
      font-weight: 700;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 5px;
    }

    .form-input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }

    .form-input:focus {
      border-color: var(--primary);
    }

    .btn-submit-lead {
      width: 100%;
      background: #2563eb;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      margin-top: 8px;
      font-family: inherit;
    }

    .btn-submit-lead:active {
      background: #1d4ed8;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0f172a;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      z-index: 300;
      opacity: 0;
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      pointer-events: none;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    .empty-state {
      text-align: center;
      padding: 50px 20px;
      color: var(--text-muted);
    }

    @media print {
      .app-header, .controls-bar, .action-buttons, .status-selector, .modal-overlay, .btn-copy, .msg-pills, .lang-switcher {
        display: none !important;
      }
      body { padding: 0 !important; background: white !important; }
      .lead-card { break-inside: avoid; border: 1px solid #ccc; box-shadow: none; margin-bottom: 20px; }
    }
  </style>
</head>
<body>

  <!-- Sticky Top App Bar -->
  <header class="app-header">
    <div class="header-top">
      <div class="brand-title">
        <span id="ui-brand">⚡ ضرغام CRM</span>
        <span class="brand-tag" id="ui-brand-tag">Outreach Kit</span>
      </div>
      <div class="header-actions">
        <!-- Bilingual Switcher -->
        <div class="lang-switcher">
          <button type="button" class="lang-btn active" id="lang-btn-ar" onclick="setLanguage('ar')">🇸🇦 ع</button>
          <button type="button" class="lang-btn" id="lang-btn-en" onclick="setLanguage('en')">🇬🇧 EN</button>
        </div>
        <button class="add-lead-btn" onclick="openAddModal()">
          <span id="ui-add-lead">➕ إضافة ليد</span>
        </button>
      </div>
    </div>

    <!-- Live Counter Grid -->
    <div class="counters-grid">
      <div class="counter-card" id="card-all" onclick="setFilter('all')">
        <div class="num num-total" id="stat-total">0</div>
        <div class="label" id="lbl-total">إجمالي الليڈز</div>
      </div>
      <div class="counter-card active" id="card-unsent" onclick="setFilter('unsent')">
        <div class="num num-unsent" id="stat-unsent">0</div>
        <div class="label" id="lbl-unsent">لم يُرسل (المتبقي)</div>
      </div>
      <div class="counter-card" id="card-sent" onclick="setFilter('sent')">
        <div class="num num-sent" id="stat-sent">0</div>
        <div class="label" id="lbl-sent">تم الإرسال</div>
      </div>
      <div class="counter-card" id="card-replied" onclick="setFilter('replied')">
        <div class="num num-replied" id="stat-replied">0</div>
        <div class="label" id="lbl-replied">تم الرد</div>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-wrap">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
  </header>

  <!-- Search & Filter Controls -->
  <section class="controls-bar">
    <input type="text" class="search-box" id="search-input" placeholder="🔍 ابحث بالاسم أو رقم الهاتف..." oninput="handleSearch()">
    
    <div class="filter-pills">
      <button class="pill-btn active" id="pill-priority" onclick="setFilter('priority')">⚡ غير المرسل أولاً</button>
      <button class="pill-btn" id="pill-all" onclick="setFilter('all')">📋 الكل</button>
      <button class="pill-btn" id="pill-unsent" onclick="setFilter('unsent')">⏳ لم يُرسل</button>
      <button class="pill-btn" id="pill-sent" onclick="setFilter('sent')">✅ تم الإرسال</button>
      <button class="pill-btn" id="pill-replied" onclick="setFilter('replied')">💬 تم الرد</button>
      <select id="city-filter" class="pill-btn" style="padding: 4px 8px; outline: none;" onchange="handleCityFilter(this.value)">
        <option value="all">📍 جميع المدن</option>
        <option value="الرياض">الرياض</option>
        <option value="جدة">جدة</option>
        <option value="الدمام">الدمام</option>
        <option value="الخبر">الخبر</option>
        <option value="الطائف">الطائف</option>
        <option value="مكة المكرمة">مكة المكرمة</option>
      </select>
    </div>
  </section>

  <!-- Leads List Container -->
  <main class="leads-container" id="leads-list">
    <!-- Rendered dynamically -->
  </main>

  <!-- Add New Lead Modal -->
  <div class="modal-overlay" id="add-modal" onclick="closeAddModal(event)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <div class="modal-header">
        <h3 class="modal-title" id="ui-modal-title">إضافة ليد جديدة (New Lead)</h3>
        <button class="modal-close" onclick="closeAddModal()">&times;</button>
      </div>

      <form id="add-lead-form" onsubmit="handleFormSubmit(event)">
        <div class="form-group">
          <label class="form-label" id="ui-lbl-modal-name">اسم المكتب / الشركة العقارية *</label>
          <input type="text" class="form-input" id="new-name" placeholder="مثال: مكتب قمة الرياض للعقارات" required>
        </div>

        <div class="form-group">
          <label class="form-label" id="ui-lbl-modal-phone">رقم الجوال / الهاتف *</label>
          <input type="tel" class="form-input" id="new-phone" placeholder="مثال: 0551234567 أو 966551234567" required>
        </div>

        <div class="form-group">
          <label class="form-label" id="ui-lbl-modal-city">المدينة</label>
          <select class="form-input" id="new-city">
            <option value="الرياض">الرياض</option>
            <option value="جدة">جدة</option>
            <option value="الدمام">الدمام</option>
            <option value="الخبر">الخبر</option>
            <option value="الطائف">الطائف</option>
            <option value="مكة المكرمة">مكة المكرمة</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" id="ui-lbl-modal-address">الحي / العنوان (اختياري)</label>
          <input type="text" class="form-input" id="new-address" placeholder="مثال: حي الياسمين">
        </div>

        <button type="submit" class="btn-submit-lead" id="ui-btn-submit">💾 حفظ الليد وإضافتها للأعلى</button>
      </form>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast" id="toast">تم النسخ بنجاح!</div>

  <script>
    const initialLeads = LEADS_PLACEHOLDER;

    const STORAGE_KEY = 'zargham_leads_v3';
    const LANG_STORAGE_KEY = 'zargham_crm_lang';

    let leadsData = [];
    let currentFilter = 'priority';
    let searchQuery = '';
    let selectedCity = 'all';
    let currentLang = 'ar';
    let leadMsgLangs = {}; // per-lead message language override

    const i18n = {
      ar: {
        brand: "⚡ ضرغام CRM",
        brandTag: "Outreach Kit",
        addLead: "➕ إضافة ليد",
        totalLeads: "إجمالي الليڈز",
        unsentLeads: "لم يُرسل (المتبقي)",
        sentLeads: "تم الإرسال",
        repliedLeads: "تم الرد",
        searchPlaceholder: "🔍 ابحث بالاسم أو رقم الهاتف...",
        filterPriority: "⚡ غير المرسل أولاً",
        filterAll: "📋 الكل",
        filterUnsent: "⏳ لم يُرسل",
        filterSent: "✅ تم الإرسال",
        filterReplied: "💬 تم الرد",
        allCities: "📍 جميع المدن",
        cities: {
          "الرياض": "الرياض",
          "جدة": "جدة",
          "الدمام": "الدمام",
          "الخبر": "الخبر",
          "الطائف": "الطائف",
          "مكة المكرمة": "مكة المكرمة",
          "أخرى": "أخرى"
        },
        sendWa: "💬 إرسال واتساب (مجهّز)",
        map: "🗺️ الخريطة",
        pitchMsgHeader: "📝 نص الرسالة بالاسم:",
        copy: "نسخ",
        copied: "تم النسخ بنجاح!",
        statusUnsent: "⏳ لم يُرسل",
        statusSent: "✅ تم الإرسال",
        statusReplied: "💬 تم الرد",
        toastSent: "✅ تم التحديد: تم الإرسال",
        toastReplied: "💬 تم التحديد: تم الرد",
        toastUnsent: "⏳ تم التحديد: لم يُرسل",
        modalTitle: "إضافة ليد جديدة (New Lead)",
        modalName: "اسم المكتب / الشركة العقارية *",
        modalPhone: "رقم الجوال / الهاتف *",
        modalCity: "المدينة",
        modalAddress: "الحي / العنوان (اختياري)",
        modalSubmit: "💾 حفظ الليد وإضافتها للأعلى",
        tagLicensed: "مرخص",
        tagNew: "⭐ جديد",
        emptyTitle: "لا توجد نتائج مطابقة",
        emptySubtitle: "جرّب تغيير خيارات البحث أو الفلتر."
      },
      en: {
        brand: "⚡ Zargham CRM",
        brandTag: "Outreach Kit",
        addLead: "➕ Add Lead",
        totalLeads: "Total Leads",
        unsentLeads: "Unsent (Pending)",
        sentLeads: "Sent",
        repliedLeads: "Replied",
        searchPlaceholder: "🔍 Search by business name or phone...",
        filterPriority: "⚡ Unsent First",
        filterAll: "📋 All",
        filterUnsent: "⏳ Unsent",
        filterSent: "✅ Sent",
        filterReplied: "💬 Replied",
        allCities: "📍 All Cities",
        cities: {
          "الرياض": "Riyadh",
          "جدة": "Jeddah",
          "الدمام": "Dammam",
          "الخبر": "Al Khobar",
          "الطائف": "Taif",
          "مكة المكرمة": "Makkah",
          "أخرى": "Other"
        },
        sendWa: "💬 Send WhatsApp (Ready)",
        map: "🗺️ Map",
        pitchMsgHeader: "📝 Pitch Message:",
        copy: "Copy",
        copied: "Copied successfully!",
        statusUnsent: "⏳ Unsent",
        statusSent: "✅ Sent",
        statusReplied: "💬 Replied",
        toastSent: "✅ Marked as: Sent",
        toastReplied: "💬 Marked as: Replied",
        toastUnsent: "⏳ Marked as: Unsent",
        modalTitle: "Add New Lead",
        modalName: "Business / Office Name *",
        modalPhone: "Mobile / Phone Number *",
        modalCity: "City",
        modalAddress: "Neighborhood / Address (Optional)",
        modalSubmit: "💾 Save Lead to Top",
        tagLicensed: "Licensed",
        tagNew: "⭐ New",
        emptyTitle: "No matching leads found",
        emptySubtitle: "Try adjusting your search query or filter."
      }
    };

    function init() {
      // Load saved language
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'en' || savedLang === 'ar') {
        currentLang = savedLang;
      }

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const existingPhones = new Set(parsed.map(l => formatWaNumber(l.phone || '')));
          const newLeads = initialLeads.filter(l => !existingPhones.has(formatWaNumber(l.phone || '')));
          if (newLeads.length > 0) {
            leadsData = [...newLeads, ...parsed];
          } else {
            leadsData = parsed;
          }
        } catch(e) {
          leadsData = [...initialLeads];
        }
      } else {
        // Also check if v2 had user added leads to migrate
        const oldV2 = localStorage.getItem('zargham_leads_v2');
        if (oldV2) {
          try {
            const parsedOld = JSON.parse(oldV2);
            const userAdded = parsedOld.filter(l => l.is_user_added);
            leadsData = [...userAdded, ...initialLeads];
          } catch(e) {
            leadsData = [...initialLeads];
          }
        } else {
          leadsData = [...initialLeads];
        }
      }

      // Sync pre-marked sent leads from initial database
      const sentInitialPhones = new Set(initialLeads.filter(l => l.status === 'sent').map(l => formatWaNumber(l.phone || '')));
      leadsData.forEach(l => {
        if (sentInitialPhones.has(formatWaNumber(l.phone || ''))) {
          l.status = 'sent';
        }
      });
      saveToStorage();

      applyLanguage();
      render();
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

      document.getElementById('lbl-total').innerText = t.totalLeads;
      document.getElementById('lbl-unsent').innerText = t.unsentLeads;
      document.getElementById('lbl-sent').innerText = t.sentLeads;
      document.getElementById('lbl-replied').innerText = t.repliedLeads;

      document.getElementById('search-input').placeholder = t.searchPlaceholder;
      document.getElementById('pill-priority').innerText = t.filterPriority;
      document.getElementById('pill-all').innerText = t.filterAll;
      document.getElementById('pill-unsent').innerText = t.filterUnsent;
      document.getElementById('pill-sent').innerText = t.filterSent;
      document.getElementById('pill-replied').innerText = t.filterReplied;

      // Update City dropdown text
      const citySelect = document.getElementById('city-filter');
      citySelect.options[0].text = t.allCities;
      for (let i = 1; i < citySelect.options.length; i++) {
        const val = citySelect.options[i].value;
        if (t.cities[val]) {
          citySelect.options[i].text = t.cities[val];
        }
      }

      // Update Modal text
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

    function formatWaNumber(phone) {
      let clean = phone.replace(/\\D/g, '');
      if (clean.startsWith('05')) {
        clean = '966' + clean.slice(1);
      } else if (clean.startsWith('5') && clean.length === 9) {
        clean = '966' + clean;
      }
      return clean;
    }

    // Zargham's Pitch in English
    function getMessageEn(lead) {
      const displayName = lead.english_name || lead.name;
      return "Hi " + displayName + ", I'm Zargham, a website developer.\\n\\nI came across your real estate company and wanted to introduce myself. I build professional websites that help real estate businesses showcase properties and make it easier for clients to enquire.\\n\\nWould you be open to seeing a quick example of my work?";
    }

    // Zargham's Pitch in Arabic
    function getMessageAr(lead) {
      return "مرحباً " + lead.name + "، أنا ضرغام، مطوّر ومصمم مواقع إلكترونية.\\n\\nاطّلعت على نشاطكم العقاري المميّز وحببت أن أقدّم نفسي. أعمل على تطوير وتصميم مواقع ويب احترافية تساعد المنشآت العقارية في عرض المشاريع والعقارات وتسهيل تواصل العملاء وتقديم الاستفسارات.\\n\\nهل يناسبكم الاطّلاع على نموذج سريع من أعمالي؟";
    }

    function getLeadMessage(lead, lang) {
      return lang === 'en' ? getMessageEn(lead) : getMessageAr(lead);
    }

    function setCardMsgLang(leadId, lang) {
      leadMsgLangs[leadId] = lang;
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
      document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById('pill-' + filter);
      if (activeBtn) activeBtn.classList.add('active');

      document.querySelectorAll('.counter-card').forEach(c => c.classList.remove('active'));
      const activeCard = document.getElementById('card-' + filter);
      if (activeCard) activeCard.classList.add('active');

      render();
    }

    function handleSearch() {
      searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
      render();
    }

    function handleCityFilter(city) {
      selectedCity = city;
      render();
    }

    function setLeadStatus(leadId, newStatus) {
      const lead = leadsData.find(l => l.id === leadId);
      const t = i18n[currentLang];
      if (lead) {
        lead.status = newStatus;
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
      if (!e || e.target.id === 'add-modal' || e.target.classList.contains('modal-close')) {
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
        status: lead.status || 'unsent',
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

    function copyMessage(elemId) {
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

      // Priority Sorting: Unsent leads stay on top, Sent leads move below; New leads stay on top
      if (currentFilter === 'priority') {
        filtered.sort((a, b) => {
          if (a.status === 'unsent' && b.status !== 'unsent') return -1;
          if (a.status !== 'unsent' && b.status === 'unsent') return 1;
          return (b.created_at || 0) - (a.created_at || 0);
        });
      } else if (currentFilter === 'unsent') {
        filtered = filtered.filter(l => l.status === 'unsent');
        filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      } else if (currentFilter === 'sent') {
        filtered = filtered.filter(l => l.status === 'sent');
        filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      } else if (currentFilter === 'replied') {
        filtered = filtered.filter(l => l.status === 'replied');
        filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      } else {
        filtered.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      }

      const listContainer = document.getElementById('leads-list');
      if (filtered.length === 0) {
        listContainer.innerHTML = '<div class="empty-state"><h3>' + t.emptyTitle + '</h3><p>' + t.emptySubtitle + '</p></div>';
        return;
      }

      let html = '';
      filtered.forEach((lead, idx) => {
        // Individual card language preference (defaults to global language)
        const cardLang = leadMsgLangs[lead.id] || currentLang;
        const msg = getLeadMessage(lead, cardLang);
        const encodedMsg = encodeURIComponent(msg);
        const waNumber = lead.wa_phone || formatWaNumber(lead.phone);
        const waLink = "https://wa.me/" + waNumber + "?text=" + encodedMsg;
        const textElemId = 'msg-txt-' + lead.id;

        const isUnsent = lead.status === 'unsent';
        const isSent = lead.status === 'sent';
        const isReplied = lead.status === 'replied';

        const cityDisplay = (t.cities && t.cities[lead.city]) ? t.cities[lead.city] : lead.city;

        html += '<article class="lead-card status-' + lead.status + '">';
        html += '  <div class="card-top">';
        html += '    <div>';
        html += '      <h3 class="biz-name">' + lead.name + '</h3>';
        if (lead.english_name) {
          html += '    <div style="font-size: 11px; color: #64748b;">' + lead.english_name + '</div>';
        }
        html += '    </div>';
        html += '    <span style="font-size: 12px; font-weight: 800; color: #94a3b8;">#' + (idx + 1) + '</span>';
        html += '  </div>';

        html += '  <div class="biz-meta-tags">';
        html += '    <span class="tag-badge tag-city">📍 ' + cityDisplay + '</span>';
        html += '    <span class="tag-badge tag-license">' + (lead.license || t.tagLicensed) + '</span>';
        if (lead.is_user_added) {
          html += '  <span class="tag-badge tag-new">' + t.tagNew + '</span>';
        }
        html += '  </div>';

        html += '  <div class="biz-address"><span>' + lead.address + '</span></div>';

        html += '  <div class="action-buttons">';
        html += '    <a href="' + waLink + '" target="_blank" class="btn-wa-action" onclick="setLeadStatus(' + lead.id + ', \\'sent\\')">';
        html += '      <span>' + t.sendWa + '</span>';
        html += '    </a>';
        html += '    <a href="' + lead.maps_url + '" target="_blank" class="btn-map-action">' + t.map + '</a>';
        html += '  </div>';

        html += '  <div class="message-container">';
        html += '    <div class="message-header">';
        html += '      <span>' + t.pitchMsgHeader + '</span>';
        html += '      <div style="display: flex; align-items: center; gap: 6px;">';
        html += '        <div class="msg-pills">';
        html += '          <button type="button" class="btn-msg-lang ' + (cardLang === 'ar' ? 'active' : '') + '" onclick="setCardMsgLang(' + lead.id + ', \\'ar\\')">🇸🇦 ع</button>';
        html += '          <button type="button" class="btn-msg-lang ' + (cardLang === 'en' ? 'active' : '') + '" onclick="setCardMsgLang(' + lead.id + ', \\'en\\')">🇬🇧 EN</button>';
        html += '        </div>';
        html += '        <button type="button" class="btn-copy" onclick="copyMessage(\\'' + textElemId + '\\')">' + t.copy + '</button>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div class="message-text ' + (cardLang === 'en' ? 'lang-en' : 'lang-ar') + '" id="' + textElemId + '">' + msg.replace(/\\n/g, '<br>') + '</div>';
        html += '  </div>';

        html += '  <div class="status-selector">';
        html += '    <button type="button" class="status-tab ' + (isUnsent ? 'active-unsent' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'unsent\\')">' + t.statusUnsent + '</button>';
        html += '    <button type="button" class="status-tab ' + (isSent ? 'active-sent' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'sent\\')">' + t.statusSent + '</button>';
        html += '    <button type="button" class="status-tab ' + (isReplied ? 'active-replied' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'replied\\')">' + t.statusReplied + '</button>';
        html += '  </div>';
        html += '</article>';
      });

      listContainer.innerHTML = html;
    }

    window.addEventListener('DOMContentLoaded', init);
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
