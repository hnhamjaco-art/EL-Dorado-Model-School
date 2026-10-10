import React, { useState } from 'react';
import {
  UserPlus,
  Table,
  Upload,
  Download,
  Edit3,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  Save,
  FileSpreadsheet,
} from 'lucide-react';
import { StudentRecord, SCHOOL_CLASSES } from '../data/initialData';

interface AdmissionBulkManagerProps {
  students: StudentRecord[];
  lang: 'bn' | 'en';
  onAddSingleStudent: (student: Omit<StudentRecord, 'id' | 'authorId'>) => Promise<void>;
  onAddBulkStudents: (studentsList: Omit<StudentRecord, 'id' | 'authorId'>[]) => Promise<void>;
  onUpdateStudent: (student: StudentRecord) => Promise<void>;
  onDeleteStudent: (studentId: string) => Promise<void>;
  onClearAllStudents: () => Promise<void>;
}

interface GridRow {
  rollNo: string;
  nameBn: string;
  guardianName: string;
  guardianPhone: string;
  monthlyFee: string;
  dueAmount: string;
}

export const AdmissionBulkManager: React.FC<AdmissionBulkManagerProps> = ({
  students,
  lang,
  onAddSingleStudent,
  onAddBulkStudents,
  onUpdateStudent,
  onDeleteStudent,
  onClearAllStudents,
}) => {
  const [mode, setMode] = useState<'single' | 'grid' | 'bulk' | 'manage'>('single');

  // 1. Single Admission State (No hardcoded money amounts)
  const [singleForm, setSingleForm] = useState({
    rollNo: '',
    nameBn: '',
    nameEn: '',
    className: 'Play',
    customClass: '',
    section: 'A',
    guardianName: '',
    guardianPhone: '',
    monthlyFee: '',
    totalFee: '',
    paidAmount: '',
    dueAmount: '',
  });

  // 2. Multi-Row Rapid Spreadsheet Grid State
  const [gridClass, setGridClass] = useState<string>('Class One');
  const [gridSection, setGridSection] = useState<string>('A');
  const [gridRows, setGridRows] = useState<GridRow[]>(() =>
    Array.from({ length: 10 }, (_, idx) => ({
      rollNo: String(idx + 1),
      nameBn: '',
      guardianName: '',
      guardianPhone: '',
      monthlyFee: '',
      dueAmount: '',
    }))
  );

  // 3. Copy-Paste / Excel CSV Bulk Import State
  const [bulkClass, setBulkClass] = useState<string>('Class One');
  const [bulkSection, setBulkSection] = useState<string>('A');
  const [bulkText, setBulkText] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);

  // 4. Inline Edit Student Modal State & CSV Export Options
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [manageClassFilter, setManageClassFilter] = useState<string>('all');
  const [manageSearch, setManageSearch] = useState<string>('');
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [exportClassScope, setExportClassScope] = useState<string>('all');
  const [exportFeeScope, setExportFeeScope] = useState<'all' | 'due_only' | 'paid_only'>('all');
  const [csvCopiedFeedback, setCsvCopiedFeedback] = useState<boolean>(false);

  // Handle Single New Admission
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = singleForm.rollNo.trim().replace(/[^a-zA-Z0-9_\\-]/g, '');
    if (!cleanRoll || !singleForm.nameBn.trim()) return;

    const finalClass =
      singleForm.className === 'CUSTOM' && singleForm.customClass.trim()
        ? singleForm.customClass.trim()
        : singleForm.className;

    const monthly = Number(singleForm.monthlyFee) || 0;
    const total = Number(singleForm.totalFee) || 0;
    const paid = Number(singleForm.paidAmount) || 0;
    const due =
      singleForm.dueAmount !== ''
        ? Math.max(0, Number(singleForm.dueAmount) || 0)
        : Math.max(0, total - paid);

    await onAddSingleStudent({
      rollNo: cleanRoll,
      nameBn: singleForm.nameBn.trim(),
      nameEn: singleForm.nameEn.trim() || singleForm.nameBn.trim(),
      className: finalClass,
      section: singleForm.section.trim() || 'A',
      guardianName: singleForm.guardianName.trim() || '-',
      guardianPhone: singleForm.guardianPhone.replace(/[^0-9+\\-]/g, '') || '01700-000000',
      monthlyFee: monthly,
      totalFee: total,
      paidAmount: paid,
      dueAmount: due,
      attendanceRate: 100,
      gpa: 0,
      meritPosition: students.length + 1,
      status: 'active',
    });

    setSingleForm({
      ...singleForm,
      rollNo: '',
      nameBn: '',
      nameEn: '',
      guardianName: '',
      guardianPhone: '',
      monthlyFee: '',
      totalFee: '',
      paidAmount: '',
      dueAmount: '',
    });
  };

  // Handle Rapid Grid Save
  const handleSaveGridRows = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = gridRows.filter((r) => r.rollNo.trim() && r.nameBn.trim());
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const records: Omit<StudentRecord, 'id' | 'authorId'>[] = validRows.map((r, i) => {
        const cleanRoll = r.rollNo.trim().replace(/[^a-zA-Z0-9_\\-]/g, '') || String(i + 1);
        const monthly = Number(r.monthlyFee) || 0;
        const due = Number(r.dueAmount) || 0;
        return {
          rollNo: cleanRoll,
          nameBn: r.nameBn.trim(),
          nameEn: r.nameBn.trim(),
          className: gridClass,
          section: gridSection.trim() || 'A',
          guardianName: r.guardianName.trim() || '-',
          guardianPhone: r.guardianPhone.replace(/[^0-9+\\-]/g, '') || '01700-000000',
          monthlyFee: monthly,
          totalFee: due,
          paidAmount: 0,
          dueAmount: due,
          attendanceRate: 100,
          gpa: 0,
          meritPosition: students.length + i + 1,
          status: 'active',
        };
      });

      await onAddBulkStudents(records);

      // Reset grid for next batch
      setGridRows(
        Array.from({ length: 10 }, (_, idx) => ({
          rollNo: String(idx + 1),
          nameBn: '',
          guardianName: '',
          guardianPhone: '',
          monthlyFee: '',
          dueAmount: '',
        }))
      );
    } finally {
      setImporting(false);
    }
  };

  const addMoreGridRows = (count: number) => {
    setGridRows((prev) => {
      const lastRoll = Number(prev[prev.length - 1]?.rollNo) || prev.length;
      const extra: GridRow[] = Array.from({ length: count }, (_, idx) => ({
        rollNo: String(lastRoll + idx + 1),
        nameBn: '',
        guardianName: '',
        guardianPhone: '',
        monthlyFee: '',
        dueAmount: '',
      }));
      return [...prev, ...extra];
    });
  };

  // Parse CSV or Copy-Paste Text for 600+ Students
  const parseAndImportText = async (rawText: string) => {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    const parsedStudents: Omit<StudentRecord, 'id' | 'authorId'>[] = [];

    lines.forEach((line, idx) => {
      // Skip header row if detected
      const lower = line.toLowerCase();
      if (
        idx === 0 &&
        (lower.includes('roll') || lower.includes('রোল') || lower.includes('name'))
      ) {
        return;
      }

      // Split CSV/TSV line respecting quoted fields
      const parts = line
        .split(/[\t,|]+/)
        .map((p) => p.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      if (parts.length === 1) {
        // Only student name provided on each line -> auto-assign roll number
        parsedStudents.push({
          rollNo: String(students.length + parsedStudents.length + 1),
          nameBn: parts[0],
          nameEn: parts[0],
          className: bulkClass,
          section: bulkSection || 'A',
          guardianName: '-',
          guardianPhone: '01700-000000',
          monthlyFee: 0,
          totalFee: 0,
          paidAmount: 0,
          dueAmount: 0,
          attendanceRate: 100,
          gpa: 0,
          meritPosition: students.length + parsedStudents.length + 1,
          status: 'active',
        });
      } else if (parts.length >= 11) {
        // Full exported backup CSV row: Roll,NameBn,NameEn,Class,Section,GuardianName,GuardianPhone,MonthlyFee,TotalFee,PaidAmount,DueAmount,AttendanceRate,GPA...
        const cleanRoll =
          parts[0].replace(/[^a-zA-Z0-9_\\-]/g, '') ||
          String(students.length + parsedStudents.length + 1);
        const nameBn = parts[1] || `Student ${cleanRoll}`;
        const nameEn = parts[2] || nameBn;
        const className = parts[3] || bulkClass;
        const section = parts[4] || bulkSection || 'A';
        const guardianName = parts[5] || '-';
        const guardianPhone =
          (parts[6] || '').replace(/[^0-9+\\-]/g, '') || '01700-000000';
        const monthlyFee = Number(parts[7]) || 0;
        const totalFee = Number(parts[8]) || 0;
        const paidAmount = Number(parts[9]) || 0;
        const dueAmount = Number(parts[10]) || 0;
        const attendanceRate = parts[11] !== undefined ? Number(parts[11]) || 100 : 100;
        const gpa = parts[12] !== undefined ? Number(parts[12]) || 0 : 0;

        parsedStudents.push({
          rollNo: cleanRoll,
          nameBn,
          nameEn,
          className,
          section,
          guardianName,
          guardianPhone,
          monthlyFee,
          totalFee,
          paidAmount,
          dueAmount,
          attendanceRate: Math.min(100, Math.max(0, attendanceRate)),
          gpa: Math.min(5, Math.max(0, gpa)),
          meritPosition: students.length + parsedStudents.length + 1,
          status: 'active',
        });
      } else if (parts.length >= 2) {
        const cleanRoll =
          parts[0].replace(/[^a-zA-Z0-9_\\-]/g, '') ||
          String(students.length + parsedStudents.length + 1);
        const nameBn = parts[1] || `Student ${cleanRoll}`;
        const className = parts[2] || bulkClass;
        const section = parts[3] || bulkSection || 'A';
        const guardianName = parts[4] || '-';
        const guardianPhone =
          (parts[5] || '').replace(/[^0-9+\\-]/g, '') || '01700-000000';
        const monthlyFee = Number(parts[6]) || 0;
        const dueAmount = Number(parts[7]) || 0;

        parsedStudents.push({
          rollNo: cleanRoll,
          nameBn,
          nameEn: nameBn,
          className,
          section,
          guardianName,
          guardianPhone,
          monthlyFee,
          totalFee: dueAmount,
          paidAmount: 0,
          dueAmount,
          attendanceRate: 100,
          gpa: 0,
          meritPosition: students.length + parsedStudents.length + 1,
          status: 'active',
        });
      }
    });

    if (parsedStudents.length > 0) {
      setImporting(true);
      try {
        await onAddBulkStudents(parsedStudents);
        setBulkText('');
      } finally {
        setImporting(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        await parseAndImportText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadSampleCSV = () => {
    const sample =
      'Roll,Name,Class,Section,GuardianName,GuardianPhone,MonthlyFee,DueAmount\n1,শিক্ষার্থীর নাম লিখুন,Class One,A,অভিভাবকের নাম,01700-000000,0,0\n2,দ্বিতীয় শিক্ষার্থীর নাম,Class One,A,অভিভাবকের নাম,01700-000000,0,0\n';
    const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'el-dorado-school-600-students-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const escapeCsvCell = (val: string | number | undefined): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const buildCSVContent = (records: StudentRecord[]): string => {
    const header =
      'Roll,NameBn,NameEn,Class,Section,GuardianName,GuardianPhone,MonthlyFee,TotalFee,PaidAmount,DueAmount,AttendanceRate,GPA,MeritPosition,Status\n';
    const rows = records
      .map((s) =>
        [
          escapeCsvCell(s.rollNo),
          escapeCsvCell(s.nameBn),
          escapeCsvCell(s.nameEn),
          escapeCsvCell(s.className),
          escapeCsvCell(s.section),
          escapeCsvCell(s.guardianName),
          escapeCsvCell(s.guardianPhone),
          s.monthlyFee,
          s.totalFee,
          s.paidAmount,
          s.dueAmount,
          s.attendanceRate,
          s.gpa,
          s.meritPosition,
          escapeCsvCell(s.status),
        ].join(',')
      )
      .join('\n');
    return header + rows;
  };

  const getScopedExportStudents = (): StudentRecord[] => {
    return students.filter((s) => {
      if (exportClassScope !== 'all' && s.className !== exportClassScope) return false;
      if (exportFeeScope === 'due_only' && s.dueAmount <= 0) return false;
      if (exportFeeScope === 'paid_only' && s.dueAmount > 0) return false;
      return true;
    });
  };

  const handleExportAllStudentsCSV = () => {
    const csvContent = buildCSVContent(students);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `el-dorado-full-student-database-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportScopedAnalysisCSV = () => {
    const scoped = getScopedExportStudents();
    const csvContent = buildCSVContent(scoped);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const scopeSlug =
      exportClassScope === 'all'
        ? 'all-classes'
        : exportClassScope.toLowerCase().replace(/\s+/g, '-');
    a.download = `el-dorado-analysis-${scopeSlug}-${exportFeeScope}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCSVToClipboard = async () => {
    const scoped = getScopedExportStudents();
    const csvContent = buildCSVContent(scoped);
    try {
      await navigator.clipboard.writeText(csvContent);
      setCsvCopiedFeedback(true);
      setTimeout(() => setCsvCopiedFeedback(false), 2500);
    } catch {
      // Fallback if clipboard blocked
    }
  };

  const filteredManageStudents = students.filter((s) => {
    if (manageClassFilter !== 'all' && s.className !== manageClassFilter) return false;
    if (manageSearch.trim()) {
      const q = manageSearch.toLowerCase();
      return (
        s.rollNo.toLowerCase().includes(q) ||
        s.nameBn.toLowerCase().includes(q) ||
        s.nameEn.toLowerCase().includes(q) ||
        s.guardianPhone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-neutral-200 dark:border-slate-800">
          <div>
            <div className="text-xs font-semibold text-red-700 dark:text-red-400">
              {lang === 'bn'
                ? 'এল ডরাডো মডেল স্কুল · বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা'
                : 'El Dorado Model School · Burirpara, Zirabo, Ashulia, Savar, Dhaka'}
            </div>
            <h2 className="font-display text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
              {lang === 'bn'
                ? 'নতুন ভর্তি, ৬০০+ শিক্ষার্থীর নাম এন্ট্রি ও কাস্টমাইজেশন হাব'
                : 'New Admission, 600+ Student Bulk Entry & Daily Customization Hub'}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'একজন করে নতুন ভর্তি, টেবিল গ্রিডে একসাথে বহু শিক্ষার্থীর নাম তোলা, অথবা এক্সেল/কপি-পেস্টের মাধ্যমে ৬০০+ শিক্ষার্থীর নাম এক ক্লিকে যুক্ত ও কাস্টমাইজ করুন'
                : 'Enroll individual students, enter batches via rapid spreadsheet grid, or import 600+ students via Excel/CSV'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllStudentsCSV}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn'
                  ? `পূর্ণাঙ্গ ডাটাবেস CSV এক্সপোর্ট (${students.length} জন)`
                  : `Export Full Database CSV (${students.length})`}
              </span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'স্যাম্পল টেমপ্লেট (.csv)' : 'Template (.csv)'}</span>
            </button>
          </div>
        </div>

        {/* 4 Action Mode Tabs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              mode === 'single'
                ? 'border-red-600 bg-red-50/60 dark:bg-red-950/30 text-neutral-900 dark:text-white'
                : 'border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <UserPlus className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span>
                {lang === 'bn' ? '১. নতুন শিক্ষার্থী ভর্তি ফরম' : '1. New Student Admission'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'নতুন বাচ্চা ভর্তি হলে রোল, শ্রেণি ও তথ্য যুক্ত করুন'
                : 'Enroll a newly admitted student with custom fields'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('grid')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              mode === 'grid'
                ? 'border-red-600 bg-red-50/60 dark:bg-red-950/30 text-neutral-900 dark:text-white'
                : 'border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Table className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span>
                {lang === 'bn'
                  ? '২. দ্রুত মাল্টি-রো টেবিল এন্ট্রি'
                  : '2. Rapid Multi-Row Sheet'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'শ্রেণি সিলেক্ট করে একসাথে ১০-৫০ জনের নাম দ্রুত তুলুন'
                : 'Type multiple students row-by-row like Excel'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              mode === 'bulk'
                ? 'border-red-600 bg-red-50/60 dark:bg-red-950/30 text-neutral-900 dark:text-white'
                : 'border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Upload className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span>
                {lang === 'bn'
                  ? '৩. ৬০০+ শিক্ষার্থী কপি-পেস্ট / এক্সেল'
                  : '3. 600+ Excel / Copy-Paste'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'এক্সেল ফাইল বা নামের তালিকা পেস্ট করে এক ক্লিকে আপলোড'
                : 'Upload CSV or paste 600+ student names at once'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('manage')}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              mode === 'manage'
                ? 'border-red-600 bg-red-50/60 dark:bg-red-950/30 text-neutral-900 dark:text-white'
                : 'border-neutral-200 dark:border-slate-800 hover:bg-neutral-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Edit3 className="w-4 h-4 text-red-700 dark:text-red-400" />
              <span>
                {lang === 'bn'
                  ? `৪. তথ্য কাস্টমাইজ ও এডিট (${students.length})`
                  : `4. Customize & Edit (${students.length})`}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'যেকোনো শিক্ষার্থীর নাম, রোল, শ্রেণি বা বেতন পরিবর্তন করুন'
                : 'Edit or delete any student record anytime'}
            </p>
          </button>
        </div>
      </div>

      {/* =================================================================
          MODE 1: SINGLE NEW STUDENT ADMISSION FORM
      ================================================================= */}
      {mode === 'single' && (
        <form
          onSubmit={handleSingleSubmit}
          className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
        >
          <div className="border-b border-neutral-200 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {lang === 'bn'
                ? 'নতুন শিক্ষার্থী ভর্তি ফরম (New Student Admission)'
                : 'New Student Admission Form'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'নতুন বাচ্চা ভর্তি হলে তার রোল, নাম ও শ্রেণি লিখুন। টাকার ঘরগুলো সম্পূর্ণ ঐচ্ছিক (চাইলে ফাঁকা রাখতে পারেন বা নিজেদের মতো কাস্টমাইজ করতে পারেন)।'
                : 'Enter student details below. Fee fields are completely optional and customizable.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'রোল নম্বর (Roll No) *' : 'Roll Number *'}
              </label>
              <input
                type="text"
                required
                value={singleForm.rollNo}
                onChange={(e) => setSingleForm({ ...singleForm, rollNo: e.target.value })}
                placeholder={lang === 'bn' ? 'যেমন: 1 বা 101' : 'e.g. 1 or 101'}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'শিক্ষার্থীর নাম (বাংলা / ইংরেজি) *' : 'Student Full Name *'}
              </label>
              <input
                type="text"
                required
                value={singleForm.nameBn}
                onChange={(e) => setSingleForm({ ...singleForm, nameBn: e.target.value })}
                placeholder={lang === 'bn' ? 'শিক্ষার্থীর নাম লিখুন' : 'Enter student name'}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'শ্রেণি (Class) *' : 'Class *'}
              </label>
              <select
                value={singleForm.className}
                onChange={(e) => setSingleForm({ ...singleForm, className: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
              >
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="CUSTOM">
                  {lang === 'bn' ? '+ কাস্টম শ্রেণির নাম লিখুন' : '+ Custom Class Name'}
                </option>
              </select>
              {singleForm.className === 'CUSTOM' && (
                <input
                  type="text"
                  value={singleForm.customClass}
                  onChange={(e) => setSingleForm({ ...singleForm, customClass: e.target.value })}
                  placeholder={lang === 'bn' ? 'শ্রেণির নাম লিখুন' : 'Enter custom class'}
                  className="mt-2 w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-neutral-900 dark:text-white"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'শাখা (Section)' : 'Section'}
              </label>
              <input
                type="text"
                value={singleForm.section}
                onChange={(e) => setSingleForm({ ...singleForm, section: e.target.value })}
                placeholder="A / B / Shapla"
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'পিতা / অভিভাবকের নাম' : 'Guardian Name'}
              </label>
              <input
                type="text"
                value={singleForm.guardianName}
                onChange={(e) => setSingleForm({ ...singleForm, guardianName: e.target.value })}
                placeholder={lang === 'bn' ? 'অভিভাবকের নাম (ঐচ্ছিক)' : 'Guardian name (optional)'}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'অভিভাবকের মোবাইল নম্বর' : 'Guardian Mobile'}
              </label>
              <input
                type="text"
                value={singleForm.guardianPhone}
                onChange={(e) => setSingleForm({ ...singleForm, guardianPhone: e.target.value })}
                placeholder={lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile number (optional)'}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'মাসিক বেতন (ঐচ্ছিক)' : 'Monthly Fee (Optional)'}
              </label>
              <input
                type="number"
                min={0}
                value={singleForm.monthlyFee}
                onChange={(e) => setSingleForm({ ...singleForm, monthlyFee: e.target.value })}
                placeholder={lang === 'bn' ? 'প্রয়োজন হলে লিখুন' : 'Leave blank or 0'}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'বেতন বাকি / বকেয়া (ঐচ্ছিক)' : 'Due Balance (Optional)'}
              </label>
              <input
                type="number"
                min={0}
                value={singleForm.dueAmount}
                onChange={(e) => setSingleForm({ ...singleForm, dueAmount: e.target.value })}
                placeholder={lang === 'bn' ? 'প্রয়োজন হলে লিখুন' : 'Leave blank or 0'}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 px-6 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {lang === 'bn'
                  ? 'নতুন শিক্ষার্থী ভর্তি সম্পন্ন করুন'
                  : 'Confirm New Student Admission'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* =================================================================
          MODE 2: RAPID MULTI-ROW SPREADSHEET GRID ENTRY
      ================================================================= */}
      {mode === 'grid' && (
        <form
          onSubmit={handleSaveGridRows}
          className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'দ্রুত মাল্টি-রো টেবিল এন্ট্রি (একসাথে বহু শিক্ষার্থীর নাম তোলার ছক)'
                  : 'Rapid Multi-Row Spreadsheet Entry'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'শ্রেণি ও শাখা নির্বাচন করে নিচের ছকে পরপর শিক্ষার্থীদের নাম লিখে "সবগুলো একসাথে সেভ করুন" বাটনে ক্লিক করুন'
                  : 'Select Class & Section once, type student names down the rows, and click Save All'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div>
                <span className="text-neutral-500 mr-1.5">{lang === 'bn' ? 'শ্রেণি:' : 'Class:'}</span>
                <select
                  value={gridClass}
                  onChange={(e) => setGridClass(e.target.value)}
                  className="rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-semibold text-neutral-900 dark:text-white"
                >
                  {SCHOOL_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className="text-neutral-500 mr-1.5">
                  {lang === 'bn' ? 'শাখা:' : 'Section:'}
                </span>
                <input
                  type="text"
                  value={gridSection}
                  onChange={(e) => setGridSection(e.target.value)}
                  className="w-20 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                  <th className="py-2 pr-2 w-24">{lang === 'bn' ? 'রোল নং *' : 'Roll No *'}</th>
                  <th className="py-2 px-2">
                    {lang === 'bn' ? 'শিক্ষার্থীর নাম (লিখুন) *' : 'Student Name *'}
                  </th>
                  <th className="py-2 px-2">
                    {lang === 'bn' ? 'অভিভাবকের নাম (ঐচ্ছিক)' : 'Guardian Name (Opt)'}
                  </th>
                  <th className="py-2 px-2 w-40">
                    {lang === 'bn' ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile (Opt)'}
                  </th>
                  <th className="py-2 pl-2 w-32">
                    {lang === 'bn' ? 'বকেয়া/বেতন (ঐচ্ছিক)' : 'Fee/Due (Opt)'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {gridRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 pr-2">
                      <input
                        type="text"
                        value={row.rollNo}
                        onChange={(e) => {
                          const next = [...gridRows];
                          next[idx].rollNo = e.target.value;
                          setGridRows(next);
                        }}
                        className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 px-2.5 py-1.5 font-mono tabular-nums text-neutral-900 dark:text-white"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.nameBn}
                        onChange={(e) => {
                          const next = [...gridRows];
                          next[idx].nameBn = e.target.value;
                          setGridRows(next);
                        }}
                        placeholder={
                          lang === 'bn'
                            ? `শিক্ষার্থী #${idx + 1}-এর নাম লিখুন...`
                            : `Enter student #${idx + 1} name...`
                        }
                        className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-neutral-900 dark:text-white"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.guardianName}
                        onChange={(e) => {
                          const next = [...gridRows];
                          next[idx].guardianName = e.target.value;
                          setGridRows(next);
                        }}
                        placeholder={lang === 'bn' ? 'অভিভাবক' : 'Guardian'}
                        className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-neutral-900 dark:text-white"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={row.guardianPhone}
                        onChange={(e) => {
                          const next = [...gridRows];
                          next[idx].guardianPhone = e.target.value;
                          setGridRows(next);
                        }}
                        placeholder="017XXXXXXXX"
                        className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-mono tabular-nums text-neutral-900 dark:text-white"
                      />
                    </td>
                    <td className="py-1.5 pl-2">
                      <input
                        type="number"
                        min={0}
                        value={row.dueAmount}
                        onChange={(e) => {
                          const next = [...gridRows];
                          next[idx].dueAmount = e.target.value;
                          setGridRows(next);
                        }}
                        placeholder="0"
                        className="w-full rounded border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-mono tabular-nums text-neutral-900 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addMoreGridRows(10)}
                className="flex items-center gap-1 rounded-lg border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ আরও ১০টি সারি যোগ করুন' : '+ Add 10 More Rows'}</span>
              </button>
              <button
                type="button"
                onClick={() => addMoreGridRows(50)}
                className="flex items-center gap-1 rounded-lg border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ আরও ৫০টি সারি যোগ করুন' : '+ Add 50 More Rows'}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={importing}
              className="flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 px-6 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {importing
                  ? lang === 'bn'
                    ? 'সেভ হচ্ছে...'
                    : 'Saving...'
                  : lang === 'bn'
                    ? 'সবগুলো একসাথে সেভ করুন'
                    : 'Save All Filled Rows'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* =================================================================
          MODE 3: 600+ STUDENTS EXCEL / CSV & COPY-PASTE BULK IMPORT
      ================================================================= */}
      {mode === 'bulk' && (
        <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? '৬০০+ শিক্ষার্থীর নাম এক ক্লিকে আপলোড (Excel / CSV অথবা কপি-পেস্ট)'
                  : 'Bulk Import 600+ Students via Excel / CSV or Copy-Paste'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'এক্সেল ফাইল (.csv) আপলোড করুন অথবা নিচের বক্সে প্রতি লাইনে কেবল "রোল, নাম" বা শুধু "নাম" পেস্ট করে ইমপোর্ট বাটনে ক্লিক করুন'
                  : 'Upload a .csv file from Excel or paste student lines (Roll, Name) below'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCSV}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'bn'
                  ? 'স্যাম্পল এক্সেল টেমপ্লেট ডাউনলোড (.csv)'
                  : 'Download Excel CSV Template'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ডিফল্ট শ্রেণি নির্বাচন করুন' : 'Default Class for Paste'}
              </label>
              <select
                value={bulkClass}
                onChange={(e) => setBulkClass(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
              >
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ডিফল্ট শাখা (Section)' : 'Default Section'}
              </label>
              <input
                type="text"
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'এক্সেল (.csv / .txt) ফাইল আপলোড করুন' : 'Upload Excel CSV File'}
              </label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-neutral-700 dark:text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-red-700 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-slate-300 mb-1.5">
              {lang === 'bn'
                ? 'অথবা এখানে শিক্ষার্থীদের তালিকা কপি-পেস্ট করুন (প্রতি লাইনে একজন — যেমন: "101, শিক্ষার্থীর নাম" অথবা শুধু "শিক্ষার্থীর নাম"):'
                : 'Or Paste Student List Here (One student per line — e.g. "101, Student Name" or just "Student Name"):'}
            </label>
            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'উদাহরণ:\n1, প্রথম শিক্ষার্থীর নাম\n2, দ্বিতীয় শিক্ষার্থীর নাম\n3, তৃতীয় শিক্ষার্থীর নাম, Class Two, A, অভিভাবকের নাম, 01700000000'
                  : 'Example:\n1, First Student Name\n2, Second Student Name\n3, Third Student Name, Class Two, A, Guardian Name, 01700000000'
              }
              className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 p-3 text-xs font-mono text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={importing || !bulkText.trim()}
              onClick={() => parseAndImportText(bulkText)}
              className="flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 px-6 py-2.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>
                {importing
                  ? lang === 'bn'
                    ? 'ইমপোর্ট হচ্ছে...'
                    : 'Importing...'
                  : lang === 'bn'
                    ? 'তালিকা ইমপোর্ট ও সেভ করুন'
                    : 'Import & Save Students'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================
          MODE 4: DAILY CUSTOMIZATION, EDIT & DELETE DIRECTORY
      ================================================================= */}
      {mode === 'manage' && (
        <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-neutral-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? `সকল শিক্ষার্থীর তথ্য ও বেতন কাস্টমাইজেশন তালিকা (${filteredManageStudents.length} জন)`
                  : `Customize, Edit or Delete Student Records (${filteredManageStudents.length})`}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'যেকোনো শিক্ষার্থীর নাম, রোল, শ্রেণি, মোবাইল বা টাকার হিসাব এডিট বা ডিলিট করুন'
                  : 'Click Edit on any row to modify student details or fee balances'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="text"
                value={manageSearch}
                onChange={(e) => setManageSearch(e.target.value)}
                placeholder={lang === 'bn' ? 'রোল বা নাম খুঁজুন...' : 'Search roll or name...'}
                className="rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 px-3 py-1.5 text-neutral-900 dark:text-white"
              />
              <select
                value={manageClassFilter}
                onChange={(e) => setManageClassFilter(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-neutral-900 dark:text-white"
              >
                <option value="all">{lang === 'bn' ? 'সকল শ্রেণি' : 'All Classes'}</option>
                {SCHOOL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {students.length > 0 && (
                <>
                  {!confirmClearAll ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="rounded-lg border border-red-300 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      {lang === 'bn' ? 'সব মুছুন' : 'Clear All'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await onClearAllStudents();
                          setConfirmClearAll(false);
                        }}
                        className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        {lang === 'bn' ? 'নিশ্চিত মুছুন' : 'Confirm Clear'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                  <th className="py-2.5 px-4 font-medium">{lang === 'bn' ? 'রোল' : 'Roll'}</th>
                  <th className="py-2.5 px-4 font-medium">
                    {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                  </th>
                  <th className="py-2.5 px-4 font-medium">
                    {lang === 'bn' ? 'শ্রেণি ও শাখা' : 'Class & Section'}
                  </th>
                  <th className="py-2.5 px-4 font-medium">
                    {lang === 'bn' ? 'অভিভাবক ও মোবাইল' : 'Guardian & Mobile'}
                  </th>
                  <th className="py-2.5 px-4 text-right font-medium">
                    {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                  </th>
                  <th className="py-2.5 px-4 text-right font-medium">
                    {lang === 'bn' ? 'বেতন বাকি (Due)' : 'Due'}
                  </th>
                  <th className="py-2.5 px-4 text-right font-medium">
                    {lang === 'bn' ? 'কাস্টমাইজ / ডিলিট' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {filteredManageStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      {lang === 'bn'
                        ? 'এখনো কোনো শিক্ষার্থীর নাম যুক্ত করা হয়নি। উপরে ১, ২ অথবা ৩ নম্বর অপশন থেকে শিক্ষার্থীদের নাম যুক্ত করুন।'
                        : 'No student records yet. Add students using options 1, 2, or 3 above.'}
                    </td>
                  </tr>
                ) : (
                  filteredManageStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-4 font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                        {st.rollNo}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-neutral-900 dark:text-white">
                        {st.nameBn}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-600 dark:text-slate-300">
                        {st.className} · {st.section}
                      </td>
                      <td className="py-2.5 px-4 text-neutral-600 dark:text-slate-300">
                        {st.guardianName} ·{' '}
                        <span className="font-mono tabular-nums">{st.guardianPhone}</span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                        {st.paidAmount > 0 ? `৳${st.paidAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-red-600 dark:text-red-400 font-semibold">
                        {st.dueAmount > 0 ? `৳${st.dueAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingStudent({ ...st })}
                            className="flex items-center gap-1 rounded border border-neutral-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(st.id)}
                            className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================
          DEDICATED CSV DATABASE BACKUP & EXTERNAL ANALYSIS EXPORT HUB
      ================================================================= */}
      <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'সম্পূর্ণ স্টুডেন্ট ডাটাবেস CSV ব্যাকআপ ও এক্সটার্নাল অ্যানালিটিক্স এক্সপোর্ট'
                  : 'Full Student Database CSV Backup & External Analysis Export'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'মাইক্রোসফট এক্সেল (Excel), গুগল শিটস (Google Sheets) বা বাহ্যিক হিসাব-নিকাশ ও নিরাপদ ব্যাকআপের জন্য এক ক্লিকে সম্পূর্ণ অথবা শ্রেণিভিত্তিক CSV ডাউনলোড করুন (UTF-8 বাংলা ফন্ট সাপোর্টসহ)।'
                  : 'Download the entire student database or filtered class/fee segments as a UTF-8 CSV file for offline backup, Microsoft Excel, or Google Sheets analysis.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportAllStudentsCSV}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white whitespace-nowrap transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>
              {lang === 'bn'
                ? `সম্পূর্ণ ডাটাবেস CSV ডাউনলোড (${students.length} জন)`
                : `Export Entire Student Database (.CSV) (${students.length})`}
            </span>
          </button>
        </div>

        {/* Custom Analysis Filter & Export Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end text-xs">
          <div className="lg:col-span-3">
            <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
              {lang === 'bn'
                ? '১. বিশ্লেষণের জন্য শ্রেণি নির্বাচন (Class Scope)'
                : '1. Select Class Scope'}
            </label>
            <select
              value={exportClassScope}
              onChange={(e) => setExportClassScope(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
            >
              <option value="all">
                {lang === 'bn' ? 'সকল শ্রেণি (All Classes)' : 'All Classes (Full School)'}
              </option>
              {SCHOOL_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="block font-semibold text-neutral-700 dark:text-slate-300 mb-1">
              {lang === 'bn'
                ? '২. বেতন স্ট্যাটাস ফিল্টার (Fee Filter)'
                : '2. Tuition Fee Status Filter'}
            </label>
            <select
              value={exportFeeScope}
              onChange={(e) =>
                setExportFeeScope(e.target.value as 'all' | 'due_only' | 'paid_only')
              }
              className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
            >
              <option value="all">
                {lang === 'bn' ? 'সকল শিক্ষার্থী (All Records)' : 'All Student Records'}
              </option>
              <option value="due_only">
                {lang === 'bn' ? 'শুধুমাত্র বকেয়া তালিকা (Due Only)' : 'Pending Due Only'}
              </option>
              <option value="paid_only">
                {lang === 'bn' ? 'শুধুমাত্র পরিশোধিত (No Due)' : 'Cleared / Paid Only'}
              </option>
            </select>
          </div>

          <div className="lg:col-span-6 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleExportScopedAnalysisCSV}
              className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn'
                  ? `বিশ্লেষণ রিপোর্ট CSV ডাউনলোড (${getScopedExportStudents().length} জন)`
                  : `Export Filtered Analysis CSV (${getScopedExportStudents().length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleCopyCSVToClipboard}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {csvCopiedFeedback
                  ? lang === 'bn'
                    ? '✓ ক্লিপবোর্ডে কপি হয়েছে!'
                    : '✓ Copied CSV to Clipboard!'
                  : lang === 'bn'
                    ? 'এক্সেলে পেস্টের জন্য CSV কপি'
                    : 'Copy CSV to Clipboard'}
              </span>
            </button>
          </div>
        </div>

        {/* Summary of Exported Columns */}
        <div className="pt-2 border-t border-neutral-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 dark:text-slate-400">
          <div>
            {lang === 'bn' ? 'এক্সপোর্টকৃত কলামসমূহ:' : 'Included CSV Columns:'}{' '}
            <span className="font-mono">
              Roll, NameBn, NameEn, Class, Section, GuardianName, GuardianPhone, MonthlyFee,
              TotalFee, PaidAmount, DueAmount, AttendanceRate, GPA, MeritPosition, Status
            </span>
          </div>
          <div className="font-mono tabular-nums">
            {lang === 'bn'
              ? `মোট রেকর্ড: ${students.length} | ফিল্টারকৃত: ${getScopedExportStudents().length}`
              : `Total Records: ${students.length} | Filtered: ${getScopedExportStudents().length}`}
          </div>
        </div>
      </div>

      {/* Edit Student Customizer Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'শিক্ষার্থীর তথ্য ও বেতন কাস্টমাইজ করুন'
                  : 'Customize Student Profile & Fee Balance'}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdateStudent({
                  ...editingStudent,
                  nameEn: editingStudent.nameEn || editingStudent.nameBn,
                });
                setEditingStudent(null);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'রোল নম্বর' : 'Roll No'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.rollNo}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, rollNo: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'শ্রেণি' : 'Class'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.className}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, className: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.nameBn}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        nameBn: e.target.value,
                        nameEn: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'শাখা (Section)' : 'Section'}
                  </label>
                  <input
                    type="text"
                    value={editingStudent.section}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, section: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'অভিভাবকের নাম' : 'Guardian Name'}
                  </label>
                  <input
                    type="text"
                    value={editingStudent.guardianName}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, guardianName: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'মোবাইল নম্বর' : 'Guardian Phone'}
                  </label>
                  <input
                    type="text"
                    value={editingStudent.guardianPhone}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'মাসিক বেতন (৳)' : 'Monthly Fee'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingStudent.monthlyFee}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        monthlyFee: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'পরিশোধিত (Paid ৳)' : 'Paid Amount'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingStudent.paidAmount}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        paidAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'বেতন বাকি (Due ৳)' : 'Due Balance'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingStudent.dueAmount}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        dueAmount: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="rounded-lg border border-neutral-300 dark:border-slate-700 px-4 py-2 text-neutral-700 dark:text-slate-300"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-700 hover:bg-red-800 px-5 py-2 font-semibold text-white"
                >
                  {lang === 'bn' ? 'পরিবর্তন সেভ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
