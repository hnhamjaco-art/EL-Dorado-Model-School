import React, { useState, useRef } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  FileSpreadsheet,
  Database,
  CheckCircle2,
  X,
  Upload,
  Copy,
  QrCode,
  FileText,
  Award,
  CheckSquare,
  CreditCard,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  StudentRecord,
  PaymentRecord,
  NoticeRecord,
  ResultRecord,
} from '../data/initialData';
import {
  downloadStandaloneSchoolApp,
  downloadStudentsFeeCsv,
  downloadPaymentsCsv,
  downloadResultsCsv,
  downloadAttendanceCsv,
  downloadDesktopShortcut,
  downloadFullDatabaseJson,
} from '../utils/downloadCenter';
import { ElDoradoLogo } from './ElDoradoLogo';

interface OnlineDownloadCenterModalProps {
  lang: 'bn' | 'en';
  onClose: () => void;
  students: StudentRecord[];
  payments: PaymentRecord[];
  notices: NoticeRecord[];
  results: ResultRecord[];
  attendanceMap: Record<string, 'present' | 'absent' | 'late' | 'leave'>;
  attendanceDate: string;
  isInstallable: boolean;
  onNativeInstall: () => Promise<boolean>;
  onRestoreDatabase?: (restored: {
    students?: StudentRecord[];
    payments?: PaymentRecord[];
    notices?: NoticeRecord[];
    results?: ResultRecord[];
    attendanceMap?: Record<string, 'present' | 'absent' | 'late' | 'leave'>;
  }) => void;
}

