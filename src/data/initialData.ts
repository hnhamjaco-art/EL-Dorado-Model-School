export interface StudentRecord {
  id: string;
  rollNo: string;
  nameBn: string;
  nameEn: string;
  className: string;
  section: string;
  guardianName: string;
  guardianPhone: string;
  monthlyFee: number;
  totalFee: number;
  paidAmount: number;
  dueAmount: number;
  attendanceRate: number;
  gpa: number;
  meritPosition: number;
  status: 'active' | 'graduated' | 'transferred';
  authorId: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  className: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'rocket' | 'cash';
  walletNumber: string;
  transactionId: string;
  month: string;
  status: 'completed' | 'refunded';
  payerUid: string;
  dateStr: string;
}

export interface NoticeRecord {
  id: string;
  titleBn: string;
  titleEn: string;
  contentBn: string;
  contentEn: string;
  category: 'academic' | 'exam' | 'fee' | 'holiday' | 'general';
  priority: 'normal' | 'important' | 'urgent';
  dateStr: string;
  authorName: string;
  authorId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  rollNo: string;
  studentName: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  markedByUid: string;
}

export interface ResultRecord {
  id: string;
  studentId: string;
  rollNo: string;
  studentNameBn: string;
  studentNameEn: string;
  className: string;
  examTitle: string;
  bangla: number;
  english: number;
  math: number;
  science: number;
  bgs: number;
  religion: number;
  ict: number;
  totalMarks: number;
  gpa: number;
  grade: 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F';
  teacherRemarksBn: string;
  teacherRemarksEn: string;
  homeworkScore: number;
  behaviorScore: number;
  authorId: string;
}

export interface MCQQuestion {
  id: string;
  questionBn: string;
  questionEn: string;
  optionsBn: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationBn: string;
  explanationEn: string;
}

export interface OnlineExamRecord {
  id: string;
  titleBn: string;
  titleEn: string;
  subjectBn: string;
  subjectEn: string;
  className: string;
  durationMinutes: number;
  totalMarks: number;
  status: 'published' | 'archived';
  authorId: string;
  questions: MCQQuestion[];
}

export interface ExamAttemptRecord {
  id: string;
  examId: string;
  examTitle: string;
  rollNo: string;
  studentName: string;
  className: string;
  score: number;
  totalMarks: number;
  percentage: number;
  studentUid: string;
  dateStr: string;
}

export interface SupportMessageRecord {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole: 'guardian' | 'student' | 'teacher' | 'admin';
  text: string;
  replyText: string;
  status: 'open' | 'resolved';
  timeStr: string;
}

export const SCHOOL_CLASSES = [
  'Play',
  'Nursery',
  'KG',
  'Class One',
  'Class Two',
  'Class Three',
  'Class Four',
  'Class Five',
  'Class Six',
  'Class Seven',
  'Class Eight',
  'Class Nine',
  'Class Ten',
];

// Clean empty initial arrays: no pre-filled student names and no pre-filled money amounts.
export const INITIAL_STUDENTS: StudentRecord[] = [];

export const INITIAL_PAYMENTS: PaymentRecord[] = [];

export const INITIAL_RESULTS: ResultRecord[] = [];

export const INITIAL_NOTICES: NoticeRecord[] = [
  {
    id: 'not-1',
    titleBn: 'এল ডরাডো মডেল স্কুল — ডিজিটাল পোর্টালে স্বাগতম',
    titleEn: 'Welcome to El Dorado Model School Digital Portal',
    contentBn:
      'বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা। “ভর্তি ও ৬০০+ শিক্ষার্থী এন্ট্রি” মেনু থেকে নতুন শিক্ষার্থী ভর্তি, এক্সেল/CSV আপলোড এবং প্রতিদিনের বেতন ও উপস্থিতির হিসাব কাস্টমাইজ করুন।',
    contentEn:
      'Burirpara, Zirabo, Ashulia, Savar, Dhaka. Use the "Admission & 600+ Student Entry" tab to enroll new students, bulk import via Excel/CSV, and customize daily tuition and attendance records.',
    category: 'general',
    priority: 'important',
    dateStr: '2026-10-08',
    authorName: 'প্রিন্সিপাল অফিস · Principal Office',
    authorId: 'system',
  },
];

