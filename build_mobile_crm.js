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
      status: 'unsent',
      created_at: Date.now() - (1000 - leadId) * 60000
    });
  });
});

const leadsJsonString = JSON.stringify(allLeads);

const htmlTemplate = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Zargham Leads CRM - Real Estate Outreach</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  
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
      direction: rtl;
    }

    /* Top Sticky App Bar */
    .app-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
      color: white;
      padding: 16px 16px 14px 16px;
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
    }

    .brand-title {
      font-size: 18px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-tag {
      background: rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 12px;
      font-weight: 600;
      direction: ltr;
    }

    .add-lead-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 8px 4px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .counter-card.active {
      background: rgba(255, 255, 255, 0.25);
      border-color: #60a5fa;
    }

    .counter-card .num {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
    }

    .counter-card .label {
      font-size: 10.5px;
      color: #cbd5e1;
      font-weight: 600;
    }

    .num-total { color: #ffffff; }
    .num-unsent { color: #fde047; }
    .num-sent { color: #4ade80; }
    .num-replied { color: #a5b4fc; }

    /* Progress Bar */
    .progress-wrap {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      height: 6px;
      overflow: hidden;
      margin-top: 6px;
    }

    .progress-bar {
      background: linear-gradient(90deg, #fde047, #4ade80);
      height: 100%;
      width: 0%;
      transition: width 0.3s ease;
      border-radius: 20px;
    }

    /* Controls Bar: Search & Filters */
    .controls-bar {
      background: white;
      padding: 12px 14px;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 135px;
      z-index: 90;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }

    .search-box {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
      background: #f8fafc;
      margin-bottom: 10px;
      outline: none;
    }

    .search-box:focus {
      border-color: var(--primary);
      background: #fff;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
      overflow-x: auto;
      padding-bottom: 2px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }

    .filter-pills::-webkit-scrollbar {
      display: none;
    }

    .pill-btn {
      background: #f1f5f9;
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
      white-space: nowrap;
      cursor: pointer;
      font-family: inherit;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pill-btn.active {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }

    /* Leads Container */
    .leads-container {
      padding: 12px 14px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Lead Card (Mobile-Optimized) */
    .lead-card {
      background: var(--card-bg);
      border-radius: 12px;
      margin-bottom: 14px;
      padding: 15px;
      border: 1px solid var(--border);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      position: relative;
      transition: all 0.2s ease;
      border-right: 6px solid #f59e0b; /* default unsent amber */
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .lead-card.status-sent {
      border-right-color: #22c55e;
      background: #fcfffd;
    }

    .lead-card.status-replied {
      border-right-color: #6366f1;
      background: #fafbff;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .biz-name {
      font-size: 16px;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.35;
      margin: 0 0 2px 0;
    }

    .biz-meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 8px;
    }

    .tag-badge {
      font-size: 10.5px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }

    .tag-city {
      background: #eff6ff;
      color: #1e40af;
    }

    .tag-license {
      background: #f1f5f9;
      color: #475569;
    }

    .tag-new {
      background: #fef2f2;
      color: #dc2626;
      font-weight: 700;
    }

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
      margin-bottom: 6px;
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
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
      font-size: 11.5px;
      line-height: 1.5;
      color: #334155;
      white-space: pre-line;
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
      background: var(--primary);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      margin-top: 10px;
    }

    .btn-submit-lead:active {
      background: var(--primary-dark);
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 25px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background: #0f172a;
      color: white;
      padding: 10px 18px;
      border-radius: 25px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 300;
      transition: transform 0.25s ease;
      white-space: nowrap;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>

  <!-- Sticky Top App Bar -->
  <header class="app-header">
    <div class="header-top">
      <div class="brand-title">
        <span>⚡ ضرغام CRM</span>
        <span class="brand-tag">Outreach Kit</span>
      </div>
      <button class="add-lead-btn" onclick="openAddModal()">
        <span>➕ إضافة ليد جديدة</span>
      </button>
    </div>

    <!-- Live Counter Grid -->
    <div class="counters-grid">
      <div class="counter-card" id="card-all" onclick="setFilter('all')">
        <div class="num num-total" id="stat-total">0</div>
        <div class="label">إجمالي الليڈز</div>
      </div>
      <div class="counter-card active" id="card-unsent" onclick="setFilter('unsent')">
        <div class="num num-unsent" id="stat-unsent">0</div>
        <div class="label">لم يُرسل (المتبقي)</div>
      </div>
      <div class="counter-card" id="card-sent" onclick="setFilter('sent')">
        <div class="num num-sent" id="stat-sent">0</div>
        <div class="label">تم الإرسال</div>
      </div>
      <div class="counter-card" id="card-replied" onclick="setFilter('replied')">
        <div class="num num-replied" id="stat-replied">0</div>
        <div class="label">تم الرد</div>
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
      <button class="pill-btn active" id="pill-priority" onclick="setFilter('priority')">⚡ الأولوية: غير المرسل أولاً</button>
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
        <h3 class="modal-title">إضافة ليد جديدة (New Lead)</h3>
        <button class="modal-close" onclick="closeAddModal()">&times;</button>
      </div>

      <form id="add-lead-form" onsubmit="handleFormSubmit(event)">
        <div class="form-group">
          <label class="form-label">اسم المكتب / الشركة العقارية *</label>
          <input type="text" class="form-input" id="new-name" placeholder="مثال: مكتب قمة الرياض للعقارات" required>
        </div>

        <div class="form-group">
          <label class="form-label">رقم الجوال / الهاتف *</label>
          <input type="tel" class="form-input" id="new-phone" placeholder="مثال: 0551234567 أو 966551234567" required>
        </div>

        <div class="form-group">
          <label class="form-label">المدينة</label>
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
          <label class="form-label">الحي / العنوان (اختياري)</label>
          <input type="text" class="form-input" id="new-address" placeholder="مثال: حي الياسمين">
        </div>

        <button type="submit" class="btn-submit-lead">💾 حفظ الليد وإضافتها للأعلى</button>
      </form>
    </div>
  </div>

  <!-- Toast Notification -->
  <div class="toast" id="toast">تم النسخ بنجاح!</div>

  <script>
    const initialLeads = LEADS_PLACEHOLDER;

    const STORAGE_KEY = 'zargham_leads_v2';
    let leadsData = [];
    let currentFilter = 'priority';
    let searchQuery = '';
    let selectedCity = 'all';

    function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const existingPhones = new Set(parsed.map(l => formatWaNumber(l.phone || '')));
          const newLeads = initialLeads.filter(l => !existingPhones.has(formatWaNumber(l.phone || '')));
          if (newLeads.length > 0) {
            leadsData = [...newLeads, ...parsed];
            saveToStorage();
          } else {
            leadsData = parsed;
          }
        } catch(e) {
          leadsData = [...initialLeads];
          saveToStorage();
        }
      } else {
        leadsData = [...initialLeads];
        saveToStorage();
      }
      render();
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

    function getMessageForLead(leadName) {
      return "Hi " + leadName + ", I'm Zargham, a website developer.\\n\\nI came across your real estate company and wanted to introduce myself. I build professional websites that help real estate businesses showcase properties and make it easier for clients to enquire.\\n\\nWould you be open to seeing a quick example of my work?";
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
      if (lead) {
        lead.status = newStatus;
        saveToStorage();
        updateStats();
        render();
        showToast(newStatus === 'sent' ? '✅ تم التحديد: تم الإرسال' : (newStatus === 'replied' ? '💬 تم التحديد: تم الرد' : '⏳ تم التحديد: لم يُرسل'));
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

      const newLead = {
        id: Date.now(),
        name: name,
        english_name: '',
        phone: phone,
        wa_phone: formatWaNumber(phone),
        address: address,
        city: city,
        category: 'ليد جديدة مضافة',
        license: 'مضاف حديثاً',
        maps_url: 'https://www.google.com/maps/search/' + encodeURIComponent(name + ' ' + city),
        status: 'unsent',
        created_at: Date.now(),
        is_user_added: true
      };

      // Put at the very TOP
      leadsData.unshift(newLead);
      saveToStorage();
      
      document.getElementById('add-lead-form').reset();
      closeAddModal();
      showToast('🎉 تم إضافة الليد في أعلى القائمة!');
      render();
    }

    function copyMessage(textId) {
      const el = document.getElementById(textId);
      if (el) {
        navigator.clipboard.writeText(el.innerText).then(() => {
          showToast('📋 تم نسخ الرسالة بنجاح!');
        });
      }
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.classList.add('show');
      setTimeout(() => {
        t.classList.remove('show');
      }, 2200);
    }

    function render() {
      updateStats();

      let filtered = [...leadsData];

      if (selectedCity !== 'all') {
        filtered = filtered.filter(l => l.city.includes(selectedCity) || l.address.includes(selectedCity));
      }

      if (searchQuery) {
        filtered = filtered.filter(l => 
          l.name.toLowerCase().includes(searchQuery) || 
          l.phone.includes(searchQuery) || 
          l.address.toLowerCase().includes(searchQuery)
        );
      }

      // Sorting rules requested by User:
      // 1) Unsent leads stay on top, Sent leads move below
      // 2) New leads stay on top
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
        listContainer.innerHTML = '<div class="empty-state"><h3>لا توجد نتائج مطابقة</h3><p>جرّب تغيير خيارات البحث أو الفلتر.</p></div>';
        return;
      }

      let html = '';
      filtered.forEach((lead, idx) => {
        const msg = getMessageForLead(lead.name);
        const encodedMsg = encodeURIComponent(msg);
        const waNumber = lead.wa_phone || formatWaNumber(lead.phone);
        const waLink = "https://wa.me/" + waNumber + "?text=" + encodedMsg;
        const textElemId = 'msg-txt-' + lead.id;

        const isUnsent = lead.status === 'unsent';
        const isSent = lead.status === 'sent';
        const isReplied = lead.status === 'replied';

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
        html += '    <span class="tag-badge tag-city">📍 ' + lead.city + '</span>';
        html += '    <span class="tag-badge tag-license">' + (lead.license || 'مرخص') + '</span>';
        if (lead.is_user_added) {
          html += '  <span class="tag-badge tag-new">⭐ جديد</span>';
        }
        html += '  </div>';

        html += '  <div class="biz-address"><span>' + lead.address + '</span></div>';

        html += '  <div class="action-buttons">';
        html += '    <a href="' + waLink + '" target="_blank" class="btn-wa-action" onclick="setLeadStatus(' + lead.id + ', \\'sent\\')">';
        html += '      <span>💬 إرسال واتساب (مجهّز)</span>';
        html += '    </a>';
        html += '    <a href="' + lead.maps_url + '" target="_blank" class="btn-map-action">🗺️ الخريطة</a>';
        html += '  </div>';

        html += '  <div class="message-container">';
        html += '    <div class="message-header">';
        html += '      <span>📝 نص الرسالة بالاسم:</span>';
        html += '      <button type="button" class="btn-copy" onclick="copyMessage(\\'' + textElemId + '\\')">نسخ</button>';
        html += '    </div>';
        html += '    <div class="message-text" id="' + textElemId + '">' + msg.replace(/\\n/g, '<br>') + '</div>';
        html += '  </div>';

        html += '  <div class="status-selector">';
        html += '    <button type="button" class="status-tab ' + (isUnsent ? 'active-unsent' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'unsent\\')">⏳ لم يُرسل</button>';
        html += '    <button type="button" class="status-tab ' + (isSent ? 'active-sent' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'sent\\')">✅ تم الإرسال</button>';
        html += '    <button type="button" class="status-tab ' + (isReplied ? 'active-replied' : '') + '" onclick="setLeadStatus(' + lead.id + ', \\'replied\\')">💬 تم الرد</button>';
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
fs.writeFileSync(path.join(__dirname, 'leads_report.html'), finalHtml, 'utf8');
console.log('Mobile-First CRM leads_report.html written successfully!');

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
