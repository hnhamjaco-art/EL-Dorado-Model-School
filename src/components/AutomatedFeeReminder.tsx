import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Bell,
  CheckCircle2,
  Clock,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { StudentRecord, SCHOOL_CLASSES } from '../data/initialData';

export interface SmsReminderLog {
  id: string;
  rollNo: string;
  studentName: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
  dueAmount: number;
  messageText: string;
  sentAt: string;
  mode: 'single' | 'bulk' | 'auto_scheduled';
}

interface AutomatedFeeReminderProps {
  students: StudentRecord[];
  lang: 'bn' | 'en';
  smsLogs: SmsReminderLog[];
  onSendReminders: (logs: SmsReminderLog[], alsoPostNotice: boolean) => Promise<void>;
  onClearLogs: () => void;
}

const DEFAULT_TEMPLATE_BN =
  'সম্মানিত অভিভাবক ({guardian}), এল ডরাডো মডেল স্কুল (বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা)-এ আপনার সন্তান {name} (রোল: {roll}, শ্রেণি: {class})-এর বকেয়া টিউশন ফি ৳{due}। অনুগ্রহ করে বিকাশ/নগদ/রকেট অথবা স্কুল অফিসে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হলো।';

const DEFAULT_TEMPLATE_EN =
  'Dear Guardian ({guardian}), tuition fee due for {name} (Roll: {roll}, {class}) at El Dorado Model School (Burirpara, Zirabo, Ashulia, Savar, Dhaka) is BDT {due}. Please clear the due via bKash/Nagad/Rocket or at the school office.';

export function formatReminderMessage(
  template: string,
  student: StudentRecord,
  lang: 'bn' | 'en'
): string {
  const displayName = lang === 'bn' ? student.nameBn : student.nameEn || student.nameBn;
  const guardian =
    student.guardianName && student.guardianName !== '-'
      ? student.guardianName
      : lang === 'bn'
        ? 'অভিভাবক'
        : 'Guardian';

  return template
    .replace(/\{name\}/g, displayName)
    .replace(/\{roll\}/g, student.rollNo)
    .replace(/\{class\}/g, student.className)
    .replace(/\{due\}/g, student.dueAmount.toLocaleString())
    .replace(/\{guardian\}/g, guardian);
}