export const INITIAL_EXAMS: OnlineExamRecord[] = [
  {
    id: 'exam-math-10',
    titleBn: 'সাধারণ গণিত ও বীজগণিত মডেল কুইজ',
    titleEn: 'General Mathematics & Algebra Model Quiz',
    subjectBn: 'গণিত (Mathematics)',
    subjectEn: 'Mathematics',
    className: 'All Classes',
    durationMinutes: 10,
    totalMarks: 50,
    status: 'published',
    authorId: 'system',
    questions: [
      {
        id: 'q1',
        questionBn: 'যদি x + 1/x = 4 হয়, তবে x² + 1/x² এর মান কত?',
        questionEn: 'If x + 1/x = 4, what is the value of x² + 1/x²?',
        optionsBn: ['১২ (12)', '১৪ (14)', '১৬ (16)', '১৮ (18)'],
        optionsEn: ['12', '14', '16', '18'],
        correctIndex: 1,
        explanationBn: 'সূত্র অনুযায়ী: x² + 1/x² = (x + 1/x)² - 2 = 4² - 2 = 16 - 2 = 14.',
        explanationEn: 'By formula: x² + 1/x² = (x + 1/x)² - 2 = 4² - 2 = 16 - 2 = 14.',
      },
      {
        id: 'q2',
        questionBn: 'সমকোণী ত্রিভুজের সূক্ষ্মকোণদ্বয়ের সমষ্টি কত ডিগ্রি?',
        questionEn: 'What is the sum of the two acute angles of a right-angled triangle?',
        optionsBn: ['৪৫° (45°)', '৬০° (60°)', '৯০° (90°)', '১৮০° (180°)'],
        optionsEn: ['45°', '60°', '90°', '180°'],
        correctIndex: 2,
        explanationBn: 'ত্রিভুজের তিন কোণের সমষ্টি ১৮০° এবং সমকোণ ৯০° হওয়ায় অপর দুই সূক্ষ্মকোণের সমষ্টি ৯০°।',
        explanationEn: 'Since the sum of angles is 180° and one angle is 90°, the two acute angles sum to 90°.',
      },
      {
        id: 'q3',
        questionBn: 'বৃত্তের ব্যাস ৩ গুণ বৃদ্ধি পেলে ক্ষেত্রফল কত গুণ বৃদ্ধি পাবে?',
        questionEn: 'If the diameter of a circle increases by 3 times, by how many times does its area increase?',
        optionsBn: ['৩ গুণ (3x)', '৬ গুণ (6x)', '৯ গুণ (9x)', '১২ গুণ (12x)'],
        optionsEn: ['3 times', '6 times', '9 times', '12 times'],
        correctIndex: 2,
        explanationBn: 'বৃত্তের ক্ষেত্রফল πr² হওয়ায় ব্যাসার্ধ বা ব্যাস ৩ গুণ হলে ক্ষেত্রফল ৩² = ৯ গুণ হবে।',
        explanationEn: 'Since Area = πr², scaling radius/diameter by 3 scales the area by 3² = 9 times.',
      },
      {
        id: 'q4',
        questionBn: 'log₁₀(1000) এর মান নিচের কোনটি?',
        questionEn: 'What is the value of log₁₀(1000)?',
        optionsBn: ['১ (1)', '২ (2)', '৩ (3)', '১০ (10)'],
        optionsEn: ['1', '2', '3', '10'],
        correctIndex: 2,
        explanationBn: '1000 = 10³ সুতরাং log₁₀(10³) = 3.',
        explanationEn: '1000 = 10³, therefore log₁₀(10³) = 3.',
      },
      {
        id: 'q5',
        questionBn: '২, ৫, ৮, ১১, ... সমান্তর ধারার ১০ম পদ কত?',
        questionEn: 'What is the 10th term of the arithmetic progression 2, 5, 8, 11, ...?',
        optionsBn: ['২৬ (26)', '২৯ (29)', '৩২ (32)', '৩৫ (35)'],
        optionsEn: ['26', '29', '32', '35'],
        correctIndex: 1,
        explanationBn: 'n-তম পদ = a + (n - 1)d = 2 + (10 - 1)×3 = 2 + 27 = 29.',
        explanationEn: 'nth term = a + (n - 1)d = 2 + (10 - 1)×3 = 2 + 27 = 29.',
      },
    ],
  },
];

export function calculateLetterGrade(marks: number): { grade: 'A+' | 'A' | 'A-' | 'B' | 'C' | 'D' | 'F'; point: number } {
  if (marks >= 80) return { grade: 'A+', point: 5.0 };
  if (marks >= 70) return { grade: 'A', point: 4.0 };
  if (marks >= 60) return { grade: 'A-', point: 3.5 };
  if (marks >= 50) return { grade: 'B', point: 3.0 };
  if (marks >= 40) return { grade: 'C', point: 2.0 };
  if (marks >= 33) return { grade: 'D', point: 1.0 };
  return { grade: 'F', point: 0.0 };
}
