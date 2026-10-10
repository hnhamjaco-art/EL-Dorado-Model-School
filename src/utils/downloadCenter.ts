import {
  StudentRecord,
  PaymentRecord,
  NoticeRecord,
  ResultRecord,
  calculateLetterGrade,
} from '../data/initialData';

export function triggerFileDownload(
  content: string,
  filename: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * 1. Download Standalone Portable Offline/Online School App (.html)
 * Works 100% offline on Mobile & Desktop and includes live data + cloud link
 */
export function downloadStandaloneSchoolApp(params: {
  students: StudentRecord[];
  payments: PaymentRecord[];
  notices: NoticeRecord[];
  results: ResultRecord[];
  appUrl?: string;
}): void {
  const liveUrl = params.appUrl || window.location.origin;
  const dateStr = new Date().toISOString().slice(0, 10);
  const embeddedData = JSON.stringify({
    students: params.students,
    payments: params.payments,
    notices: params.notices,
    results: params.results,
    exportedAt: new Date().toLocaleString('bn-BD'),
    liveUrl,
  }).replace(/</g, '\\u003c');

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>এল ডরাডো মডেল স্কুল — পোর্টেবল অ্যাপ (El Dorado Model School)</title>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@600;700&family=JetBrains+Mono:wght@500;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --crimson: #b91c1c;
      --crimson-dark: #991b1b;
      --emerald: #047857;
      --bg: #f8fafc;
      --card: #ffffff;
      --text: #0f172a;
      --muted: #64748b;
      --border: #e2e8f0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding-bottom: 60px;
    }
    header {
      background: var(--card);
      border-bottom: 2px solid var(--crimson);
      padding: 14px 20px;
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.04);
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand h1 { font-family: 'Anek Bangla', sans-serif; font-size: 20px; color: var(--text); }
    .brand p { font-size: 12px; color: var(--muted); }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      transition: 0.15s;
    }
    .btn-primary { background: var(--crimson); color: #fff; }
    .btn-primary:hover { background: var(--crimson-dark); }
    .btn-outline { background: #fff; color: var(--text); border-color: var(--border); }
    .btn-emerald { background: var(--emerald); color: #fff; }
    .container { max-width: 1200px; margin: 24px auto; padding: 0 16px; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .stat-label { font-size: 12px; color: var(--muted); }
    .stat-val { font-family: 'JetBrains Mono', monospace; font-size: 24px; font-weight: 700; margin-top: 4px; }
    .tabs { display: flex; gap: 8px; overflow-x: auto; margin-bottom: 20px; padding-bottom: 4px; }
    .tab-btn {
      padding: 9px 16px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #fff;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }
    .tab-btn.active { background: var(--crimson); color: #fff; border-color: var(--crimson); }
    .search-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }
    input, select {
      padding: 9px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      font-family: inherit;
    }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid var(--border); text-align: left; }
    th { background: #f1f5f9; font-weight: 600; color: #334155; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .due { color: var(--crimson); font-weight: 700; }
    .paid { color: var(--emerald); font-weight: 700; }
    @media print { .no-print { display: none !important; } body { background: #fff; } }
  </style>
</head>
<body>
  <header class="no-print">
    <div class="brand">
      <svg width="46" height="46" viewBox="0 0 240 240">
        <circle cx="120" cy="120" r="112" fill="#ffffff" stroke="#b91c1c" stroke-width="8"/>
        <circle cx="120" cy="120" r="72" fill="#ffffff" stroke="#b91c1c" stroke-width="4"/>
        <path d="M100 84 A20 20 0 0 1 140 84 Z" fill="#b91c1c"/>
        <text x="120" y="125" font-size="18" font-weight="bold" text-anchor="middle" fill="#0f172a">জ্ঞানই আলো</text>
        <text x="120" y="148" font-size="13" font-weight="bold" text-anchor="middle" fill="#b91c1c">স্থাপিত ২০০৯</text>
      </svg>
      <div>
        <h1>এল্ ডরাডো মডেল স্কুল (El Dorado Model School)</h1>
        <p>বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা · অফলাইন ও অনলাইন পোর্টেবল সংস্করণ</p>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a href="${liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">🌐 অনলাইন লাইভ সার্ভার খুলুন</a>
      <button onclick="window.print()" class="btn btn-outline">🖨️ প্রিন্ট / PDF সেভ</button>
    </div>
  </header>

  <div class="container">
    <div class="grid-4" id="metricsBox"></div>

    <div class="tabs no-print">
      <button class="tab-btn active" onclick="switchTab('students', this)">👨‍🎓 শিক্ষার্থী ও বেতন তালিকা</button>
      <button class="tab-btn" onclick="switchTab('add', this)">➕ নতুন শিক্ষার্থী যুক্ত করুন</button>
      <button class="tab-btn" onclick="switchTab('payments', this)">💳 পেমেন্ট ও মানি রিসিট</button>
      <button class="tab-btn" onclick="switchTab('results', this)">🏆 রেজাল্ট ও মার্কশিট</button>
      <button class="tab-btn" onclick="switchTab('notices', this)">📢 স্কুল নোটিশ বোর্ড</button>
    </div>

    <div id="tab-students" class="card">
      <div class="search-bar no-print">
        <input type="text" id="rollSearch" placeholder="রোল নম্বর বা নাম লিখে খুঁজুন..." oninput="renderStudents()" style="flex:1;min-width:220px;" />
        <button class="btn btn-emerald" onclick="exportCsv()">📥 এক্সেল (CSV) ডাউনলোড</button>
      </div>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>রোল নং</th>
              <th>শিক্ষার্থীর নাম</th>
              <th>শ্রেণি ও শাখা</th>
              <th>অভিভাবক ও মোবাইল</th>
              <th>মাসিক বেতন</th>
              <th>পরিশোধিত</th>
              <th>বকেয়া (Due)</th>
            </tr>
          </thead>
          <tbody id="studentRows"></tbody>
        </table>
      </div>
    </div>

    <div id="tab-add" class="card" style="display:none;">
      <h3 style="margin-bottom:12px;">নতুন শিক্ষার্থী ভর্তি (অফলাইন স্টোরেজে সংরক্ষিত হবে)</h3>
      <form onsubmit="addStudent(event)" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">
        <input id="fRoll" required placeholder="রোল নম্বর (যেমন: 101)" />
        <input id="fName" required placeholder="শিক্ষার্থীর নাম (বাংলায়)" />
        <input id="fClass" value="Class One" placeholder="শ্রেণি" />
        <input id="fGuardian" placeholder="অভিভাবকের নাম" />
        <input id="fPhone" placeholder="মোবাইল নম্বর" />
        <input id="fFee" type="number" placeholder="মাসিক বেতন (৳)" />
        <input id="fPaid" type="number" placeholder="পরিশোধিত (৳)" />
        <input id="fDue" type="number" placeholder="বকেয়া (৳)" />
        <button type="submit" class="btn btn-primary">✓ শিক্ষার্থী সেভ করুন</button>
      </form>
    </div>

    <div id="tab-payments" class="card" style="display:none;">
      <h3 style="margin-bottom:12px;">বিকাশ / নগদ / রকেট পেমেন্ট ও মানি রিসিট রেকর্ড</h3>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>TrxID</th>
              <th>রোল</th>
              <th>শিক্ষার্থীর নাম</th>
              <th>শ্রেণি</th>
              <th>মাস/বিবরণ</th>
              <th>মাধ্যম</th>
              <th>টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody id="paymentRows"></tbody>
        </table>
      </div>
    </div>

    <div id="tab-results" class="card" style="display:none;">
      <h3 style="margin-bottom:12px;">একাডেমিক রেজাল্ট ও জিপিএ তালিকা</h3>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>রোল</th>
              <th>শিক্ষার্থীর নাম</th>
              <th>শ্রেণি</th>
              <th>মোট নম্বর</th>
              <th>GPA</th>
              <th>গ্রেড</th>
              <th>মন্তব্য</th>
            </tr>
          </thead>
          <tbody id="resultRows"></tbody>
        </table>
      </div>
    </div>

    <div id="tab-notices" class="card" style="display:none;">
      <h3 style="margin-bottom:12px;">স্কুল নোটিশ বোর্ড</h3>
      <div id="noticeList"></div>
    </div>
  </div>

  <script>
    const INITIAL_SNAPSHOT = ${embeddedData};
    const STORAGE_KEY = 'edms_portable_app_v1';
    let state = INITIAL_SNAPSHOT;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.students) && parsed.students.length >= state.students.length) {
          state = parsed;
        }
      }
    } catch (e) {}

    function saveState() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function switchTab(id, btn) {
      ['students', 'add', 'payments', 'results', 'notices'].forEach(t => {
        document.getElementById('tab-' + t).style.display = (t === id) ? 'block' : 'none';
      });
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
    }

    function renderMetrics() {
      const total = state.students.length;
      const paid = state.students.reduce((s, x) => s + (Number(x.paidAmount) || 0), 0);
      const due = state.students.reduce((s, x) => s + (Number(x.dueAmount) || 0), 0);
      document.getElementById('metricsBox').innerHTML = \`
        <div class="card" style="margin:0"><div class="stat-label">মোট শিক্ষার্থী</div><div class="stat-val">\${total}</div></div>
        <div class="card" style="margin:0"><div class="stat-label">মোট আদায়কৃত বেতন</div><div class="stat-val paid">৳\${paid.toLocaleString()}</div></div>
        <div class="card" style="margin:0"><div class="stat-label">মোট বকেয়া বেতন</div><div class="stat-val due">৳\${due.toLocaleString()}</div></div>
        <div class="card" style="margin:0"><div class="stat-label">সর্বশেষ আপডেট</div><div class="stat-val" style="font-size:15px;margin-top:8px;">\${state.exportedAt}</div></div>
      \`;
    }

    function renderStudents() {
      const q = (document.getElementById('rollSearch').value || '').toLowerCase().trim();
      const list = state.students.filter(s =>
        !q ||
        String(s.rollNo).toLowerCase().includes(q) ||
        String(s.nameBn || '').toLowerCase().includes(q) ||
        String(s.nameEn || '').toLowerCase().includes(q) ||
        String(s.guardianPhone || '').toLowerCase().includes(q)
      );
      const tbody = document.getElementById('studentRows');
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#64748b;">কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি। "নতুন শিক্ষার্থী যুক্ত করুন" ট্যাব থেকে যুক্ত করুন।</td></tr>';
        return;
      }
      tbody.innerHTML = list.map(s => \`
        <tr>
          <td class="mono"><strong>\${s.rollNo}</strong></td>
          <td><strong>\${s.nameBn}</strong></td>
          <td>\${s.className} (\${s.section || 'A'})</td>
          <td>\${s.guardianName || '-'} <span class="mono" style="color:#64748b;font-size:12px;">\${s.guardianPhone || ''}</span></td>
          <td class="mono">৳\${Number(s.monthlyFee || 0).toLocaleString()}</td>
          <td class="mono paid">৳\${Number(s.paidAmount || 0).toLocaleString()}</td>
          <td class="mono due">৳\${Number(s.dueAmount || 0).toLocaleString()}</td>
        </tr>
      \`).join('');
    }

    function addStudent(e) {
      e.preventDefault();
      const st = {
        id: 'std-' + Date.now(),
        rollNo: document.getElementById('fRoll').value.trim(),
        nameBn: document.getElementById('fName').value.trim(),
        nameEn: document.getElementById('fName').value.trim(),
        className: document.getElementById('fClass').value.trim() || 'Class One',
        section: 'A',
        guardianName: document.getElementById('fGuardian').value.trim() || '-',
        guardianPhone: document.getElementById('fPhone').value.trim() || '-',
        monthlyFee: Number(document.getElementById('fFee').value) || 0,
        paidAmount: Number(document.getElementById('fPaid').value) || 0,
        dueAmount: Number(document.getElementById('fDue').value) || 0,
        attendanceRate: 100
      };
      state.students.push(st);
      saveState();
      renderMetrics();
      renderStudents();
      e.target.reset();
      switchTab('students', document.querySelector('.tab-btn'));
    }

    function renderOthers() {
      const pBody = document.getElementById('paymentRows');
      pBody.innerHTML = state.payments.length === 0
        ? '<tr><td colspan="7" style="text-align:center;padding:20px;">কোনো পেমেন্ট লেনদেন নেই</td></tr>'
        : state.payments.map(p => \`
          <tr>
            <td class="mono"><strong>\${p.transactionId}</strong></td>
            <td class="mono">\${p.rollNo}</td>
            <td>\${p.studentName}</td>
            <td>\${p.className}</td>
            <td>\${p.month}</td>
            <td style="text-transform:uppercase;font-weight:600;">\${p.method}</td>
            <td class="mono paid">৳\${Number(p.amount || 0).toLocaleString()}</td>
          </tr>
        \`).join('');

      const rBody = document.getElementById('resultRows');
      rBody.innerHTML = state.results.length === 0
        ? '<tr><td colspan="7" style="text-align:center;padding:20px;">কোনো রেজাল্ট কার্ড নেই</td></tr>'
        : state.results.map(r => \`
          <tr>
            <td class="mono"><strong>\${r.rollNo}</strong></td>
            <td>\${r.studentNameBn}</td>
            <td>\${r.className}</td>
            <td class="mono">\${r.totalMarks}/700</td>
            <td class="mono paid">\${Number(r.gpa || 0).toFixed(2)}</td>
            <td class="mono"><strong>\${r.grade}</strong></td>
            <td>\${r.teacherRemarksBn || ''}</td>
          </tr>
        \`).join('');

      const nList = document.getElementById('noticeList');
      nList.innerHTML = state.notices.map(n => \`
        <div style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <div style="font-size:12px;color:#b91c1c;font-weight:700;">\${n.dateStr} · \${String(n.category).toUpperCase()}</div>
          <h4 style="margin:4px 0;">\${n.titleBn}</h4>
          <p style="font-size:13px;color:#475569;">\${n.contentBn}</p>
        </div>
      \`).join('');
    }

    function exportCsv() {
      const headers = ['Roll No,Student Name,Class,Section,Guardian,Phone,Monthly Fee,Paid Amount,Due Amount'];
      const rows = state.students.map(s => [
        s.rollNo,
        '"' + (s.nameBn || '').replace(/"/g, '""') + '"',
        '"' + (s.className || '') + '"',
        s.section || 'A',
        '"' + (s.guardianName || '') + '"',
        s.guardianPhone || '',
        s.monthlyFee || 0,
        s.paidAmount || 0,
        s.dueAmount || 0
      ].join(','));
      const csv = '\\uFEFF' + headers.concat(rows).join('\\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'el-dorado-students-fees.csv';
      a.click();
    }

    renderMetrics();
    renderStudents();
    renderOthers();
  </script>
</body>
</html>`;

  triggerFileDownload(
    html,
    `El-Dorado-Model-School-App-${dateStr}.html`,
    'text/html;charset=utf-8'
  );
}

/**
 * 2. Download Students & Tuition Fee Sheet as Excel-compatible CSV (UTF-8 with BOM)
 */
export function downloadStudentsFeeCsv(students: StudentRecord[]): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const header = [
    'Roll No (রোল)',
    'Student Name Bangla (শিক্ষার্থীর নাম)',
    'Student Name English',
    'Class (শ্রেণি)',
    'Section (শাখা)',
    'Guardian Name (অভিভাবক)',
    'Guardian Phone (মোবাইল)',
    'Monthly Fee BDT (মাসিক বেতন)',
    'Total Fee BDT (মোট নির্ধারিত)',
    'Paid Amount BDT (পরিশোধিত)',
    'Due Amount BDT (বকেয়া)',
    'Attendance % (উপস্থিতি)',
    'GPA (জিপিএ)',
  ].join(',');

  const rows = students.map((st) =>
    [
      `"${st.rollNo}"`,
      `"${(st.nameBn || '').replace(/"/g, '""')}"`,
      `"${(st.nameEn || '').replace(/"/g, '""')}"`,
      `"${st.className}"`,
      `"${st.section}"`,
      `"${(st.guardianName || '').replace(/"/g, '""')}"`,
      `"${st.guardianPhone}"`,
      st.monthlyFee,
      st.totalFee,
      st.paidAmount,
      st.dueAmount,
      st.attendanceRate,
      st.gpa,
    ].join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  triggerFileDownload(
    csvContent,
    `El-Dorado-Students-Tuition-Fees-${dateStr}.csv`,
    'text/csv;charset=utf-8'
  );
}

/**
 * 3. Download Payment & Digital QR Receipt Ledger as CSV
 */
export function downloadPaymentsCsv(payments: PaymentRecord[]): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const header = [
    'Transaction ID (TrxID)',
    'Date (তারিখ)',
    'Roll No (রোল)',
    'Student Name (শিক্ষার্থীর নাম)',
    'Class (শ্রেণি)',
    'Description / Month (মাসের বিবরণ)',
    'Gateway (মাধ্যম)',
    'Wallet Number (মোবাইল নম্বর)',
    'Amount Paid BDT (টাকার পরিমাণ)',
    'Verification Code',
  ].join(',');

  const rows = payments.map((p) =>
    [
      `"${p.transactionId}"`,
      `"${p.dateStr}"`,
      `"${p.rollNo}"`,
      `"${(p.studentName || '').replace(/"/g, '""')}"`,
      `"${p.className}"`,
      `"${(p.month || '').replace(/"/g, '""')}"`,
      `"${p.method.toUpperCase()}"`,
      `"${p.walletNumber}"`,
      p.amount,
      `"EDMS-VERIFIED-${p.transactionId}-R${p.rollNo}-BDT${p.amount}"`,
    ].join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  triggerFileDownload(
    csvContent,
    `El-Dorado-Payment-Receipts-${dateStr}.csv`,
    'text/csv;charset=utf-8'
  );
}

/**
 * 4. Download Results & Academic Marksheet as CSV
 */
export function downloadResultsCsv(results: ResultRecord[]): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const header = [
    'Roll No (রোল)',
    'Student Name (শিক্ষার্থীর নাম)',
    'Class (শ্রেণি)',
    'Bangla (বাংলা)',
    'English (ইংরেজি)',
    'Math (গণিত)',
    'Science (বিজ্ঞান)',
    'BGS (বাওবি)',
    'Religion (ধর্ম)',
    'ICT (আইসিটি)',
    'Total Marks (মোট নম্বর)',
    'GPA (জিপিএ)',
    'Letter Grade (গ্রেড)',
    'Teacher Remarks (মন্তব্য)',
  ].join(',');

  const rows = results.map((r) =>
    [
      `"${r.rollNo}"`,
      `"${(r.studentNameBn || '').replace(/"/g, '""')}"`,
      `"${r.className}"`,
      r.bangla,
      r.english,
      r.math,
      r.science,
      r.bgs,
      r.religion,
      r.ict,
      r.totalMarks,
      r.gpa.toFixed(2),
      `"${r.grade}"`,
      `"${(r.teacherRemarksBn || '').replace(/"/g, '""')}"`,
    ].join(',')
  );

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  triggerFileDownload(
    csvContent,
    `El-Dorado-Result-Marksheets-${dateStr}.csv`,
    'text/csv;charset=utf-8'
  );
}

/**
 * 5. Download Daily Attendance Register as CSV
 */
export function downloadAttendanceCsv(
  students: StudentRecord[],
  attendanceMap: Record<string, 'present' | 'absent' | 'late' | 'leave'>,
  attendanceDate: string
): void {
  const header = [
    'Date (তারিখ)',
    'Roll No (রোল)',
    'Student Name (শিক্ষার্থীর নাম)',
    'Class (শ্রেণি)',
    'Section (শাখা)',
    'Daily Status (আজকের হাজিরা)',
    'Cumulative Attendance % (মোট উপস্থিতির হার)',
    'Guardian Phone (মোবাইল)',
  ].join(',');

  const rows = students.map((st) => {
    const status = attendanceMap[st.id] || 'present';
    return [
      `"${attendanceDate}"`,
      `"${st.rollNo}"`,
      `"${(st.nameBn || '').replace(/"/g, '""')}"`,
      `"${st.className}"`,
      `"${st.section}"`,
      `"${status.toUpperCase()}"`,
      `${st.attendanceRate}%`,
      `"${st.guardianPhone}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [header, ...rows].join('\n');
  triggerFileDownload(
    csvContent,
    `El-Dorado-Attendance-${attendanceDate}.csv`,
    'text/csv;charset=utf-8'
  );
}

/**
 * 6. Download Individual Official QR Money Receipt as Standalone Printable HTML
 */
export function downloadSingleQrReceiptHtml(receipt: PaymentRecord): void {
  const verifySignature = `EDMS-VERIFIED-${receipt.transactionId}-R${receipt.rollNo}-BDT${receipt.amount}`;
  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>মানি রিসিট - রোল #${receipt.rollNo} (${receipt.transactionId})</title>
  <style>
    body { font-family: 'Noto Sans Bengali', Arial, sans-serif; background: #f8fafc; padding: 30px; color: #0f172a; }
    .receipt-box { max-width: 640px; margin: 0 auto; background: #fff; border: 2px solid #047857; border-radius: 14px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
    .school-title { font-size: 20px; font-weight: 800; color: #b91c1c; margin: 0; }
    .badge { background: #ecfdf5; color: #047857; border: 1px solid #6ee7b7; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 12px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; }
    .total { font-size: 18px; font-weight: 800; color: #047857; border-bottom: none; padding-top: 14px; }
    .sig { margin-top: 20px; background: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 12px; word-break: break-all; }
    .print-btn { margin-bottom: 16px; background: #047857; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    @media print { .print-btn { display: none; } body { background: #fff; padding: 0; } }
  </style>
</head>
<body>
  <div style="max-width:640px;margin:0 auto;text-align:right;">
    <button class="print-btn" onclick="window.print()">🖨️ প্রিন্ট বা PDF সেভ করুন</button>
  </div>
  <div class="receipt-box">
    <div class="header">
      <div>
        <h1 class="school-title">এল্ ডরাডো মডেল স্কুল (El Dorado Model School)</h1>
        <div style="font-size:12px;color:#475569;margin-top:4px;">জ্ঞানই আলো · স্থাপিতঃ ২০০৯ খ্রীঃ · বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা</div>
      </div>
      <div class="badge">✓ VERIFIED PAID</div>
    </div>
    <div class="row"><span>ট্রানজেকশন আইডি (TrxID):</span><strong>${receipt.transactionId}</strong></div>
    <div class="row"><span>তারিখ (Date):</span><strong>${receipt.dateStr}</strong></div>
    <div class="row"><span>শিক্ষার্থীর রোল নম্বর (Roll No):</span><strong>#${receipt.rollNo}</strong></div>
    <div class="row"><span>শিক্ষার্থীর নাম (Student Name):</span><strong>${receipt.studentName}</strong></div>
    <div class="row"><span>শ্রেণি (Class):</span><strong>${receipt.className}</strong></div>
    <div class="row"><span>মাসের বিবরণ (Description):</span><strong>${receipt.month}</strong></div>
    <div class="row"><span>পেমেন্ট মাধ্যম (Gateway):</span><strong>${receipt.method.toUpperCase()} (${receipt.walletNumber})</strong></div>
    <div class="row total"><span>পরিশোধিত মোট টাকা (Total Paid):</span><span>৳${receipt.amount.toLocaleString()}</span></div>
    <div class="sig">Digital Verification Signature: ${verifySignature}</div>
  </div>
</body>
</html>`;

  triggerFileDownload(
    html,
    `Money-Receipt-Roll-${receipt.rollNo}-${receipt.transactionId}.html`,
    'text/html;charset=utf-8'
  );
}

/**
 * 7. Download Individual Student Result Card / Marksheet as Standalone Printable HTML
 */
export function downloadSingleResultCardHtml(
  result: ResultRecord,
  student?: StudentRecord
): void {
  const subjects = [
    { name: 'বাংলা (Bangla 1st & 2nd Paper)', marks: result.bangla },
    { name: 'ইংরেজি (English 1st & 2nd Paper)', marks: result.english },
    { name: 'সাধারণ গণিত (General Mathematics)', marks: result.math },
    { name: 'সাধারণ বিজ্ঞান (General Science)', marks: result.science },
    { name: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)', marks: result.bgs },
    { name: 'ধর্ম ও নৈতিক শিক্ষা (Religion)', marks: result.religion },
    { name: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)', marks: result.ict },
  ];

  const subjectRowsHtml = subjects
    .map((sub) => {
      const g = calculateLetterGrade(sub.marks);
      return `<tr>
        <td>${sub.name}</td>
        <td style="text-align:right;">100</td>
        <td style="text-align:right;font-weight:700;">${sub.marks}</td>
        <td style="text-align:right;font-weight:700;">${g.grade}</td>
        <td style="text-align:right;color:#047857;font-weight:700;">${g.point.toFixed(2)}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <title>রেজাল্ট কার্ড - রোল #${result.rollNo} (${result.studentNameBn})</title>
  <style>
    body { font-family: 'Noto Sans Bengali', Arial, sans-serif; background: #f8fafc; padding: 24px; color: #0f172a; }
    .sheet { max-width: 780px; margin: 0 auto; background: #fff; border: 2px solid #b91c1c; border-radius: 14px; padding: 32px; }
    .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #b91c1c; padding-bottom: 16px; margin-bottom: 20px; }
    h1 { font-size: 22px; color: #b91c1c; margin: 0; }
    .gpa-box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 18px; text-align: center; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
    th, td { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { background: #f1f5f9; }
    .print-btn { margin-bottom: 14px; background: #b91c1c; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    @media print { .print-btn { display: none; } body { background: #fff; padding: 0; } }
  </style>
</head>
<body>
  <div style="max-width:780px;margin:0 auto;text-align:right;">
    <button class="print-btn" onclick="window.print()">🖨️ প্রিন্ট বা PDF সেভ করুন</button>
  </div>
  <div class="sheet">
    <div class="top">
      <div>
        <h1>এল্ ডরাডো মডেল স্কুল (El Dorado Model School)</h1>
        <div style="font-size:12px;color:#475569;margin-top:4px;">জ্ঞানই আলো · স্থাপিতঃ ২০০৯ খ্রীঃ · বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা</div>
        <div style="font-size:13px;font-weight:700;color:#b91c1c;margin-top:6px;">${result.examTitle}</div>
      </div>
      <div class="gpa-box">
        <div style="font-size:11px;color:#64748b;">প্রাপ্ত জিপিএ (GPA)</div>
        <div style="font-size:24px;font-weight:800;color:#047857;">${result.gpa.toFixed(2)}</div>
        <div style="font-size:12px;font-weight:700;">গ্রেড: ${result.grade}</div>
      </div>
    </div>

    <div class="info-grid">
      <div><span style="color:#64748b;display:block;">শিক্ষার্থীর নাম</span><strong>${result.studentNameBn}</strong></div>
      <div><span style="color:#64748b;display:block;">রোল নম্বর</span><strong>#${result.rollNo}</strong></div>
      <div><span style="color:#64748b;display:block;">শ্রেণি ও শাখা</span><strong>${result.className} ${student ? `(${student.section})` : ''}</strong></div>
      <div><span style="color:#64748b;display:block;">মোট প্রাপ্ত নম্বর</span><strong>${result.totalMarks} / 700</strong></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>বিষয়ের নাম (Subject)</th>
          <th style="text-align:right;">পূর্ণমান</th>
          <th style="text-align:right;">প্রাপ্ত নম্বর</th>
          <th style="text-align:right;">লেটার গ্রেড</th>
          <th style="text-align:right;">গ্রেড পয়েন্ট</th>
        </tr>
      </thead>
      <tbody>${subjectRowsHtml}</tbody>
      <tfoot>
        <tr style="font-weight:800;border-top:2px solid #334155;">
          <td>সর্বমোট ও চূড়ান্ত ফলাফল (Grand Total)</td>
          <td style="text-align:right;">700</td>
          <td style="text-align:right;">${result.totalMarks}</td>
          <td style="text-align:right;">${result.grade}</td>
          <td style="text-align:right;color:#047857;">GPA ${result.gpa.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="background:#f8fafc;padding:12px;border-radius:8px;font-size:13px;margin-bottom:36px;">
      <strong>শ্রেণি শিক্ষকের মন্তব্য:</strong> ${result.teacherRemarksBn}
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:center;font-size:12px;color:#475569;padding-top:24px;">
      <div style="border-top:1px solid #94a3b8;padding-top:6px;">শ্রেণি শিক্ষকের স্বাক্ষর</div>
      <div style="border-top:1px solid #94a3b8;padding-top:6px;">অভিভাবকের স্বাক্ষর</div>
      <div style="border-top:1px solid #94a3b8;padding-top:6px;">প্রধান শিক্ষকের স্বাক্ষর</div>
    </div>
  </div>
</body>
</html>`;

  triggerFileDownload(
    html,
    `Result-Card-Roll-${result.rollNo}-${result.studentNameEn.replace(/\s+/g, '-')}.html`,
    'text/html;charset=utf-8'
  );
}

/**
 * 8. Download Desktop / Mobile Quick Launch Shortcut (.url)
 */
export function downloadDesktopShortcut(appUrl?: string): void {
  const targetUrl = appUrl || window.location.origin;
  const shortcutContent = `[InternetShortcut]\r\nURL=${targetUrl}\r\nIconIndex=0\r\n`;
  triggerFileDownload(
    shortcutContent,
    'El-Dorado-Model-School-Online.url',
    'application/internet-shortcut'
  );
}

/**
 * 9. Download Complete JSON Database Package (.json) for Instant Backup & Restore
 */
export function downloadFullDatabaseJson(params: {
  students: StudentRecord[];
  payments: PaymentRecord[];
  notices: NoticeRecord[];
  results: ResultRecord[];
  attendanceMap: Record<string, 'present' | 'absent' | 'late' | 'leave'>;
}): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const payload = JSON.stringify(
    {
      school: 'El Dorado Model School (এল ডরাডো মডেল স্কুল)',
      established: 2009,
      version: '2.0',
      exportedAt: new Date().toISOString(),
      data: params,
    },
    null,
    2
  );
  triggerFileDownload(
    payload,
    `El-Dorado-Full-Database-${dateStr}.json`,
    'application/json;charset=utf-8'
  );
}