export const AutomatedFeeReminder: React.FC<AutomatedFeeReminderProps> = ({
  students,
  lang,
  smsLogs,
  onSendReminders,
  onClearLogs,
}) => {
  const [templateBn, setTemplateBn] = useState<string>(DEFAULT_TEMPLATE_BN);
  const [templateEn, setTemplateEn] = useState<string>(DEFAULT_TEMPLATE_EN);
  const [targetClass, setTargetClass] = useState<string>('all');
  const [minDueAmount, setMinDueAmount] = useState<number>(1);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState<boolean>(() => {
    return localStorage.getItem('edms_v2_auto_sms_enabled') === 'true';
  });
  const [autoScheduleDay, setAutoScheduleDay] = useState<string>(() => {
    return localStorage.getItem('edms_v2_auto_sms_day') || 'every_5th';
  });
  const [alsoPostNotice, setAlsoPostNotice] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  // Filter students who have outstanding dues matching criteria
  const eligibleDueStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.dueAmount <= 0 || s.dueAmount < minDueAmount) return false;
      if (targetClass !== 'all' && s.className !== targetClass) return false;
      return true;
    });
  }, [students, targetClass, minDueAmount]);

  const totalTargetedDue = useMemo(() => {
    return eligibleDueStudents.reduce((acc, s) => acc + s.dueAmount, 0);
  }, [eligibleDueStudents]);

  const activeTemplate = lang === 'bn' ? templateBn : templateEn;

  const sampleStudent: StudentRecord = eligibleDueStudents[0] || {
    id: 'preview',
    rollNo: '101',
    nameBn: 'শিক্ষার্থীর নাম',
    nameEn: 'Student Name',
    className: targetClass === 'all' ? 'Class One' : targetClass,
    section: 'A',
    guardianName: 'অভিভাবকের নাম',
    guardianPhone: '017XXXXXXXX',
    monthlyFee: 0,
    totalFee: 0,
    paidAmount: 0,
    dueAmount: 1500,
    attendanceRate: 100,
    gpa: 0,
    meritPosition: 1,
    status: 'active',
    authorId: 'preview',
  };

  const previewText = useMemo(
    () => formatReminderMessage(activeTemplate, sampleStudent, lang),
    [activeTemplate, sampleStudent, lang]
  );

  const handleToggleAutoSchedule = () => {
    const next = !autoScheduleEnabled;
    setAutoScheduleEnabled(next);
    localStorage.setItem('edms_v2_auto_sms_enabled', String(next));
  };

  const handleScheduleDayChange = (val: string) => {
    setAutoScheduleDay(val);
    localStorage.setItem('edms_v2_auto_sms_day', val);
  };

  const handleDispatchBulkSms = async () => {
    if (eligibleDueStudents.length === 0 || sending) return;
    setSending(true);
    try {
      const nowStr = new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const nowTs = Date.now();

      const generatedLogs: SmsReminderLog[] = eligibleDueStudents.map((st, idx) => ({
        id: `sms-${nowTs}-${idx}`,
        rollNo: st.rollNo,
        studentName: st.nameBn,
        className: st.className,
        guardianName: st.guardianName,
        guardianPhone: st.guardianPhone,
        dueAmount: st.dueAmount,
        messageText: formatReminderMessage(activeTemplate, st, lang),
        sentAt: nowStr,
        mode: autoScheduleEnabled ? 'auto_scheduled' : 'bulk',
      }));

      await onSendReminders(generatedLogs, alsoPostNotice);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      {/* Top Header Banner */}
      <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'অটোমেটেড বকেয়া বেতন এসএমএস রিমাইন্ডার (Automated Fee Reminder)'
                  : 'Automated Tuition Fee Due SMS Reminder Engine'}
              </h3>
              <span className="text-[11px] font-mono tabular-nums font-semibold text-red-700 dark:text-red-400">
                · {eligibleDueStudents.length}{' '}
                {lang === 'bn' ? 'জন বকেয়া অভিভাবক' : 'Guardians with Due'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'যাদের বেতন বাকি আছে তাদের অভিভাবকদের মোবাইলে স্বয়ংক্রিয়ভাবে রোল ও বকেয়া টাকার পরিমাণসহ কাস্টমাইজড এসএমএস নোটিফিকেশন পাঠান'
                : 'Automatically personalize and dispatch SMS notifications to guardians of students with outstanding tuition dues'}
            </p>
          </div>
        </div>

        {/* Auto-Reminder Schedule Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-50 dark:bg-slate-800/60 px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-neutral-500 dark:text-slate-400" />
            <span className="text-neutral-600 dark:text-slate-300 font-medium">
              {lang === 'bn' ? 'অটো-শিডিউল:' : 'Schedule:'}
            </span>
            <select
              value={autoScheduleDay}
              onChange={(e) => handleScheduleDayChange(e.target.value)}
              className="bg-transparent font-semibold text-neutral-900 dark:text-white focus:outline-none"
            >
              <option value="every_5th">
                {lang === 'bn' ? 'প্রতি মাসের ৫ তারিখ' : '5th of Every Month'}
              </option>
              <option value="every_10th">
                {lang === 'bn' ? 'প্রতি মাসের ১০ তারিখ' : '10th of Every Month'}
              </option>
              <option value="every_15th">
                {lang === 'bn' ? 'প্রতি মাসের ১৫ তারিখ' : '15th of Every Month'}
              </option>
              <option value="weekly_sun">
                {lang === 'bn' ? 'প্রতি রবিবার সকাল ১০টা' : 'Every Sunday 10:00 AM'}
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleToggleAutoSchedule}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
              autoScheduleEnabled
                ? 'bg-emerald-600 text-white'
                : 'border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>
              {autoScheduleEnabled
                ? lang === 'bn'
                  ? 'অটো-রিমাইন্ডার চালু আছে'
                  : 'Auto-Reminder Active'
                : lang === 'bn'
                  ? 'অটো-রিমাইন্ডার চালু করুন'
                  : 'Enable Auto-Reminder'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Configuration & Dispatch Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: SMS Template Editor & Smart Variables */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold text-neutral-800 dark:text-slate-200">
              {lang === 'bn'
                ? '১. অটোমেটেড এসএমএস মেসেজ টেমপ্লেট (কাস্টমাইজযোগ্য):'
                : '1. Automated SMS Message Template (Customizable):'}
            </label>
            <button
              type="button"
              onClick={() => {
                if (lang === 'bn') setTemplateBn(DEFAULT_TEMPLATE_BN);
                else setTemplateEn(DEFAULT_TEMPLATE_EN);
              }}
              className="text-[11px] font-medium text-red-700 dark:text-red-400 hover:underline"
            >
              {lang === 'bn' ? 'ডিফল্ট মেসেজ রিসেট' : 'Reset Default Template'}
            </button>
          </div>

          <textarea
            rows={3}
            value={activeTemplate}
            onChange={(e) => {
              if (lang === 'bn') setTemplateBn(e.target.value);
              else setTemplateEn(e.target.value);
            }}
            className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 p-3 text-xs text-neutral-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-600"
          />

          {/* Dynamic Tag Insertion Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-neutral-500 dark:text-slate-400">
              {lang === 'bn' ? 'ডায়নামিক ট্যাগ যুক্ত করুন:' : 'Insert Dynamic Placeholders:'}
            </span>
            {[
              { tag: '{name}', labelBn: 'শিক্ষার্থীর নাম', labelEn: 'Student Name' },
              { tag: '{roll}', labelBn: 'রোল নং', labelEn: 'Roll No' },
              { tag: '{class}', labelBn: 'শ্রেণি', labelEn: 'Class' },
              { tag: '{due}', labelBn: 'বকেয়া টাকা', labelEn: 'Due Amount' },
              { tag: '{guardian}', labelBn: 'অভিভাবক', labelEn: 'Guardian' },
            ].map((item) => (
              <button
                key={item.tag}
                type="button"
                onClick={() => {
                  if (lang === 'bn') setTemplateBn((prev) => `${prev} ${item.tag}`);
                  else setTemplateEn((prev) => `${prev} ${item.tag}`);
                }}
                className="px-2 py-1 rounded border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-neutral-700 dark:text-slate-300 hover:border-red-500 transition-colors"
              >
                {item.tag} ({lang === 'bn' ? item.labelBn : item.labelEn})
              </button>
            ))}
          </div>

          {/* Live Personalized SMS Preview */}
          <div className="rounded-lg border border-neutral-200 dark:border-slate-800 bg-neutral-50/70 dark:bg-slate-800/40 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-neutral-700 dark:text-slate-300">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'bn'
                  ? 'লাইভ এসএমএস প্রিভিউ (অভিভাবকের মোবাইলে যেমন দেখাবে):'
                  : 'Live Personalized SMS Preview:'}
              </span>
              <span className="font-mono tabular-nums">
                {lang === 'bn' ? 'প্রাপক:' : 'To:'} {sampleStudent.guardianPhone}
              </span>
            </div>
            <p className="text-xs text-neutral-800 dark:text-slate-200 leading-relaxed">
              “{previewText}”
            </p>
          </div>
        </div>

        {/* Right 5 Cols: Target Audience Filters & One-Click Dispatch */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl border border-neutral-200 dark:border-slate-800 bg-neutral-50/50 dark:bg-slate-800/30 p-4 space-y-4">
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-neutral-900 dark:text-white">
              {lang === 'bn'
                ? '২. বকেয়া শিক্ষার্থী ফিল্টার ও বাল্ক ডিসপ্যাচ'
                : '2. Target Due Recipients & Bulk Dispatch'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'শ্রেণি নির্বাচন' : 'Target Class'}
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-neutral-900 dark:text-white"
                >
                  <option value="all">
                    {lang === 'bn' ? 'সকল শ্রেণি (All Classes)' : 'All Classes'}
                  </option>
                  {SCHOOL_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'ন্যূনতম বকেয়া (৳ ≥)' : 'Minimum Due (৳ ≥)'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={minDueAmount}
                  onChange={(e) => setMinDueAmount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Recipient Summary Metrics */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="rounded-lg bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 p-3">
                <span className="text-[11px] text-neutral-500 dark:text-slate-400 block">
                  {lang === 'bn' ? 'বকেয়া প্রাপক সংখ্যা' : 'Targeted Guardians'}
                </span>
                <strong className="text-base font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                  {eligibleDueStudents.length} {lang === 'bn' ? 'জন' : 'Guardians'}
                </strong>
              </div>
              <div className="rounded-lg bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 p-3">
                <span className="text-[11px] text-neutral-500 dark:text-slate-400 block">
                  {lang === 'bn' ? 'মোট বকেয়া দাবি' : 'Total Targeted Due'}
                </span>
                <strong className="text-base font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                  {totalTargetedDue > 0 ? `৳${totalTargetedDue.toLocaleString()}` : '—'}
                </strong>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-neutral-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={alsoPostNotice}
                onChange={(e) => setAlsoPostNotice(e.target.checked)}
                className="rounded border-neutral-300 text-red-700 focus:ring-red-600"
              />
              <span>
                {lang === 'bn'
                  ? 'এসএমএস পাঠানোর পাশাপাশি নোটিশ বোর্ডেও অ্যালার্ট যুক্ত করুন'
                  : 'Also broadcast reminder alert to the School Notice Board'}
              </span>
            </label>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={eligibleDueStudents.length === 0 || sending}
              onClick={handleDispatchBulkSms}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 disabled:opacity-50 py-2.5 px-4 text-xs font-semibold text-white transition-colors"
            >
              <Send className="w-4 h-4" />
              <span>
                {sending
                  ? lang === 'bn'
                    ? 'এসএমএস পাঠানো হচ্ছে...'
                    : 'Dispatching SMS Notifications...'
                  : lang === 'bn'
                    ? `সকল বকেয়া অভিভাবককে এসএমএস পাঠান (${eligibleDueStudents.length} জন)`
                    : `Send Automated SMS to Due Guardians (${eligibleDueStudents.length})`}
              </span>
            </button>

            {eligibleDueStudents.length === 0 && (
              <p className="text-[11px] text-center text-neutral-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'বর্তমানে কোনো শিক্ষার্থীর বকেয়া বেতন নেই। নতুন ভর্তি ট্যাব থেকে বকেয়া বেতনসহ শিক্ষার্থী থাকলে এখানে স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হবে।'
                  : 'No students currently have outstanding dues matching the filter.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sent SMS Reminder Delivery Log */}
      {smsLogs.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-slate-800">
          <div className="px-5 py-3 bg-neutral-50 dark:bg-slate-800/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === 'bn'
                  ? `প্রেরিত বকেয়া বেতন এসএমএস লগ (${smsLogs.length} টি মেসেজ পাঠানো হয়েছে)`
                  : `Automated Fee Reminder SMS Delivery Log (${smsLogs.length} Sent)`}
              </span>
            </div>
            <button
              type="button"
              onClick={onClearLogs}
              className="flex items-center gap-1 text-[11px] text-red-600 hover:underline"
            >
              <Trash2 className="w-3 h-3" />
              <span>{lang === 'bn' ? 'লগ মুছুন' : 'Clear Log'}</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                  <th className="py-2 px-4 font-medium">{lang === 'bn' ? 'সময়' : 'Time'}</th>
                  <th className="py-2 px-4 font-medium">{lang === 'bn' ? 'রোল ও নাম' : 'Student'}</th>
                  <th className="py-2 px-4 font-medium">
                    {lang === 'bn' ? 'অভিভাবকের মোবাইল' : 'Guardian Phone'}
                  </th>
                  <th className="py-2 px-4 text-right font-medium">
                    {lang === 'bn' ? 'বকেয়া' : 'Due'}
                  </th>
                  <th className="py-2 px-4 font-medium">
                    {lang === 'bn' ? 'প্রেরিত এসএমএস বার্তা' : 'SMS Message Content'}
                  </th>
                  <th className="py-2 px-4 text-right font-medium">
                    {lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                {smsLogs.slice(0, 50).map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-4 font-mono tabular-nums text-[11px] text-neutral-500 whitespace-nowrap">
                      {log.sentAt}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white mr-1.5">
                        #{log.rollNo}
                      </span>
                      <span className="font-semibold text-neutral-800 dark:text-slate-200">
                        {log.studentName}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono tabular-nums text-neutral-700 dark:text-slate-300 whitespace-nowrap">
                      {log.guardianPhone}
                    </td>
                    <td className="py-2 px-4 text-right font-mono tabular-nums font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                      ৳{log.dueAmount.toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-neutral-600 dark:text-slate-300 max-w-md truncate">
                      {log.messageText}
                    </td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'প্রেরিত' : 'Delivered'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