export const OnlineDownloadCenterModal: React.FC<OnlineDownloadCenterModalProps> = ({
  lang,
  onClose,
  students,
  payments,
  notices,
  results,
  attendanceMap,
  attendanceDate,
  isInstallable,
  onNativeInstall,
  onRestoreDatabase,
}) => {
  const [downloadedNotice, setDownloadedNotice] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const liveAppUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://eldoradoschool.edu.bd';

  const notifyDownload = (msgBn: string, msgEn: string) => {
    setDownloadedNotice(lang === 'bn' ? msgBn : msgEn);
    setTimeout(() => {
      setDownloadedNotice(null);
    }, 4500);
  };

  const handleCopyLiveLink = async () => {
    try {
      await navigator.clipboard.writeText(liveAppUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onRestoreDatabase) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = String(ev.target?.result || '');
        const parsed = JSON.parse(raw);
        const payload = parsed.data || parsed;
        if (payload && (Array.isArray(payload.students) || Array.isArray(payload.payments))) {
          onRestoreDatabase({
            students: Array.isArray(payload.students) ? payload.students : undefined,
            payments: Array.isArray(payload.payments) ? payload.payments : undefined,
            notices: Array.isArray(payload.notices) ? payload.notices : undefined,
            results: Array.isArray(payload.results) ? payload.results : undefined,
            attendanceMap:
              payload.attendanceMap && typeof payload.attendanceMap === 'object'
                ? payload.attendanceMap
                : undefined,
          });
          notifyDownload(
            '✓ ব্যাকআপ ফাইল থেকে সকল তথ্য সফলভাবে রিস্টোর করা হয়েছে!',
            '✓ Database successfully restored from backup file!'
          );
        } else {
          notifyDownload(
            'ফাইলটি সঠিক ফরম্যাটে নেই। অনুগ্রহ করে .json ব্যাকআপ ফাইল নির্বাচন করুন।',
            'Invalid backup format. Please select a valid .json database file.'
          );
        }
      } catch {
        notifyDownload(
          'ফাইলটি পড়া যায়নি। সঠিক .json ব্যাকআপ ফাইল আপলোড করুন।',
          'Could not parse file. Please upload a valid .json backup file.'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4 overflow-y-auto no-print">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-red-700 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/15">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold">
                {lang === 'bn'
                  ? 'অনলাইন ডাউনলোড ও অ্যাপ ইনস্টলার সেন্টার'
                  : 'Online App & Instant Download Center'}
              </h2>
              <p className="text-xs text-red-100">
                {lang === 'bn'
                  ? 'এল্ ডরাডো মডেল স্কুল — এক ক্লিকে সম্পূর্ণ অফলাইন/অনলাইন অ্যাপ, এক্সেল শিট ও ব্যাকআপ ডাউনলোড করুন'
                  : 'El Dorado Model School — 1-Click Portable App, Excel CSV Sheets & Database Download'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Instant Feedback Banner */}
          {downloadedNotice && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-4 py-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{downloadedNotice}</span>
            </div>
          )}

          {/* PRIMARY HERO DOWNLOAD: 1-Click Standalone Portable App + Native PWA */}
          <div className="rounded-xl border-2 border-red-600/80 dark:border-red-500/70 bg-red-50/40 dark:bg-slate-800/70 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <ElDoradoLogo size={68} />
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'bn'
                        ? 'সরাসরি ১-ক্লিকে ডাউনলোডযোগ্য সফটওয়্যার (মোবাইল ও কম্পিউটার)'
                        : 'Instant 1-Click Downloadable Software (Mobile & PC)'}
                    </span>
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'এল ডরাডো মডেল স্কুল — পোর্টেবল অ্যাপ ও অফলাইন সফটওয়্যার'
                      : 'El Dorado Model School — Portable Standalone App (.html)'}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    {lang === 'bn'
                      ? 'নিচের বাটনে ক্লিক করলেই সাথে সাথে আপনার মোবাইল বা কম্পিউটারে সম্পূর্ণ স্কুল সফটওয়্যারটি ডাউনলোড হয়ে যাবে। এতে বর্তমান সকল শিক্ষার্থী, বেতন, রেজাল্ট ও নোটিশ যুক্ত থাকবে এবং ইন্টারনেট ছাড়াও যেকোনো ব্রাউজারে ওপেন করে কাজ করা যাবে।'
                      : 'Click below to immediately download the standalone portable application to your phone or computer. Includes all current student records, tuition fees, results, and notices—works both offline and online.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    downloadStandaloneSchoolApp({
                      students,
                      payments,
                      notices,
                      results,
                      appUrl: liveAppUrl,
                    });
                    notifyDownload(
                      '✓ পোর্টেবল স্কুল অ্যাপ ফাইল (.html) আপনার ডিভাইসে ডাউনলোড শুরু হয়েছে!',
                      '✓ Standalone School App (.html) downloaded to your device!'
                    );
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-700 hover:bg-red-800 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {lang === 'bn'
                      ? 'এখনই অ্যাপ ডাউনলোড করুন (১ ক্লিকে)'
                      : 'Download Portable App Now'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  {isInstallable && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await onNativeInstall();
                        if (ok) {
                          notifyDownload(
                            '✓ অ্যাপটি সরাসরি ডিভাইসে ইনস্টল হয়েছে!',
                            '✓ App installed natively on your device!'
                          );
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সরাসরি PWA ইনস্টল' : 'Install PWA App'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      downloadDesktopShortcut(liveAppUrl);
                      notifyDownload(
                        '✓ কম্পিউটার/মোবাইল অনলাইন শর্টকাট (.url) ডাউনলোড হয়েছে!',
                        '✓ Desktop Online Shortcut (.url) downloaded!'
                      );
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-100 dark:hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-neutral-800 dark:text-slate-200 transition-colors whitespace-nowrap"
                  >
                    <Monitor className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
                    <span>
                      {lang === 'bn' ? 'ডেস্কটপ শর্টকাট (.url)' : 'Desktop Shortcut (.url)'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: 1-Click Excel (CSV) & Printable Data Downloads */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'bn'
                  ? 'অনলাইন শিট ও রিপোর্ট ডাউনলোড (এক্সেল CSV ও ডেটা ফাইল)'
                  : 'Instant Online Spreadsheets & Reports Download (Excel CSV)'}
              </span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Students & Tuition Fee Sheet */}
              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/50 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Excel / CSV
                    </span>
                    <span className="font-mono tabular-nums">{students.length} জন</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'শিক্ষার্থী ও বেতন বকেয়া তালিকা'
                      : 'Students & Tuition Fee Ledger'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'রোল, নাম, অভিভাবক, মোবাইল, মাসিক বেতন, পরিশোধিত ও বকেয়া শিট'
                      : 'Roll, Name, Guardian, Phone, Monthly Fee, Paid & Due'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadStudentsFeeCsv(students);
                    notifyDownload(
                      '✓ শিক্ষার্থীদের বেতন ও বকেয়া তালিকা (.csv) ডাউনলোড হয়েছে!',
                      '✓ Students & Tuition Fee CSV downloaded!'
                    );
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'বেতন শিট ডাউনলোড' : 'Download Fee CSV'}</span>
                </button>
              </div>

              {/* 2. Payment & QR Receipts Ledger */}
              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/50 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-slate-400">
                    <span className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> bKash/Nagad
                    </span>
                    <span className="font-mono tabular-nums">{payments.length} টি</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'অনলাইন পেমেন্ট ও মানি রিসিট লগ'
                      : 'Payment & QR Receipt Ledger'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'সকল ট্রানজেকশন আইডি (TrxID), মাধ্যম ও ভেরিফিকেশন কোড'
                      : 'All TrxIDs, payment gateways, amounts & QR signatures'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadPaymentsCsv(payments);
                    notifyDownload(
                      '✓ পেমেন্ট ও মানি রিসিট লেজার (.csv) ডাউনলোড হয়েছে!',
                      '✓ Payment & QR Receipt CSV downloaded!'
                    );
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white py-2 text-xs font-semibold text-white dark:text-neutral-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'রিসিট লগ ডাউনলোড' : 'Download Receipts CSV'}</span>
                </button>
              </div>

              {/* 3. Academic Result Marksheets */}
              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/50 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-slate-400">
                    <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <Award className="w-3 h-3" /> GPA / Result
                    </span>
                    <span className="font-mono tabular-nums">{results.length} টি</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'রেজাল্ট কার্ড ও নম্বরপত্র শিট'
                      : 'Academic Result Marksheets'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'বিষয়ভিত্তিক নম্বর, মোট নম্বর, জিপিএ ও গ্রেড তালিকা'
                      : 'Subject-wise scores, total marks, GPA & letter grades'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadResultsCsv(results);
                    notifyDownload(
                      '✓ একাডেমিক রেজাল্ট ও জিপিএ শিট (.csv) ডাউনলোড হয়েছে!',
                      '✓ Academic Results CSV downloaded!'
                    );
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white py-2 text-xs font-semibold text-white dark:text-neutral-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'রেজাল্ট শিট ডাউনলোড' : 'Download Results CSV'}</span>
                </button>
              </div>

              {/* 4. Daily Attendance Sheet */}
              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/50 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" /> {attendanceDate}
                    </span>
                    <span className="font-mono tabular-nums">{students.length} জন</span>
                  </div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'দৈনিক উপস্থিতি (হাজিরা) শিট'
                      : 'Daily Attendance Register'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'আজকের উপস্থিত, অনুপস্থিত ও শতকরা হারের তালিকা'
                      : 'Present, absent, late status & cumulative attendance %'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    downloadAttendanceCsv(students, attendanceMap, attendanceDate);
                    notifyDownload(
                      '✓ দৈনিক হাজিরা রেজিস্টার (.csv) ডাউনলোড হয়েছে!',
                      '✓ Daily Attendance CSV downloaded!'
                    );
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white py-2 text-xs font-semibold text-white dark:text-neutral-900 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'হাজিরা শিট ডাউনলোড' : 'Download Attendance'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Full Database JSON Backup + Restore + Mobile QR App Link */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-neutral-200 dark:border-slate-800">
            {/* Database Backup & Restore */}
            <div className="lg:col-span-7 rounded-xl border border-neutral-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-red-700 dark:text-red-400" />
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                  {lang === 'bn'
                    ? 'সম্পূর্ণ ডাটাবেস ফাইল ডাউনলোড ও রিস্টোর (.json)'
                    : 'Full School Database Download & Restore (.json)'}
                </h4>
              </div>
              <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার স্কুলের সকল তথ্যের ব্যাকআপ ফাইল ডাউনলোড করে রাখুন। পরবর্তীতে যেকোনো কম্পিউটার বা মোবাইলে ফাইলটি আপলোড করে এক ক্লিকে সব তথ্য ফিরিয়ে আনতে পারবেন।'
                  : 'Download a complete JSON snapshot of your school data, or upload a previously downloaded backup file to restore all records.'}
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    downloadFullDatabaseJson({
                      students,
                      payments,
                      notices,
                      results,
                      attendanceMap,
                    });
                    notifyDownload(
                      '✓ সম্পূর্ণ স্কুল ডাটাবেস ফাইল (.json) ডাউনলোড হয়েছে!',
                      '✓ Complete School Database (.json) downloaded!'
                    );
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 text-xs font-semibold text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn'
                      ? 'ডাটাবেস ফাইল ডাউনলোড (.json)'
                      : 'Download Full Database (.json)'}
                  </span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn' ? 'ব্যাকআপ ফাইল আপলোড / রিস্টোর' : 'Restore from Backup File'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mobile QR Code & Direct App Link */}
            <div className="lg:col-span-5 rounded-xl border border-neutral-200 dark:border-slate-800 p-4 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-white border border-neutral-200 shrink-0">
                <QRCodeSVG value={liveAppUrl} size={84} level="M" includeMargin={false} />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                  <QrCode className="w-3.5 h-3.5 text-red-700 dark:text-red-400 shrink-0" />
                  <span>
                    {lang === 'bn' ? 'মোবাইলে স্ক্যান করে ডাউনলোড' : 'Scan QR to Open on Mobile'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'ফোনের ক্যামেরা দিয়ে QR কোডটি স্ক্যান করুন অথবা লিংক কপি করে Chrome/Safari-তে খুলুন।'
                    : 'Scan with your phone camera or copy the direct link to install on mobile.'}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLiveLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-neutral-800 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800"
                >
                  <Copy className="w-3 h-3" />
                  <span>
                    {linkCopied
                      ? lang === 'bn'
                        ? '✓ লিংক কপি হয়েছে!'
                        : '✓ Link Copied!'
                      : lang === 'bn'
                        ? 'অ্যাপ লিংক কপি করুন'
                        : 'Copy App Link'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
