import React from 'react';
import { X, Printer, Award, Download } from 'lucide-react';
import { ResultRecord, StudentRecord, calculateLetterGrade } from '../data/initialData';
import { ElDoradoLogo } from './ElDoradoLogo';
import { downloadSingleResultCardHtml } from '../utils/downloadCenter';

interface ResultCardModalProps {
  result: ResultRecord;
  student?: StudentRecord;
  lang: 'bn' | 'en';
  onClose: () => void;
}

export const ResultCardModal: React.FC<ResultCardModalProps> = ({
  result,
  student,
  lang,
  onClose,
}) => {
  const subjects = [
    { nameBn: 'বাংলা (Bangla)', nameEn: 'Bangla 1st & 2nd Paper', marks: result.bangla },
    { nameBn: 'ইংরেজি (English)', nameEn: 'English 1st & 2nd Paper', marks: result.english },
    { nameBn: 'সাধারণ গণিত (Mathematics)', nameEn: 'General Mathematics', marks: result.math },
    { nameBn: 'সাধারণ বিজ্ঞান (General Science)', nameEn: 'General Science', marks: result.science },
    {
      nameBn: 'বাংলাদেশ ও বিশ্বপরিচয় (BGS)',
      nameEn: 'Bangladesh & Global Studies',
      marks: result.bgs,
    },
    {
      nameBn: 'ধর্ম ও নৈতিক শিক্ষা (Religion)',
      nameEn: 'Religion & Moral Education',
      marks: result.religion,
    },
    {
      nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি (ICT)',
      nameEn: 'Information & Comm. Technology',
      marks: result.ict,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-8">
        {/* Top Action Bar */}
        <div className="px-6 py-3 bg-neutral-100 dark:bg-slate-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <Award className="w-4 h-4 text-red-700 dark:text-red-400" />
            <span>
              {lang === 'bn'
                ? 'অফিসিয়াল একাডেমিক ট্রান্সক্রিপ্ট ও অভিভাবক প্রগ্রেস রিপোর্ট'
                : 'Official Academic Result Card & Guardian Progress Report'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSingleResultCardHtml(result, student)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রেজাল্ট ডাউনলোড' : 'Download'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রেজাল্ট কার্ড প্রিন্ট' : 'Print Marksheet'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Marksheet Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* School Seal & Banner Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-5 border-b-2 border-red-700 text-center sm:text-left">
            <ElDoradoLogo size={84} />
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'এল্ ডরাডো মডেল স্কুল (El Dorado Model School)'
                  : 'El Dorado Model School (এল্ ডরাডো মডেল স্কুল)'}
              </h2>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                {lang === 'bn'
                  ? 'জ্ঞানই আলো · স্থাপিতঃ ২০০৯ খ্রীঃ · পড় তোমার প্রভুর নামে'
                  : 'Knowledge is Light · Established: 2009 AD · Read in the name of your Lord'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {lang === 'bn'
                  ? 'বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা'
                  : 'Burirpara, Zirabo, Ashulia, Savar, Dhaka'}
              </p>
              <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">
                {result.examTitle}
              </p>
            </div>
            <div className="text-center border border-neutral-200 dark:border-neutral-800 rounded-lg px-4 py-2.5">
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'প্রাপ্ত জিপিএ (GPA)' : 'Cumulative GPA'}
              </div>
              <div className="text-2xl font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                {result.gpa.toFixed(2)}
              </div>
              <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {lang === 'bn' ? 'গ্রেড:' : 'Grade:'} {result.grade}
              </div>
            </div>
          </div>

          {/* Student Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block">
                {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
              </span>
              <strong className="text-neutral-900 dark:text-white font-semibold">
                {lang === 'bn' ? result.studentNameBn : result.studentNameEn}
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block">
                {lang === 'bn' ? 'রোল নম্বর' : 'Roll Number'}
              </span>
              <strong className="font-mono tabular-nums text-neutral-900 dark:text-white font-semibold">
                {result.rollNo}
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block">
                {lang === 'bn' ? 'শ্রেণি ও শাখা' : 'Class & Section'}
              </span>
              <strong className="text-neutral-900 dark:text-white font-semibold">
                {result.className} {student ? `· ${student.section}` : ''}
              </strong>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400 block">
                {lang === 'bn' ? 'মোট প্রাপ্ত নম্বর' : 'Total Marks'}
              </span>
              <strong className="font-mono tabular-nums text-neutral-900 dark:text-white font-semibold">
                {result.totalMarks} / 700
              </strong>
            </div>
          </div>

          {/* Subject-wise Marksheet Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400">
                  <th className="py-2.5 pr-3 font-semibold">
                    {lang === 'bn' ? 'বিষয়ের নাম (Subject)' : 'Subject Title'}
                  </th>
                  <th className="py-2.5 px-3 text-right font-semibold">
                    {lang === 'bn' ? 'পূর্ণমান' : 'Full Marks'}
                  </th>
                  <th className="py-2.5 px-3 text-right font-semibold">
                    {lang === 'bn' ? 'প্রাপ্ত নম্বর' : 'Obtained'}
                  </th>
                  <th className="py-2.5 px-3 text-right font-semibold">
                    {lang === 'bn' ? 'লেটার গ্রেড' : 'Letter Grade'}
                  </th>
                  <th className="py-2.5 pl-3 text-right font-semibold">
                    {lang === 'bn' ? 'গ্রেড পয়েন্ট' : 'Grade Point'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {subjects.map((sub, idx) => {
                  const g = calculateLetterGrade(sub.marks);
                  return (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 pr-3 font-medium text-neutral-900 dark:text-white">
                        {lang === 'bn' ? sub.nameBn : sub.nameEn}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-500">
                        100
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                        {sub.marks}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                        {g.grade}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                        {g.point.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 font-semibold text-neutral-900 dark:text-white">
                  <td className="py-3 pr-3">
                    {lang === 'bn' ? 'সর্বমোট ও চূড়ান্ত ফলাফল' : 'Grand Total & Final Standing'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">700</td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">{result.totalMarks}</td>
                  <td className="py-3 px-3 text-right font-mono">{result.grade}</td>
                  <td className="py-3 pl-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                    GPA {result.gpa.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Guardian Progress Metrics & Teacher Evaluation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'উপস্থিতির হার (Attendance):' : 'Class Attendance Rate:'}
              </span>
              <div className="mt-1 flex items-center justify-between font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                <span>{student ? student.attendanceRate : 95}%</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {lang === 'bn' ? 'নিয়মিত' : 'Regular'}
                </span>
              </div>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'বাড়ির কাজ (Homework):' : 'Homework Completion:'}
              </span>
              <div className="mt-1 font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                {result.homeworkScore}%
              </div>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'আচরণ ও শৃঙ্খলা (Conduct):' : 'Discipline & Behavior:'}
              </span>
              <div className="mt-1 font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                {result.behaviorScore}%
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-neutral-50 dark:bg-slate-800/60 border border-neutral-200 dark:border-neutral-800 p-3.5 text-xs">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
              {lang === 'bn'
                ? 'শ্রেণি শিক্ষকের মন্তব্য (Class Teacher Evaluation for Guardian):'
                : 'Class Teacher Remarks for Guardian:'}
            </span>
            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {lang === 'bn' ? result.teacherRemarksBn : result.teacherRemarksEn}
            </p>
          </div>

          {/* Signature Footer */}
          <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
            <div className="border-t border-neutral-300 dark:border-neutral-700 pt-1.5">
              {lang === 'bn' ? 'শ্রেণি শিক্ষকের স্বাক্ষর' : 'Class Teacher Signature'}
            </div>
            <div className="border-t border-neutral-300 dark:border-neutral-700 pt-1.5">
              {lang === 'bn' ? 'অভিভাবকের স্বাক্ষর' : 'Guardian Signature'}
            </div>
            <div className="border-t border-neutral-300 dark:border-neutral-700 pt-1.5">
              {lang === 'bn' ? 'প্রধান শিক্ষকের স্বাক্ষর' : 'Headmaster Signature'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
