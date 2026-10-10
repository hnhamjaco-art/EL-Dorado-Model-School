import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, XCircle, Play, Plus, Award } from 'lucide-react';
import { OnlineExamRecord, ExamAttemptRecord, StudentRecord } from '../data/initialData';

interface OnlineExamViewProps {
  exams: OnlineExamRecord[];
  attempts: ExamAttemptRecord[];
  students: StudentRecord[];
  lang: 'bn' | 'en';
  isTeacherMode: boolean;
  onSubmitAttempt: (attempt: Omit<ExamAttemptRecord, 'id' | 'studentUid' | 'dateStr'>) => Promise<void>;
  onCreateExam: (exam: {
    titleBn: string;
    titleEn: string;
    subjectBn: string;
    subjectEn: string;
    className: string;
    durationMinutes: number;
    totalMarks: number;
  }) => Promise<void>;
}

export const OnlineExamView: React.FC<OnlineExamViewProps> = ({
  exams,
  attempts,
  students,
  lang,
  isTeacherMode,
  onSubmitAttempt,
  onCreateExam,
}) => {
  const [activeExam, setActiveExam] = useState<OnlineExamRecord | null>(null);
  const [selectedStudentRoll, setSelectedStudentRoll] = useState<string>(
    students[0]?.rollNo || '101'
  );
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    totalMarks: number;
    percentage: number;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newExamForm, setNewExamForm] = useState({
    titleBn: '',
    titleEn: '',
    subjectBn: 'গণিত (Mathematics)',
    subjectEn: 'Mathematics',
    className: 'Class Ten',
    durationMinutes: 15,
    totalMarks: 50,
  });

  useEffect(() => {
    if (!activeExam || submittedResult) return;
    if (secondsLeft <= 0) {
      handleFinishExam();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, secondsLeft, submittedResult]);

  const startExam = (exam: OnlineExamRecord) => {
    setActiveExam(exam);
    setAnswers({});
    setSubmittedResult(null);
    setSecondsLeft(exam.durationMinutes * 60);
  };

  const handleFinishExam = async () => {
    if (!activeExam || submittedResult) return;
    const questions = activeExam.questions;
    const marksPerQuestion =
      questions.length > 0 ? activeExam.totalMarks / questions.length : 10;

    let correctCount = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round(correctCount * marksPerQuestion);
    const percentage = Math.round((score / activeExam.totalMarks) * 100);
    setSubmittedResult({ score, totalMarks: activeExam.totalMarks, percentage });

    const studentObj =
      students.find((s) => s.rollNo === selectedStudentRoll) || students[0];

    await onSubmitAttempt({
      examId: activeExam.id,
      examTitle: lang === 'bn' ? activeExam.titleBn : activeExam.titleEn,
      rollNo: studentObj ? studentObj.rollNo : selectedStudentRoll,
      studentName: studentObj
        ? `${studentObj.nameBn} / ${studentObj.nameEn}`
        : `Roll ${selectedStudentRoll}`,
      className: studentObj ? studentObj.className : activeExam.className,
      score,
      totalMarks: activeExam.totalMarks,
      percentage,
    });
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamForm.titleBn.trim()) return;
    await onCreateExam({
      ...newExamForm,
      titleEn: newExamForm.titleEn.trim() || newExamForm.titleBn.trim(),
    });
    setNewExamForm({
      titleBn: '',
      titleEn: '',
      subjectBn: 'গণিত (Mathematics)',
      subjectEn: 'Mathematics',
      className: 'Class Ten',
      durationMinutes: 15,
      totalMarks: 50,
    });
    setShowCreateModal(false);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (activeExam) {
    return (
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-slate-900 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
              {lang === 'bn' ? activeExam.titleBn : activeExam.titleEn}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {lang === 'bn' ? activeExam.subjectBn : activeExam.subjectEn} ·{' '}
              {activeExam.className} ·{' '}
              {lang === 'bn'
                ? `পূর্ণমান: ${activeExam.totalMarks}`
                : `Total Marks: ${activeExam.totalMarks}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!submittedResult && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3.5 py-1.5 text-sm font-mono tabular-nums font-bold text-red-700 dark:text-red-400">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
            )}
            <button
              onClick={() => setActiveExam(null)}
              className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-800"
            >
              {lang === 'bn' ? 'পরীক্ষা তালিকা' : 'Back to Exams'}
            </button>
          </div>
        </div>

        {submittedResult && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {lang === 'bn'
                    ? 'অনলাইন পরীক্ষা সম্পন্ন হয়েছে!'
                    : 'Online Examination Completed!'}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  {lang === 'bn'
                    ? 'আপনার উত্তরপত্র স্বয়ংক্রিয়ভাবে মূল্যায়ন ও ডাটাবেসে সংরক্ষণ করা হয়েছে।'
                    : 'Your answers have been auto-graded and saved to the school database.'}
                </p>
              </div>
            </div>
            <div className="text-right font-mono tabular-nums">
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {submittedResult.score} / {submittedResult.totalMarks} ({submittedResult.percentage}
                %)
              </div>
              <div className="text-xs text-neutral-500">
                {submittedResult.percentage >= 80
                  ? 'Grade: A+ (Outstanding)'
                  : submittedResult.percentage >= 60
                    ? 'Grade: A (Good)'
                    : 'Completed'}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {activeExam.questions.map((q, qIdx) => {
            const selectedOpt = answers[q.id];
            return (
              <div
                key={q.id}
                className="pb-5 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0"
              >
                <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
                  <span className="font-mono tabular-nums mr-2">{qIdx + 1}.</span>
                  {lang === 'bn' ? q.questionBn : q.questionEn}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(lang === 'bn' ? q.optionsBn : q.optionsEn).map((opt, optIdx) => {
                    const isSelected = selectedOpt === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let btnStyle =
                      'border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-slate-800';
                    if (submittedResult) {
                      if (isCorrect) {
                        btnStyle =
                          'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        btnStyle =
                          'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300';
                      }
                    } else if (isSelected) {
                      btnStyle =
                        'border-red-600 bg-red-50/70 dark:bg-red-950/40 text-neutral-900 dark:text-white font-semibold';
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        disabled={!!submittedResult}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                        className={`px-3.5 py-2.5 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {submittedResult && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        {submittedResult && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {submittedResult && (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <strong className="text-neutral-700 dark:text-neutral-300">
                      {lang === 'bn' ? 'ব্যাখ্যা:' : 'Explanation:'}
                    </strong>{' '}
                    {lang === 'bn' ? q.explanationBn : q.explanationEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {!submittedResult && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              {lang === 'bn'
                ? `উত্তর প্রদান করা হয়েছে: ${Object.keys(answers).length} / ${activeExam.questions.length}`
                : `Answered: ${Object.keys(answers).length} / ${activeExam.questions.length}`}
            </span>
            <button
              type="button"
              onClick={handleFinishExam}
              className="rounded-lg bg-red-700 hover:bg-red-800 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
            >
              {lang === 'bn' ? 'উত্তরপত্র জমা দিন (Submit Exam)' : 'Submit Final Answers'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar for Student Selector & Teacher Create Exam */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
            {lang === 'bn'
              ? 'অনলাইন পরীক্ষা ও এমসিকিউ মূল্যায়ন পোর্টাল'
              : 'Online Examination & Live MCQ Assessment Portal'}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {lang === 'bn'
              ? 'রোল নম্বর নির্বাচন করে যেকোনো বিষয়ের অনলাইন পরীক্ষায় অংশগ্রহণ করুন এবং তাৎক্ষণিক ফলাফল দেখুন'
              : 'Select student roll number to start a timed online exam with instant automated grading'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
              {lang === 'bn' ? 'পরীক্ষার্থীর রোল:' : 'Examinee Roll:'}
            </span>
            {students.length > 0 ? (
              <select
                value={selectedStudentRoll}
                onChange={(e) => setSelectedStudentRoll(e.target.value)}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.rollNo}>
                    Roll {st.rollNo} — {st.nameBn}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedStudentRoll}
                onChange={(e) => setSelectedStudentRoll(e.target.value)}
                placeholder={lang === 'bn' ? 'রোল লিখুন' : 'Enter Roll'}
                className="w-28 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
              />
            )}
          </div>

          {isTeacherMode && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন পরীক্ষা যোগ করুন' : 'Create Online Exam'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Available Online Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exams.map((exam) => (
          <div
            key={exam.id}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between"
          >
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <span>{lang === 'bn' ? exam.subjectBn : exam.subjectEn}</span>
                <span>·</span>
                <span>{exam.className}</span>
              </div>
              <h3 className="mt-1.5 text-sm font-bold text-neutral-900 dark:text-white">
                {lang === 'bn' ? exam.titleBn : exam.titleEn}
              </h3>
              <div className="mt-3 flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
                <span>
                  {lang === 'bn' ? 'সময়:' : 'Time:'} {exam.durationMinutes} min
                </span>
                <span>·</span>
                <span>
                  {lang === 'bn' ? 'পূর্ণমান:' : 'Marks:'} {exam.totalMarks}
                </span>
                <span>·</span>
                <span>
                  {exam.questions.length} {lang === 'bn' ? 'টি প্রশ্ন' : 'Questions'}
                </span>
              </div>
            </div>

            <button
              onClick={() => startExam(exam)}
              className="mt-5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white hover:opacity-90 py-2 text-xs font-semibold text-white dark:text-neutral-900 transition-opacity"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পরীক্ষা শুরু করুন' : 'Start Online Exam'}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Recent Online Exam Attempts Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            {lang === 'bn'
              ? 'অনলাইন পরীক্ষার সাম্প্রতিক ফলাফল তালিকা'
              : 'Recent Online Examination Submissions'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
                <th className="py-2.5 px-4 font-medium">{lang === 'bn' ? 'রোল' : 'Roll'}</th>
                <th className="py-2.5 px-4 font-medium">
                  {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                </th>
                <th className="py-2.5 px-4 font-medium">
                  {lang === 'bn' ? 'পরীক্ষার নাম' : 'Exam Title'}
                </th>
                <th className="py-2.5 px-4 text-right font-medium">
                  {lang === 'bn' ? 'প্রাপ্ত নম্বর' : 'Score'}
                </th>
                <th className="py-2.5 px-4 text-right font-medium">
                  {lang === 'bn' ? 'শতকরা হার' : 'Percentage'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    {lang === 'bn'
                      ? 'এখনো কোনো অনলাইন পরীক্ষা জমা দেওয়া হয়নি। উপরে "পরীক্ষা শুরু করুন" বাটনে ক্লিক করুন।'
                      : 'No online exam attempts recorded yet. Click "Start Online Exam" above.'}
                  </td>
                </tr>
              ) : (
                attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                      {att.rollNo}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-800 dark:text-neutral-200">
                      {att.studentName}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-600 dark:text-neutral-300">
                      {att.examTitle}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                      {att.score} / {att.totalMarks}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                      {att.percentage}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Exam Modal for Teachers */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-4">
              {lang === 'bn' ? 'নতুন অনলাইন পরীক্ষা তৈরি করুন' : 'Create New Online Exam'}
            </h3>
            <form onSubmit={handleCreateExamSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {lang === 'bn' ? 'পরীক্ষার শিরোনাম (বাংলা)' : 'Exam Title (Bangla)'}
                </label>
                <input
                  type="text"
                  required
                  value={newExamForm.titleBn}
                  onChange={(e) => setNewExamForm({ ...newExamForm, titleBn: e.target.value })}
                  placeholder="যেমন: বার্ষিক মডেল টেস্ট - ২০২৬"
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {lang === 'bn' ? 'পরীক্ষার শিরোনাম (ইংরেজি)' : 'Exam Title (English)'}
                </label>
                <input
                  type="text"
                  value={newExamForm.titleEn}
                  onChange={(e) => setNewExamForm({ ...newExamForm, titleEn: e.target.value })}
                  placeholder="e.g., Annual Model Test - 2026"
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {lang === 'bn' ? 'বিষয়' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newExamForm.subjectBn}
                    onChange={(e) =>
                      setNewExamForm({
                        ...newExamForm,
                        subjectBn: e.target.value,
                        subjectEn: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {lang === 'bn' ? 'শ্রেণি' : 'Class'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newExamForm.className}
                    onChange={(e) => setNewExamForm({ ...newExamForm, className: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {lang === 'bn' ? 'সময় (মিনিট)' : 'Duration (Min)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={newExamForm.durationMinutes}
                    onChange={(e) =>
                      setNewExamForm({ ...newExamForm, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {lang === 'bn' ? 'পূর্ণমান' : 'Total Marks'}
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={200}
                    value={newExamForm.totalMarks}
                    onChange={(e) =>
                      setNewExamForm({ ...newExamForm, totalMarks: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-neutral-700 dark:text-neutral-300"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-red-700 hover:bg-red-800 px-4 py-2 font-semibold text-white"
                >
                  {lang === 'bn' ? 'প্রকাশ করুন' : 'Publish Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
