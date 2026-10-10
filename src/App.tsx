import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  CreditCard,
  FileText,
  CheckSquare,
  GraduationCap,
  Award,
  Shield,
  Users,
  LogIn,
  LogOut,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  UserPlus,
  Trash2,
  QrCode,
  Download,
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  db,
  auth,
  signInWithGoogle,
  signOutUser,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  User,
} from './firebase';
import { ElDoradoLogo } from './components/ElDoradoLogo';
import { PaymentModal } from './components/PaymentModal';
import { QrReceiptModal, QrVerificationBar } from './components/QrReceiptModal';
import { ResultCardModal } from './components/ResultCardModal';
import { OnlineExamView } from './components/OnlineExamView';
import { SecurityBackupView } from './components/SecurityBackupView';
import { LiveSupportChat } from './components/LiveSupportChat';
import { AdmissionBulkManager } from './components/AdmissionBulkManager';
import {
  AutomatedFeeReminder,
  SmsReminderLog,
  formatReminderMessage,
} from './components/AutomatedFeeReminder';
import { OnlineDownloadCenterModal } from './components/OnlineDownloadCenterModal';
import {
  PWAInstallButton,
  OfflineIndicator,
  useOnlineStatus,
  usePWAInstall,
} from './hooks/usePWAInstall';
import {
  downloadStandaloneSchoolApp,
  downloadStudentsFeeCsv,
  downloadPaymentsCsv,
  downloadResultsCsv,
  downloadAttendanceCsv,
} from './utils/downloadCenter';
import {
  INITIAL_STUDENTS,
  INITIAL_PAYMENTS,
  INITIAL_NOTICES,
  INITIAL_RESULTS,
  INITIAL_EXAMS,
  SCHOOL_CLASSES,
  StudentRecord,
  PaymentRecord,
  NoticeRecord,
  ResultRecord,
  OnlineExamRecord,
  ExamAttemptRecord,
  SupportMessageRecord,
  calculateLetterGrade,
} from './data/initialData';

type TabId =
  | 'dashboard'
  | 'admission'
  | 'fees'
  | 'notices'
  | 'attendance'
  | 'results'
  | 'exams'
  | 'teacher'
  | 'security';

function loadCached<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore storage parse error
  }
  return fallback;
}

function saveCached<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota error
  }
}

export default function App() {
  const [lang, setLang] = useState<'bn' | 'en'>(() =>
    loadCached<'bn' | 'en'>('edms_v2_lang', 'bn')
  );
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    loadCached<boolean>('edms_v2_dark', false)
  );
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Clean customizable state (no pre-filled student names or money amounts)
  const [students, setStudents] = useState<StudentRecord[]>(() =>
    loadCached('edms_v2_students', INITIAL_STUDENTS)
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() =>
    loadCached('edms_v2_payments', INITIAL_PAYMENTS)
  );
  const [notices, setNotices] = useState<NoticeRecord[]>(() =>
    loadCached('edms_v2_notices', INITIAL_NOTICES)
  );
  const [results, setResults] = useState<ResultRecord[]>(() =>
    loadCached('edms_v2_results', INITIAL_RESULTS)
  );
  const [exams, setExams] = useState<OnlineExamRecord[]>(() =>
    loadCached('edms_v2_exams', INITIAL_EXAMS)
  );
  const [examAttempts, setExamAttempts] = useState<ExamAttemptRecord[]>(() =>
    loadCached('edms_v2_exam_attempts', [])
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, 'present' | 'absent' | 'late' | 'leave'>
  >(() => loadCached('edms_v2_attendance_map', {}));
  const [supportMessages, setSupportMessages] = useState<SupportMessageRecord[]>(() =>
    loadCached('edms_v2_support_messages', [])
  );
  const [smsReminderLogs, setSmsReminderLogs] = useState<SmsReminderLog[]>(() =>
    loadCached('edms_v2_sms_reminder_logs', [])
  );

  // Search, Filters & Modals
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [rollSearchInput, setRollSearchInput] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [feeStatusFilter, setFeeStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [noticeCategoryFilter, setNoticeCategoryFilter] = useState<string>('all');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [payingStudent, setPayingStudent] = useState<StudentRecord | null>(null);
  const [viewingQrReceipt, setViewingQrReceipt] = useState<PaymentRecord | null>(null);
  const [viewingResult, setViewingResult] = useState<ResultRecord | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState<boolean>(false);
  const [showDownloadCenter, setShowDownloadCenter] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const { isInstallable, install: installNativePwa } = usePWAInstall();

  // 2FA Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(() =>
    loadCached('edms_v2_2fa_enabled', false)
  );
  const [twoFactorVerified, setTwoFactorVerified] = useState<boolean>(false);

  // Teacher Panel Forms (Notice & Marks Entry)
  const [newNoticeForm, setNewNoticeForm] = useState({
    titleBn: '',
    titleEn: '',
    contentBn: '',
    contentEn: '',
    category: 'academic' as NoticeRecord['category'],
    priority: 'important' as NoticeRecord['priority'],
  });

  const [marksUpdateForm, setMarksUpdateForm] = useState({
    rollNo: '',
    bangla: '',
    english: '',
    math: '',
    science: '',
    bgs: '',
    religion: '',
    ict: '',
    teacherRemarksBn: '',
  });

  const isOnline = useOnlineStatus();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveCached('edms_v2_dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    saveCached('edms_v2_lang', lang);
  }, [lang]);

  // Persist local offline cache whenever state updates
  useEffect(() => {
    saveCached('edms_v2_students', students);
  }, [students]);
  useEffect(() => {
    saveCached('edms_v2_payments', payments);
  }, [payments]);
  useEffect(() => {
    saveCached('edms_v2_notices', notices);
  }, [notices]);
  useEffect(() => {
    saveCached('edms_v2_results', results);
  }, [results]);
  useEffect(() => {
    saveCached('edms_v2_exams', exams);
  }, [exams]);
  useEffect(() => {
    saveCached('edms_v2_exam_attempts', examAttempts);
  }, [examAttempts]);
  useEffect(() => {
    saveCached('edms_v2_attendance_map', attendanceMap);
  }, [attendanceMap]);
  useEffect(() => {
    saveCached('edms_v2_support_messages', supportMessages);
  }, [supportMessages]);
  useEffect(() => {
    saveCached('edms_v2_sms_reminder_logs', smsReminderLogs);
  }, [smsReminderLogs]);

  const triggerToast = (msg: string) => {
    setToastAlert(msg);
    setTimeout(() => {
      setToastAlert((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners when authenticated (no dummy student seeding!)
  useEffect(() => {
    if (!isAuthReady || !user) return;

    const uid = user.uid;

    const studentsQuery = query(collection(db, 'students'), where('authorId', '==', uid));
    const unsubStudents = onSnapshot(
      studentsQuery,
      (snap) => {
        if (!snap.empty) {
          const loaded: StudentRecord[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              rollNo: data.rollNo,
              nameBn: data.nameBn,
              nameEn: data.nameEn,
              className: data.className,
              section: data.section,
              guardianName: data.guardianName,
              guardianPhone: data.guardianPhone,
              monthlyFee: data.monthlyFee,
              totalFee: data.totalFee,
              paidAmount: data.paidAmount,
              dueAmount: data.dueAmount,
              attendanceRate: data.attendanceRate,
              gpa: data.gpa,
              meritPosition: data.meritPosition,
              status: data.status,
              authorId: data.authorId,
            };
          });
          loaded.sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
          setStudents(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'students')
    );

    const paymentsQuery = query(collection(db, 'payments'), where('payerUid', '==', uid));
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snap) => {
        if (!snap.empty) {
          const loaded: PaymentRecord[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              studentId: data.studentId,
              rollNo: data.rollNo,
              studentName: data.studentName,
              className: data.className,
              amount: data.amount,
              method: data.method,
              walletNumber: data.walletNumber,
              transactionId: data.transactionId,
              month: data.month,
              status: data.status,
              payerUid: data.payerUid,
              dateStr: new Date().toISOString().slice(0, 10),
            };
          });
          setPayments(loaded);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'payments')
    );

    return () => {
      unsubStudents();
      unsubPayments();
    };
  }, [isAuthReady, user]);

  // Roll lookup student match
  const lookedUpStudent = useMemo(() => {
    const cleanRoll = rollSearchInput.trim();
    if (!cleanRoll) return null;
    return (
      students.find((s) => s.rollNo.toLowerCase() === cleanRoll.toLowerCase()) ||
      students.find(
        (s) =>
          s.nameBn.toLowerCase().includes(cleanRoll.toLowerCase()) ||
          s.nameEn.toLowerCase().includes(cleanRoll.toLowerCase())
      ) ||
      null
    );
  }, [students, rollSearchInput]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (classFilter !== 'all' && st.className !== classFilter) return false;
      if (feeStatusFilter === 'due' && st.dueAmount <= 0) return false;
      if (feeStatusFilter === 'paid' && st.dueAmount > 0) return false;
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const matchRoll = st.rollNo.toLowerCase().includes(q);
        const matchNameBn = st.nameBn.toLowerCase().includes(q);
        const matchNameEn = st.nameEn.toLowerCase().includes(q);
        const matchGuardian = st.guardianName.toLowerCase().includes(q);
        const matchPhone = st.guardianPhone.toLowerCase().includes(q);
        if (!matchRoll && !matchNameBn && !matchNameEn && !matchGuardian && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [students, classFilter, feeStatusFilter, globalSearch]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalStudents = students.length;
    const totalCollected = students.reduce((acc, s) => acc + s.paidAmount, 0);
    const totalDue = students.reduce((acc, s) => acc + s.dueAmount, 0);
    const dueCount = students.filter((s) => s.dueAmount > 0).length;
    const avgAttendance =
      totalStudents > 0
        ? Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents)
        : 0;
    return { totalStudents, totalCollected, totalDue, dueCount, avgAttendance };
  }, [students]);

  // Add Single Student (New Admission)
  const handleAddSingleStudent = async (
    studentInput: Omit<StudentRecord, 'id' | 'authorId'>
  ) => {
    const cleanRoll = studentInput.rollNo.replace(/[^a-zA-Z0-9_\\-]/g, '') || '1';
    const newId = `std-${cleanRoll}-${Date.now().toString().slice(-5)}`;
    const newStudent: StudentRecord = {
      ...studentInput,
      id: newId,
      rollNo: cleanRoll,
      authorId: user?.uid || 'local-user',
    };

    setStudents((prev) => [...prev, newStudent]);

    if (user) {
      try {
        await setDoc(doc(db, 'students', newId), {
          rollNo: newStudent.rollNo.slice(0, 20),
          nameBn: newStudent.nameBn.slice(0, 120),
          nameEn: newStudent.nameEn.slice(0, 120),
          className: newStudent.className.slice(0, 40),
          section: newStudent.section.slice(0, 20),
          guardianName: newStudent.guardianName.slice(0, 120),
          guardianPhone:
            newStudent.guardianPhone.replace(/[^0-9+\\-]/g, '').slice(0, 20) || '01700-000000',
          monthlyFee: Math.max(0, Number(newStudent.monthlyFee) || 0),
          totalFee: Math.max(0, Number(newStudent.totalFee) || 0),
          paidAmount: Math.max(0, Number(newStudent.paidAmount) || 0),
          dueAmount: Math.max(0, Number(newStudent.dueAmount) || 0),
          attendanceRate: Math.min(100, Math.max(0, Number(newStudent.attendanceRate) || 100)),
          gpa: Math.min(5, Math.max(0, Number(newStudent.gpa) || 0)),
          meritPosition: Math.max(1, Number(newStudent.meritPosition) || 1),
          status: 'active',
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'students');
      }
    }

    triggerToast(
      lang === 'bn'
        ? `নতুন শিক্ষার্থী ভর্তি সম্পন্ন হয়েছে (রোল: ${newStudent.rollNo}, নাম: ${newStudent.nameBn})`
        : `New student enrolled (Roll: ${newStudent.rollNo}, Name: ${newStudent.nameBn})`
    );
  };

  // Add Bulk Students (Grid or Excel/CSV/Copy-Paste for 600+ Students)
  const handleAddBulkStudents = async (
    studentsList: Omit<StudentRecord, 'id' | 'authorId'>[]
  ) => {
    const nowTs = Date.now();
    const createdRecords: StudentRecord[] = studentsList.map((st, idx) => {
      const cleanRoll = st.rollNo.replace(/[^a-zA-Z0-9_\\-]/g, '') || String(idx + 1);
      return {
        ...st,
        id: `std-${cleanRoll}-${nowTs}-${idx}`,
        rollNo: cleanRoll,
        authorId: user?.uid || 'local-user',
      };
    });

    setStudents((prev) => [...prev, ...createdRecords]);

    if (user) {
      for (const st of createdRecords) {
        try {
          await setDoc(doc(db, 'students', st.id), {
            rollNo: st.rollNo.slice(0, 20),
            nameBn: st.nameBn.slice(0, 120),
            nameEn: st.nameEn.slice(0, 120),
            className: st.className.slice(0, 40),
            section: st.section.slice(0, 20),
            guardianName: st.guardianName.slice(0, 120),
            guardianPhone:
              st.guardianPhone.replace(/[^0-9+\\-]/g, '').slice(0, 20) || '01700-000000',
            monthlyFee: Math.max(0, Number(st.monthlyFee) || 0),
            totalFee: Math.max(0, Number(st.totalFee) || 0),
            paidAmount: Math.max(0, Number(st.paidAmount) || 0),
            dueAmount: Math.max(0, Number(st.dueAmount) || 0),
            attendanceRate: Math.min(100, Math.max(0, Number(st.attendanceRate) || 100)),
            gpa: Math.min(5, Math.max(0, Number(st.gpa) || 0)),
            meritPosition: Math.max(1, Number(st.meritPosition) || 1),
            status: 'active',
            authorId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'students');
        }
      }
    }

    triggerToast(
      lang === 'bn'
        ? `একসাথে ${createdRecords.length} জন শিক্ষার্থীর তথ্য সফলভাবে যুক্ত ও সংরক্ষণ করা হয়েছে!`
        : `Successfully imported and saved ${createdRecords.length} student records!`
    );
  };

  // Customize / Update Any Student
  const handleUpdateStudent = async (updated: StudentRecord) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));

    if (user && updated.authorId === user.uid) {
      try {
        await updateDoc(doc(db, 'students', updated.id), {
          nameBn: updated.nameBn.slice(0, 120),
          nameEn: (updated.nameEn || updated.nameBn).slice(0, 120),
          className: updated.className.slice(0, 40),
          section: updated.section.slice(0, 20),
          guardianName: updated.guardianName.slice(0, 120),
          guardianPhone:
            updated.guardianPhone.replace(/[^0-9+\\-]/g, '').slice(0, 20) || '01700-000000',
          monthlyFee: Math.max(0, Number(updated.monthlyFee) || 0),
          totalFee: Math.max(0, Number(updated.totalFee) || 0),
          paidAmount: Math.max(0, Number(updated.paidAmount) || 0),
          dueAmount: Math.max(0, Number(updated.dueAmount) || 0),
          attendanceRate: Math.min(100, Math.max(0, Number(updated.attendanceRate) || 100)),
          gpa: Math.min(5, Math.max(0, Number(updated.gpa) || 0)),
          meritPosition: Math.max(1, Number(updated.meritPosition) || 1),
          status: updated.status,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, 'students');
      }
    }

    triggerToast(
      lang === 'bn'
        ? `রোল ${updated.rollNo} (${updated.nameBn})-এর তথ্য আপডেট করা হয়েছে!`
        : `Updated record for Roll ${updated.rollNo} (${updated.nameBn})!`
    );
  };

  // Delete Student
  const handleDeleteStudent = async (studentId: string) => {
    const target = students.find((s) => s.id === studentId);
    setStudents((prev) => prev.filter((s) => s.id !== studentId));

    if (user && target && target.authorId === user.uid) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'students');
      }
    }

    triggerToast(
      lang === 'bn'
        ? 'শিক্ষার্থীর রেকর্ড মুছে ফেলা হয়েছে।'
        : 'Student record deleted.'
    );
  };

  const handleClearAllStudents = async () => {
    const currentList = [...students];
    setStudents([]);
    if (user) {
      for (const st of currentList) {
        if (st.authorId === user.uid) {
          try {
            await deleteDoc(doc(db, 'students', st.id));
          } catch {
            // ignore individual delete error
          }
        }
      }
    }
    triggerToast(
      lang === 'bn'
        ? 'সকল শিক্ষার্থীর তালিকা রিসেট করা হয়েছে।'
        : 'All student records have been cleared.'
    );
  };

  // Complete Payment Handler (bKash / Nagad / Rocket)
  const handleCompletePayment = async (paymentData: {
    studentId: string;
    rollNo: string;
    studentName: string;
    className: string;
    amount: number;
    method: 'bkash' | 'nagad' | 'rocket';
    walletNumber: string;
    transactionId: string;
    month: string;
  }): Promise<PaymentRecord> => {
    const payId = `pay-${Date.now()}`;
    const newRecord: PaymentRecord = {
      id: payId,
      studentId: paymentData.studentId,
      rollNo: paymentData.rollNo,
      studentName: paymentData.studentName,
      className: paymentData.className,
      amount: paymentData.amount,
      method: paymentData.method,
      walletNumber: paymentData.walletNumber,
      transactionId: paymentData.transactionId,
      month: paymentData.month,
      status: 'completed',
      payerUid: user?.uid || 'local-user',
      dateStr: new Date().toISOString().slice(0, 10),
    };

    const targetStudent = students.find((s) => s.id === paymentData.studentId);
    const newPaid = (targetStudent?.paidAmount || 0) + paymentData.amount;
    const newDue = Math.max(0, (targetStudent?.dueAmount || 0) - paymentData.amount);

    setPayments((prev) => [newRecord, ...prev]);
    setStudents((prev) =>
      prev.map((s) =>
        s.id === paymentData.studentId
          ? { ...s, paidAmount: newPaid, dueAmount: newDue }
          : s
      )
    );

    if (user && targetStudent && targetStudent.authorId === user.uid) {
      try {
        await setDoc(doc(db, 'payments', payId), {
          studentId: paymentData.studentId,
          rollNo: paymentData.rollNo,
          studentName: paymentData.studentName.slice(0, 120),
          className: paymentData.className,
          amount: paymentData.amount,
          method: paymentData.method,
          walletNumber: paymentData.walletNumber,
          transactionId: paymentData.transactionId,
          month: paymentData.month.slice(0, 60),
          status: 'completed',
          payerUid: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'students', paymentData.studentId), {
          paidAmount: newPaid,
          dueAmount: newDue,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'payments');
      }
    }

    triggerToast(
      lang === 'bn'
        ? `রোল ${paymentData.rollNo}-এর ৳${paymentData.amount.toLocaleString()} পেমেন্ট সফল হয়েছে (TrxID: ${paymentData.transactionId})`
        : `Roll ${paymentData.rollNo} payment of ৳${paymentData.amount.toLocaleString()} completed (TrxID: ${paymentData.transactionId})`
    );

    return newRecord;
  };

  // Mark Attendance Handler
  const handleMarkAttendance = async (
    student: StudentRecord,
    status: 'present' | 'absent' | 'late' | 'leave'
  ) => {
    setAttendanceMap((prev) => ({ ...prev, [student.id]: status }));
    const delta = status === 'present' ? 1 : status === 'absent' ? -1 : 0;
    const updatedRate = Math.min(100, Math.max(50, student.attendanceRate + delta));
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, attendanceRate: updatedRate } : s))
    );

    if (user && student.authorId === user.uid) {
      const attId = `att-${student.rollNo}-${attendanceDate}`;
      try {
        await setDoc(doc(db, 'attendance', attId), {
          studentId: student.id,
          rollNo: student.rollNo,
          studentName: student.nameEn.slice(0, 120),
          className: student.className,
          date: attendanceDate,
          status,
          markedByUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'attendance');
      }
    }
  };

  const handleMarkAllPresent = () => {
    const nextMap: Record<string, 'present' | 'absent' | 'late' | 'leave'> = {
      ...attendanceMap,
    };
    students.forEach((s) => {
      nextMap[s.id] = 'present';
    });
    setAttendanceMap(nextMap);
    triggerToast(
      lang === 'bn'
        ? 'সকল শিক্ষার্থীকে আজকের হাজিরায় উপস্থিত হিসেবে চিহ্নিত করা হয়েছে।'
        : 'All students marked present for today.'
    );
  };

  // Teacher: Automated Bulk / Single Fee Reminder SMS Dispatch
  const handleSendSmsReminders = async (
    logs: SmsReminderLog[],
    alsoPostNotice: boolean
  ) => {
    if (logs.length === 0) return;
    setSmsReminderLogs((prev) => [...logs, ...prev]);

    if (alsoPostNotice) {
      const totalDueSum = logs.reduce((acc, l) => acc + l.dueAmount, 0);
      const noticeId = `not-sms-${Date.now()}`;
      const record: NoticeRecord = {
        id: noticeId,
        titleBn: `বকেয়া টিউশন ফি পরিশোধের অটোমেটেড রিমাইন্ডার (${logs.length} জন শিক্ষার্থী)`,
        titleEn: `Automated Tuition Fee Due Reminder Dispatched (${logs.length} Students)`,
        contentBn: `মোট ${logs.length} জন বকেয়া শিক্ষার্থীর অভিভাবকের মোবাইল নম্বরে (মোট বকেয়া: ৳${totalDueSum.toLocaleString()}) স্বয়ংক্রিয় এসএমএস নোটিফিকেশন পাঠানো হয়েছে। বিকাশ, নগদ বা রকেট গেটওয়ের মাধ্যমে দ্রুত বকেয়া পরিশোধ করার জন্য অনুরোধ করা হলো।`,
        contentEn: `Automated SMS fee reminders have been sent to ${logs.length} guardians (Total outstanding due: BDT ${totalDueSum.toLocaleString()}). Guardians can pay conveniently via bKash, Nagad, or Rocket.`,
        category: 'fee',
        priority: 'important',
        dateStr: new Date().toISOString().slice(0, 10),
        authorName: user?.displayName || 'ফাইন্যান্স ও অ্যাকাউন্টস · Finance Desk',
        authorId: user?.uid || 'local-user',
      };
      setNotices((prev) => [record, ...prev]);

      if (user) {
        try {
          await setDoc(doc(db, 'notices', noticeId), {
            titleBn: record.titleBn.slice(0, 200),
            titleEn: record.titleEn.slice(0, 200),
            contentBn: record.contentBn.slice(0, 2000),
            contentEn: record.contentEn.slice(0, 2000),
            category: record.category,
            priority: record.priority,
            dateStr: record.dateStr,
            authorName: record.authorName.slice(0, 100),
            authorId: user.uid,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'notices');
        }
      }
    }

    triggerToast(
      lang === 'bn'
        ? `✓ ${logs.length} জন বকেয়া শিক্ষার্থীর অভিভাবকের মোবাইলে অটোমেটেড এসএমএস রিমাইন্ডার পাঠানো হয়েছে!`
        : `✓ Automated SMS fee reminders dispatched to ${logs.length} guardians!`
    );
  };

  const handleSendSingleStudentSmsReminder = (st: StudentRecord) => {
    const template =
      lang === 'bn'
        ? 'সম্মানিত অভিভাবক ({guardian}), এল ডরাডো মডেল স্কুল (বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা)-এ আপনার সন্তান {name} (রোল: {roll}, শ্রেণি: {class})-এর বকেয়া টিউশন ফি ৳{due}। অনুগ্রহ করে বিকাশ/নগদ/রকেট অথবা স্কুল অফিসে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হলো।'
        : 'Dear Guardian ({guardian}), tuition fee due for {name} (Roll: {roll}, {class}) at El Dorado Model School (Burirpara, Zirabo, Ashulia, Savar, Dhaka) is BDT {due}. Please clear the due via bKash/Nagad/Rocket or at the school office.';
    const msg = formatReminderMessage(template, st, lang);
    const logItem: SmsReminderLog = {
      id: `sms-single-${Date.now()}`,
      rollNo: st.rollNo,
      studentName: st.nameBn,
      className: st.className,
      guardianName: st.guardianName,
      guardianPhone: st.guardianPhone,
      dueAmount: st.dueAmount,
      messageText: msg,
      sentAt: new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      mode: 'single',
    };
    setSmsReminderLogs((prev) => [logItem, ...prev]);
    triggerToast(
      lang === 'bn'
        ? `✓ রোল ${st.rollNo} (${st.nameBn})-এর অভিভাবকের নম্বরে (${st.guardianPhone}) বকেয়া ৳${st.dueAmount.toLocaleString()} এর এসএমএস রিমাইন্ডার পাঠানো হয়েছে!`
        : `✓ SMS fee reminder (৳${st.dueAmount.toLocaleString()}) sent to guardian of Roll ${st.rollNo} (${st.guardianPhone})!`
    );
  };

  // Teacher: Publish Notice & Send Notification
  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeForm.titleBn.trim() || !newNoticeForm.contentBn.trim()) return;

    const noticeId = `not-${Date.now()}`;
    const record: NoticeRecord = {
      id: noticeId,
      titleBn: newNoticeForm.titleBn.trim(),
      titleEn: newNoticeForm.titleEn.trim() || newNoticeForm.titleBn.trim(),
      contentBn: newNoticeForm.contentBn.trim(),
      contentEn: newNoticeForm.contentEn.trim() || newNoticeForm.contentBn.trim(),
      category: newNoticeForm.category,
      priority: newNoticeForm.priority,
      dateStr: new Date().toISOString().slice(0, 10),
      authorName: user?.displayName || 'প্রিন্সিপাল অফিস · Principal Office',
      authorId: user?.uid || 'local-user',
    };

    setNotices((prev) => [record, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'notices', noticeId), {
          titleBn: record.titleBn.slice(0, 200),
          titleEn: record.titleEn.slice(0, 200),
          contentBn: record.contentBn.slice(0, 2000),
          contentEn: record.contentEn.slice(0, 2000),
          category: record.category,
          priority: record.priority,
          dateStr: record.dateStr,
          authorName: record.authorName.slice(0, 100),
          authorId: user.uid,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'notices');
      }
    }

    setNewNoticeForm({
      titleBn: '',
      titleEn: '',
      contentBn: '',
      contentEn: '',
      category: 'academic',
      priority: 'important',
    });

    triggerToast(
      lang === 'bn'
        ? 'নতুন নোটিশ প্রকাশিত হয়েছে এবং অভিভাবকদের কাছে নোটিফিকেশন পাঠানো হয়েছে!'
        : 'Notice published and push notification dispatched!'
    );
  };

  // Teacher: Save/Update Student Marks & Result Card
  const handleUpdateResultMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    const st =
      students.find((s) => s.rollNo === marksUpdateForm.rollNo.trim()) || students[0];
    if (!st) {
      triggerToast(
        lang === 'bn'
          ? 'আগে "ভর্তি ও ৬০০+ এন্ট্রি" মেনু থেকে শিক্ষার্থী যুক্ত করুন।'
          : 'Please add a student first under Admission & 600+ Entry.'
      );
      return;
    }

    const scores = [
      Number(marksUpdateForm.bangla) || 0,
      Number(marksUpdateForm.english) || 0,
      Number(marksUpdateForm.math) || 0,
      Number(marksUpdateForm.science) || 0,
      Number(marksUpdateForm.bgs) || 0,
      Number(marksUpdateForm.religion) || 0,
      Number(marksUpdateForm.ict) || 0,
    ];
    const totalMarks = scores.reduce((a, b) => a + b, 0);
    const points = scores.map((m) => calculateLetterGrade(m).point);
    const hasFail = points.some((p) => p === 0);
    const avgGpa = hasFail
      ? 0.0
      : Number((points.reduce((a, b) => a + b, 0) / points.length).toFixed(2));
    const overallGrade = calculateLetterGrade(Math.round(totalMarks / 7)).grade;

    const updatedResult: ResultRecord = {
      id: `res-${st.rollNo}`,
      studentId: st.id,
      rollNo: st.rollNo,
      studentNameBn: st.nameBn,
      studentNameEn: st.nameEn,
      className: st.className,
      examTitle: 'বার্ষিক ও মডেল টেস্ট পরীক্ষা ২০২৬ / Annual & Model Test 2026',
      bangla: scores[0],
      english: scores[1],
      math: scores[2],
      science: scores[3],
      bgs: scores[4],
      religion: scores[5],
      ict: scores[6],
      totalMarks,
      gpa: avgGpa,
      grade: hasFail ? 'F' : overallGrade,
      teacherRemarksBn:
        marksUpdateForm.teacherRemarksBn.trim() || 'নিয়মিত ও মনোযোগী শিক্ষার্থী।',
      teacherRemarksEn:
        marksUpdateForm.teacherRemarksBn.trim() || 'Attentive and regular student.',
      homeworkScore: 95,
      behaviorScore: 98,
      authorId: user?.uid || 'local-user',
    };

    setResults((prev) => {
      const exists = prev.some((r) => r.rollNo === st.rollNo);
      return exists
        ? prev.map((r) => (r.rollNo === st.rollNo ? updatedResult : r))
        : [updatedResult, ...prev];
    });
    setStudents((prev) =>
      prev.map((s) => (s.rollNo === st.rollNo ? { ...s, gpa: avgGpa } : s))
    );

    if (user && st.authorId === user.uid) {
      try {
        await setDoc(doc(db, 'results', updatedResult.id), {
          studentId: st.id,
          rollNo: updatedResult.rollNo,
          studentNameBn: updatedResult.studentNameBn,
          studentNameEn: updatedResult.studentNameEn,
          className: updatedResult.className,
          examTitle: updatedResult.examTitle,
          bangla: updatedResult.bangla,
          english: updatedResult.english,
          math: updatedResult.math,
          science: updatedResult.science,
          bgs: updatedResult.bgs,
          religion: updatedResult.religion,
          ict: updatedResult.ict,
          totalMarks: updatedResult.totalMarks,
          gpa: updatedResult.gpa,
          grade: updatedResult.grade,
          teacherRemarksBn: updatedResult.teacherRemarksBn.slice(0, 500),
          teacherRemarksEn: updatedResult.teacherRemarksEn.slice(0, 500),
          homeworkScore: updatedResult.homeworkScore,
          behaviorScore: updatedResult.behaviorScore,
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'results');
      }
    }

    triggerToast(
      lang === 'bn'
        ? `রোল ${st.rollNo}-এর রেজাল্ট কার্ড ও জিপিএ (${avgGpa.toFixed(2)}) সেভ হয়েছে!`
        : `Result card & GPA (${avgGpa.toFixed(2)}) saved for Roll ${st.rollNo}!`
    );
  };

  const navItems: { id: TabId; labelBn: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      labelBn: 'স্মার্ট ড্যাশবোর্ড',
      labelEn: 'Smart Overview',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'admission',
      labelBn: 'ভর্তি ও ৬০০+ শিক্ষার্থী এন্ট্রি',
      labelEn: 'Admission & 600+ Entry',
      icon: <UserPlus className="w-4 h-4" />,
    },
    {
      id: 'fees',
      labelBn: 'টিউশন ফি ও পেমেন্ট',
      labelEn: 'Tuition & Digital Pay',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'notices',
      labelBn: 'নোটিশ ও আপডেট হাব',
      labelEn: 'Notice & Alert Hub',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'attendance',
      labelBn: 'স্মার্ট অ্যাটেনডেন্স',
      labelEn: 'Smart Attendance',
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: 'results',
      labelBn: 'প্রগ্রেস ও রেজাল্ট কার্ড',
      labelEn: 'Analytics & Marksheet',
      icon: <Award className="w-4 h-4" />,
    },
    {
      id: 'exams',
      labelBn: 'লাইভ এমসিকিউ পোর্টাল',
      labelEn: 'Live Exam Portal',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'teacher',
      labelBn: 'ফ্যাকাল্টি স্টুডিও (শিক্ষক)',
      labelEn: 'Faculty Studio',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'security',
      labelBn: 'সিকিউরিটি, 2FA ও ব্যাকআপ',
      labelEn: 'Security & Cloud Vault',
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 text-neutral-900 dark:text-slate-100 flex flex-col">
      {/* Top Bar Contract (3 Zones: Brand Wordmark | Primary Nav Links | Actions) */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between gap-4 no-print">
        {/* Zone 1: Single Text Element Brand Title */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap"
        >
          {lang === 'bn' ? 'এল্ ডরাডো মডেল স্কুল' : 'El Dorado Model School'}
        </a>

        {/* Zone 2: Clean Text Navigation Links */}
        <nav className="hidden xl:flex items-center gap-6 text-xs font-medium text-neutral-600 dark:text-slate-300">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === item.id
                  ? 'text-red-700 dark:text-red-400 font-semibold underline underline-offset-8 decoration-2'
                  : 'hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {lang === 'bn' ? item.labelBn : item.labelEn}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <PWAInstallButton
            lang={lang}
            onOpenDownloadCenter={() => setShowDownloadCenter(true)}
          />

          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            title="Switch Language (বাংলা / English)"
          >
            <Globe className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
            className="relative p-2 rounded-lg border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-700 text-[10px] font-mono font-bold text-white flex items-center justify-center">
              {notices.length}
            </span>
          </button>

          {user ? (
            <button
              onClick={signOutUser}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-neutral-900 whitespace-nowrap"
              title={user.email || ''}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {user.displayName?.split(' ')[0] || (lang === 'bn' ? 'লগআউট' : 'Sign Out')}
              </span>
            </button>
          ) : (
            <button
              onClick={() => signInWithGoogle().catch(() => {})}
              className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগইন (Google)' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastAlert && (
        <div className="fixed top-16 right-4 z-50 max-w-md rounded-xl bg-emerald-700 text-white px-4 py-3 text-xs font-medium shadow-xl flex items-center gap-2.5 no-print">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastAlert}</span>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotificationsDrawer && (
        <div className="fixed top-14 right-4 z-40 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 no-print">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-slate-800 pb-2.5">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
              {lang === 'bn'
                ? 'সাম্প্রতিক স্কুল নোটিফিকেশনসমূহ'
                : 'Recent School Push Notifications'}
            </h4>
            <button
              onClick={() => setShowNotificationsDrawer(false)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
          <div className="divide-y divide-neutral-200 dark:divide-slate-800 max-h-72 overflow-y-auto">
            {notices.map((n) => (
              <div key={n.id} className="py-2.5 text-xs">
                <div className="font-semibold text-neutral-900 dark:text-white">
                  {lang === 'bn' ? n.titleBn : n.titleEn}
                </div>
                <p className="text-neutral-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {lang === 'bn' ? n.contentBn : n.contentEn}
                </p>
                <div className="text-[11px] text-neutral-400 mt-1 font-mono tabular-nums">
                  {n.dateStr} · {n.authorName}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1440px] w-full mx-auto">
        {/* Left Workspace Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-slate-800 p-4 flex flex-col justify-between no-print">
          <div className="space-y-5">
            {/* School Emblem Card */}
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-slate-800">
              <ElDoradoLogo size={58} />
              <div className="min-w-0">
                <h1 className="font-display text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {lang === 'bn' ? 'এল্ ডরাডো মডেল স্কুল' : 'El Dorado Model School'}
                </h1>
                <p className="text-[11px] text-red-700 dark:text-red-400 font-semibold">
                  {lang === 'bn' ? 'জ্ঞানই আলো · স্থাপিত ২০০৯' : 'Knowledge is Light · Est. 2009'}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                  {lang === 'bn'
                    ? 'বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা'
                    : 'Burirpara, Zirabo, Ashulia, Savar, Dhaka'}
                </p>
              </div>
            </div>

            {/* Dynamic Global Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'রোল, নাম বা মোবাইল দিয়ে খুঁজুন...'
                    : 'Search Roll, Name or Phone...'
                }
                className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800/80 pl-8 pr-3 py-2 text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            {/* Navigation Menu */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-red-700 text-white font-semibold shadow-xs'
                        : 'text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowDownloadCenter(true)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 mt-1"
              >
                <Download className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>
                  {lang === 'bn'
                    ? 'অনলাইন ডাউনলোড সেন্টার'
                    : 'Online Download Hub'}
                </span>
              </button>
            </nav>
          </div>

          <div className="hidden lg:block pt-4 border-t border-neutral-200 dark:border-slate-800 text-[11px] text-neutral-500 dark:text-slate-400 space-y-1">
            <div>
              {lang === 'bn' ? 'ডাটাবেস মোড:' : 'Database:'}{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {isOnline
                  ? lang === 'bn'
                    ? 'অনলাইন + অফলাইন ক্যাশ'
                    : 'Online + Offline Sync'
                  : lang === 'bn'
                    ? 'অফলাইন ক্যাশ মোড'
                    : 'Offline Cache Active'}
              </strong>
            </div>
            <div>
              {lang === 'bn' ? 'সিকিউরিটি:' : 'Security:'} AES-256 ·{' '}
              {twoFactorEnabled ? '2FA Active' : 'ABAC Rules'}
            </div>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
          {/* ===============================================================
              TAB 1: DASHBOARD & INSTANT ROLL-BASED LOOKUP
          =============================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Hero Banner with Official School Seal & Roll Number Lookup */}
              <section className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <ElDoradoLogo size={88} />
                    <div>
                      <div className="text-xs text-red-700 dark:text-red-400 font-semibold tracking-wide">
                        {lang === 'bn'
                          ? 'জ্ঞানই আলো · স্থাপিত ২০০৯ · পড় তোমার প্রভুর নামে'
                          : 'Knowledge is Light · Est. 2009 · Read in the name of your Lord'}
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-0.5 text-balance">
                        {lang === 'bn'
                          ? 'এল্ ডরাডো মডেল স্কুল — নেক্সট-জেন স্মার্ট ক্যাম্পাস'
                          : 'El Dorado Model School — Next-Gen Smart Campus'}
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
                        {lang === 'bn'
                          ? 'বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা · নতুন ভর্তি, ৬০০+ শিক্ষার্থীর ডাটা এন্ট্রি, রোল ভেরিফিকেশন ও অ্যাটেনডেন্স'
                          : 'Burirpara, Zirabo, Ashulia, Savar, Dhaka · Admission, 600+ Bulk Entry, Roll Lookup & Attendance'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Roll Search & Admission CTA */}
                  <div className="flex flex-col sm:items-end gap-2">
                    <label className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                      {lang === 'bn'
                        ? 'রোল নম্বর বা নাম দিয়ে শিক্ষার্থীর তথ্য খুঁজুন:'
                        : 'Lookup Student by Roll Number or Name:'}
                    </label>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        value={rollSearchInput}
                        onChange={(e) => setRollSearchInput(e.target.value)}
                        placeholder={
                          lang === 'bn' ? 'রোল নম্বর বা নাম লিখুন...' : 'Type Roll No or Name...'
                        }
                        className="w-full sm:w-52 rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-mono tabular-nums font-semibold text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveTab('admission')}
                        className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'bn' ? '+ নতুন ভর্তি / এন্ট্রি' : '+ Add Students'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDownloadCenter(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'bn' ? 'অ্যাপ ও শিট ডাউনলোড' : 'Download App & Sheets'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant Roll Lookup Result Panel */}
                {rollSearchInput.trim() && lookedUpStudent ? (
                  <div className="mt-6 pt-5 border-t border-neutral-200 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-5 space-y-1">
                      <div className="text-xs text-neutral-500 dark:text-slate-400 font-mono tabular-nums">
                        {lang === 'bn' ? 'রোল নম্বর:' : 'Roll No:'}{' '}
                        <strong className="text-neutral-900 dark:text-white">
                          {lookedUpStudent.rollNo}
                        </strong>{' '}
                        · {lookedUpStudent.className} ({lookedUpStudent.section})
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        {lookedUpStudent.nameBn}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-slate-400">
                        {lang === 'bn' ? 'অভিভাবক:' : 'Guardian:'} {lookedUpStudent.guardianName} ·{' '}
                        <span className="font-mono tabular-nums">
                          {lookedUpStudent.guardianPhone}
                        </span>
                      </p>
                    </div>

                    <div className="lg:col-span-4 grid grid-cols-3 gap-3 text-xs border-y lg:border-y-0 lg:border-x border-neutral-200 dark:border-slate-800 py-3 lg:py-0 lg:px-4">
                      <div>
                        <span className="text-neutral-500 dark:text-slate-400 block">
                          {lang === 'bn' ? 'মাসিক বেতন' : 'Monthly Fee'}
                        </span>
                        <strong className="font-mono tabular-nums text-sm font-bold text-neutral-900 dark:text-white">
                          {lookedUpStudent.monthlyFee > 0
                            ? `৳${lookedUpStudent.monthlyFee.toLocaleString()}`
                            : '-'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-slate-400 block">
                          {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                        </span>
                        <strong className="font-mono tabular-nums text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {lookedUpStudent.paidAmount > 0
                            ? `৳${lookedUpStudent.paidAmount.toLocaleString()}`
                            : '-'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 dark:text-slate-400 block">
                          {lang === 'bn' ? 'বেতন বাকি (Due)' : 'Due'}
                        </span>
                        <strong className="font-mono tabular-nums text-sm font-bold text-red-600 dark:text-red-400">
                          {lookedUpStudent.dueAmount > 0
                            ? `৳${lookedUpStudent.dueAmount.toLocaleString()}`
                            : '-'}
                        </strong>
                      </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPayingStudent(lookedUpStudent)}
                        className="rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                      >
                        {lang === 'bn'
                          ? 'বেতন পরিশোধ (বিকাশ/নগদ/রকেট)'
                          : 'Pay Fee (bKash/Nagad)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('admission')}
                        className="rounded-lg border border-neutral-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-800 whitespace-nowrap"
                      >
                        {lang === 'bn' ? 'কাস্টমাইজ' : 'Customize'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </section>

              {/* School Key Metrics Row */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn' ? 'মোট নিবন্ধিত শিক্ষার্থী' : 'Enrolled Students'}
                  </span>
                  <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                    {metrics.totalStudents}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn' ? 'কাস্টমাইজযোগ্য ডাটাবেস' : 'Customizable student records'}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn' ? 'মোট আদায়কৃত বেতন (Paid)' : 'Total Tuition Collected'}
                  </span>
                  <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.totalCollected > 0
                      ? `৳${metrics.totalCollected.toLocaleString()}`
                      : '—'}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
                    bKash · Nagad · Rocket
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn' ? 'মোট বকেয়া বেতন (Due)' : 'Total Unpaid Due'}
                  </span>
                  <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-red-600 dark:text-red-400">
                    {metrics.totalDue > 0 ? `৳${metrics.totalDue.toLocaleString()}` : '—'}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500 dark:text-slate-400 font-mono tabular-nums">
                    {metrics.dueCount}{' '}
                    {lang === 'bn' ? 'জন শিক্ষার্থীর বকেয়া' : 'students with due'}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                  <span className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn' ? 'গড় উপস্থিতির হার (Attendance)' : 'Average Attendance Rate'}
                  </span>
                  <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                    {metrics.totalStudents > 0 ? `${metrics.avgAttendance}%` : '—'}
                  </div>
                  <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {lang === 'bn' ? 'দৈনিক হাজিরা রেজিস্টার' : 'Daily attendance tracking'}
                  </div>
                </div>
              </section>

              {/* Two-Column Section: Student Directory / Empty Onboarding + Notice Board */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {lang === 'bn'
                          ? 'রোল নম্বর অনুযায়ী শিক্ষার্থী, বেতন ও কাস্টমাইজেশন তালিকা'
                          : 'Roll-Wise Student Directory & Custom Fee Ledger'}
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-slate-400">
                        {lang === 'bn'
                          ? 'আপনাদের স্কুলের শিক্ষার্থীদের নাম যুক্ত করুন এবং প্রতিদিন নিজেদের মতো কাস্টমাইজ করুন'
                          : 'Add your school students and customize their daily attendance, fees, and results'}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('admission')}
                      className="rounded-lg bg-red-700 hover:bg-red-800 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      {lang === 'bn'
                        ? '+ নতুন ভর্তি ও ৬০০+ এন্ট্রি'
                        : '+ Admission & Bulk Entry'}
                    </button>
                  </div>

                  {students.length === 0 ? (
                    <div className="p-8 text-center space-y-4">
                      <div className="max-w-md mx-auto space-y-2">
                        <h4 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                          {lang === 'bn'
                            ? 'কোনো পূর্বনির্ধারিত ছাত্রের নাম বা টাকার হিসাব রাখা হয়নি — সম্পূর্ণ আপনাদের নিয়ন্ত্রণে!'
                            : 'Clean Slate — Ready for Your School’s 600+ Students'}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-slate-400 leading-relaxed">
                          {lang === 'bn'
                            ? 'আপনাদের স্কুলের ৬০০ বাচ্চার নাম একসাথে এক্সেল/কপি-পেস্ট করে তোলার জন্য, অথবা নতুন বাচ্চা ভর্তি করার জন্য নিচের বাটনে ক্লিক করুন।'
                            : 'Click below to enroll new students individually, enter batches via the rapid multi-row table, or bulk import all 600+ students via Excel/CSV.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('admission')}
                          className="flex items-center gap-2 rounded-lg bg-red-700 hover:bg-red-800 px-5 py-2.5 text-xs font-semibold text-white transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>
                            {lang === 'bn'
                              ? 'নতুন ভর্তি ও ৬০০+ শিক্ষার্থীর নাম যুক্ত করুন →'
                              : 'Open Admission & 600+ Student Bulk Entry →'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                            <th className="py-2.5 px-4 font-medium">
                              {lang === 'bn' ? 'রোল' : 'Roll'}
                            </th>
                            <th className="py-2.5 px-4 font-medium">
                              {lang === 'bn' ? 'শিক্ষার্থীর নাম ও শ্রেণি' : 'Student & Class'}
                            </th>
                            <th className="py-2.5 px-4 text-right font-medium">
                              {lang === 'bn' ? 'পরিশোধিত' : 'Paid'}
                            </th>
                            <th className="py-2.5 px-4 text-right font-medium">
                              {lang === 'bn' ? 'বেতন বাকি (Due)' : 'Due'}
                            </th>
                            <th className="py-2.5 px-4 text-right font-medium">
                              {lang === 'bn' ? 'অ্যাকশন' : 'Action'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                          {filteredStudents.map((st) => (
                            <tr
                              key={st.id}
                              className="hover:bg-neutral-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <td className="py-3 px-4 font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                                {st.rollNo}
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-neutral-900 dark:text-white">
                                  {st.nameBn}
                                </div>
                                <div className="text-[11px] text-neutral-500 dark:text-slate-400">
                                  {st.className} · {st.section}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                                {st.paidAmount > 0 ? `৳${st.paidAmount.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                                {st.dueAmount > 0 ? (
                                  <span className="text-red-600 dark:text-red-400">
                                    ৳{st.dueAmount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setPayingStudent(st)}
                                    className="rounded-md bg-red-700 hover:bg-red-800 px-2.5 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
                                  >
                                    {lang === 'bn' ? 'পেমেন্ট' : 'Pay'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('admission')}
                                    className="rounded-md border border-neutral-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 whitespace-nowrap"
                                  >
                                    {lang === 'bn' ? 'এডিট' : 'Edit'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* School Notice Board Preview */}
                <div className="lg:col-span-4 rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                        {lang === 'bn' ? 'স্কুল নোটিশ বোর্ড' : 'Latest School Notices'}
                      </h3>
                      <button
                        onClick={() => setActiveTab('notices')}
                        className="text-xs font-semibold text-red-700 dark:text-red-400 hover:underline"
                      >
                        {lang === 'bn' ? 'সব দেখুন' : 'All Notices'}
                      </button>
                    </div>

                    <div className="divide-y divide-neutral-200 dark:divide-slate-800">
                      {notices.slice(0, 3).map((notice) => (
                        <div key={notice.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                          <div className="text-[11px] text-neutral-500 dark:text-slate-400 font-mono tabular-nums">
                            {notice.dateStr} · {notice.category.toUpperCase()}
                          </div>
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white leading-snug">
                            {lang === 'bn' ? notice.titleBn : notice.titleEn}
                          </h4>
                          <p className="text-xs text-neutral-600 dark:text-slate-300 line-clamp-3">
                            {lang === 'bn' ? notice.contentBn : notice.contentEn}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('teacher')}
                    className="mt-4 w-full rounded-lg bg-neutral-900 dark:bg-white py-2.5 text-xs font-semibold text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
                  >
                    {lang === 'bn'
                      ? 'নতুন নোটিশ বা রেজাল্ট যুক্ত করুন →'
                      : 'Publish Notice or Result →'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 2: ADMISSION & 600+ STUDENT BULK ENTRY HUB
          =============================================================== */}
          {activeTab === 'admission' && (
            <AdmissionBulkManager
              students={students}
              lang={lang}
              onAddSingleStudent={handleAddSingleStudent}
              onAddBulkStudents={handleAddBulkStudents}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onClearAllStudents={handleClearAllStudents}
            />
          )}

          {/* ===============================================================
              TAB 3: TUITION FEES & ONLINE PAYMENT (bKash, Nagad, Rocket)
          =============================================================== */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'রোল নম্বর অনুযায়ী বেতন বাকি ও অনলাইন পেমেন্ট (বিকাশ, নগদ, রকেট)'
                      : 'Roll-Based Tuition Fee Ledger & Online Payment (bKash, Nagad, Rocket)'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'শিক্ষার্থীর রোল বা শ্রেণি অনুযায়ী বেতন পরিশোধ ও বকেয়া হিসাব কাস্টমাইজ করুন এবং মানি রিসিট প্রিন্ট করুন'
                      : 'Filter by class or payment status and process instant mobile banking payments'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 bg-neutral-200/70 dark:bg-slate-800 rounded-lg">
                    {(['all', 'due', 'paid'] as const).map((statusKey) => (
                      <button
                        key={statusKey}
                        onClick={() => setFeeStatusFilter(statusKey)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          feeStatusFilter === statusKey
                            ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                            : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900'
                        }`}
                      >
                        {statusKey === 'all'
                          ? lang === 'bn'
                            ? 'সকল শিক্ষার্থী'
                            : 'All Students'
                          : statusKey === 'due'
                            ? lang === 'bn'
                              ? 'বেতন বাকি (Due)'
                              : 'Unpaid Due'
                            : lang === 'bn'
                              ? 'বকেয়া নেই'
                              : 'No Due'}
                      </button>
                    ))}
                  </div>

                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-neutral-900 dark:text-white"
                  >
                    <option value="all">{lang === 'bn' ? 'সকল শ্রেণি' : 'All Classes'}</option>
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      downloadStudentsFeeCsv(filteredStudents);
                      triggerToast(
                        lang === 'bn'
                          ? '✓ শিক্ষার্থীদের বেতন ও বকেয়া শিট (.csv) ডাউনলোড হয়েছে!'
                          : '✓ Tuition fee ledger (.csv) downloaded!'
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বেতন শিট ডাউনলোড' : 'Download CSV'}</span>
                  </button>
                </div>
              </div>

              {/* Automated Fee Reminder SMS Engine for Teachers */}
              <AutomatedFeeReminder
                students={students}
                lang={lang}
                smsLogs={smsReminderLogs}
                onSendReminders={handleSendSmsReminders}
                onClearLogs={() => setSmsReminderLogs([])}
              />

              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                        <th className="py-3 px-4 font-medium">{lang === 'bn' ? 'রোল নং' : 'Roll No'}</th>
                        <th className="py-3 px-4 font-medium">
                          {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                        </th>
                        <th className="py-3 px-4 font-medium">
                          {lang === 'bn' ? 'শ্রেণি ও শাখা' : 'Class & Section'}
                        </th>
                        <th className="py-3 px-4 font-medium">
                          {lang === 'bn' ? 'অভিভাবক ও মোবাইল' : 'Guardian & Phone'}
                        </th>
                        <th className="py-3 px-4 text-right font-medium">
                          {lang === 'bn' ? 'মাসিক বেতন' : 'Monthly Fee'}
                        </th>
                        <th className="py-3 px-4 text-right font-medium">
                          {lang === 'bn' ? 'মোট পরিশোধিত' : 'Total Paid'}
                        </th>
                        <th className="py-3 px-4 text-right font-medium">
                          {lang === 'bn' ? 'বেতন বাকি (Due)' : 'Due Balance'}
                        </th>
                        <th className="py-3 px-4 text-right font-medium">
                          {lang === 'bn' ? 'পেমেন্ট গেটওয়ে' : 'Online Payment'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-neutral-500">
                            {lang === 'bn'
                              ? 'কোনো শিক্ষার্থীর তথ্য নেই। "ভর্তি ও ৬০০+ শিক্ষার্থী এন্ট্রি" ট্যাব থেকে শিক্ষার্থী যুক্ত করুন।'
                              : 'No students found. Add students under the "Admission & 600+ Entry" tab.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st) => (
                          <tr key={st.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                              {st.rollNo}
                            </td>
                            <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                              {st.nameBn}
                            </td>
                            <td className="py-3 px-4 text-neutral-600 dark:text-slate-300">
                              {st.className} · {st.section}
                            </td>
                            <td className="py-3 px-4 text-neutral-600 dark:text-slate-300">
                              <div>{st.guardianName}</div>
                              <div className="font-mono tabular-nums text-[11px] text-neutral-400">
                                {st.guardianPhone}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-700 dark:text-slate-300">
                              {st.monthlyFee > 0 ? `৳${st.monthlyFee.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                              {st.paidAmount > 0 ? `৳${st.paidAmount.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                              {st.dueAmount > 0 ? (
                                <span className="text-red-600 dark:text-red-400">
                                  ৳{st.dueAmount.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-neutral-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {st.dueAmount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendSingleStudentSmsReminder(st)}
                                    className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 whitespace-nowrap transition-colors"
                                    title={
                                      lang === 'bn'
                                        ? 'অভিভাবকের মোবাইলে বকেয়া বেতনের এসএমএস পাঠান'
                                        : 'Send Automated Due SMS to Guardian'
                                    }
                                  >
                                    {lang === 'bn' ? '📩 এসএমএস রিমাইন্ডার' : '📩 Send SMS'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setPayingStudent(st)}
                                  className="rounded-lg bg-red-700 hover:bg-red-800 px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap transition-colors"
                                >
                                  {lang === 'bn' ? 'বিকাশ / নগদ / রকেট' : 'Pay via bKash / Nagad'}
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

              {/* Quick Digital QR & TrxID Tuition Verification Bar */}
              <QrVerificationBar
                payments={payments}
                lang={lang}
                onInspectReceipt={(receipt) => setViewingQrReceipt(receipt)}
              />

              {/* Payment Transaction History Table */}
              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'সাম্প্রতিক অনলাইন বেতন লেনদেন ও ডিজিটাল QR মানি রিসিট লগ'
                      : 'Recent Tuition Fee Payment Transactions & Digital QR Receipts'}
                  </h3>
                  <div className="flex items-center gap-3 no-print">
                    <button
                      type="button"
                      onClick={() => {
                        downloadPaymentsCsv(payments);
                        triggerToast(
                          lang === 'bn'
                            ? '✓ পেমেন্ট ও মানি রিসিট লেজার (.csv) ডাউনলোড হয়েছে!'
                            : '✓ Payment receipt ledger (.csv) downloaded!'
                        );
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'লেজার ডাউনলোড (CSV)' : 'Download CSV'}</span>
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 dark:text-slate-300 hover:underline"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'লেজার প্রিন্ট' : 'Print Ledger'}</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                        <th className="py-2.5 px-4 font-medium">TrxID</th>
                        <th className="py-2.5 px-4 font-medium">{lang === 'bn' ? 'রোল' : 'Roll'}</th>
                        <th className="py-2.5 px-4 font-medium">
                          {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student'}
                        </th>
                        <th className="py-2.5 px-4 font-medium">
                          {lang === 'bn' ? 'বিবরণ' : 'Month / Description'}
                        </th>
                        <th className="py-2.5 px-4 font-medium">
                          {lang === 'bn' ? 'মাধ্যম' : 'Gateway'}
                        </th>
                        <th className="py-2.5 px-4 text-right font-medium">
                          {lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}
                        </th>
                        <th className="py-2.5 px-4 text-right font-medium">
                          {lang === 'bn' ? 'ডিজিটাল QR রিসিট' : 'QR Receipt'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-neutral-500">
                            {lang === 'bn'
                              ? 'এখনো কোনো পেমেন্ট লেনদেন সম্পন্ন হয়নি।'
                              : 'No payment transactions recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-slate-800/50">
                            <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                              {p.transactionId}
                            </td>
                            <td className="py-2.5 px-4 font-mono tabular-nums">{p.rollNo}</td>
                            <td className="py-2.5 px-4 text-neutral-800 dark:text-slate-200">
                              {p.studentName}
                            </td>
                            <td className="py-2.5 px-4 text-neutral-600 dark:text-slate-300">
                              {p.month}
                            </td>
                            <td className="py-2.5 px-4 uppercase font-semibold text-neutral-700 dark:text-slate-300">
                              {p.method} ({p.walletNumber})
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                              ৳{p.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setViewingQrReceipt(p)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 whitespace-nowrap transition-colors"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>{lang === 'bn' ? 'QR মানি রিসিট' : 'QR Receipt'}</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 4: SCHOOL NOTICE BOARD & REGULAR NOTIFICATIONS
          =============================================================== */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'স্কুল নোটিশ বোর্ড ও অভিভাবক নোটিফিকেশন কেন্দ্র'
                      : 'Official School Notice Board & Notification Center'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'এল ডরাডো মডেল স্কুলের সকল পরীক্ষা, ছুটি, বেতন ও একাডেমিক বিজ্ঞপ্তি'
                      : 'All academic, examination, tuition fee, and holiday announcements'}
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-neutral-200/70 dark:bg-slate-800 rounded-lg">
                  {(['all', 'exam', 'fee', 'academic', 'general'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNoticeCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize whitespace-nowrap ${
                        noticeCategoryFilter === cat
                          ? 'bg-white dark:bg-slate-900 text-neutral-900 dark:text-white shadow-xs font-semibold'
                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900'
                      }`}
                    >
                      {cat === 'all' ? (lang === 'bn' ? 'সকল নোটিশ' : 'All') : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {notices
                  .filter(
                    (n) => noticeCategoryFilter === 'all' || n.category === noticeCategoryFilter
                  )
                  .map((notice) => (
                    <article
                      key={notice.id}
                      className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-slate-400">
                        <div>
                          <span className="font-semibold text-red-700 dark:text-red-400 uppercase">
                            {notice.category}
                          </span>
                          <span className="mx-1.5">·</span>
                          <span className="font-mono tabular-nums">{notice.dateStr}</span>
                          <span className="mx-1.5">·</span>
                          <span>{notice.authorName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              triggerToast(
                                lang === 'bn'
                                  ? `নোটিশটি পুশ নোটিফিকেশনের মাধ্যমে অভিভাবকদের পাঠানো হয়েছে।`
                                  : `Notice dispatched via push notification to guardians.`
                              )
                            }
                            className="text-xs font-medium text-neutral-700 dark:text-slate-300 hover:underline"
                          >
                            {lang === 'bn' ? '🔔 নোটিফিকেশন পাঠান' : '🔔 Send Push Alert'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setNotices((prev) => prev.filter((item) => item.id !== notice.id))
                            }
                            className="text-red-600 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                          </button>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        {lang === 'bn' ? notice.titleBn : notice.titleEn}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-slate-300 leading-relaxed">
                        {lang === 'bn' ? notice.contentBn : notice.contentEn}
                      </p>
                    </article>
                  ))}
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 5: STUDENT ATTENDANCE TRACKING
          =============================================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'ছাত্র-ছাত্রীদের দৈনিক উপস্থিতি (হাজিরা) রেজিস্টার'
                      : 'Daily Student Attendance Register'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'তারিখ ও শ্রেণি অনুযায়ী উপস্থিতি সংরক্ষণ করুন এবং শতকরা হার পর্যবেক্ষণ করুন'
                      : 'Record daily class attendance and track cumulative attendance rates'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-neutral-900 dark:text-white"
                  >
                    <option value="all">{lang === 'bn' ? 'সকল শ্রেণি' : 'All Classes'}</option>
                    {SCHOOL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-mono tabular-nums text-neutral-900 dark:text-white"
                  />
                  {students.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllPresent}
                      className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                    >
                      {lang === 'bn' ? 'সকলকে উপস্থিত চিহ্নিত করুন' : 'Mark All Present'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      downloadAttendanceCsv(filteredStudents, attendanceMap, attendanceDate);
                      triggerToast(
                        lang === 'bn'
                          ? `✓ ${attendanceDate} তারিখের হাজিরা শিট (.csv) ডাউনলোড হয়েছে!`
                          : `✓ Attendance sheet (${attendanceDate}) downloaded!`
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-neutral-100 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-slate-200 transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'bn' ? 'হাজিরা ডাউনলোড' : 'Download CSV'}</span>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-slate-800 text-neutral-500 dark:text-slate-400">
                        <th className="py-3 px-4 font-medium">{lang === 'bn' ? 'রোল' : 'Roll'}</th>
                        <th className="py-3 px-4 font-medium">
                          {lang === 'bn' ? 'শিক্ষার্থীর নাম' : 'Student Name'}
                        </th>
                        <th className="py-3 px-4 font-medium">{lang === 'bn' ? 'শ্রেণি' : 'Class'}</th>
                        <th className="py-3 px-4 text-right font-medium">
                          {lang === 'bn' ? 'মোট উপস্থিতির হার' : 'Attendance Rate'}
                        </th>
                        <th className="py-3 px-4 text-right font-medium">
                          {lang === 'bn'
                            ? `হাজিরা (${attendanceDate})`
                            : `Status (${attendanceDate})`}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-slate-800">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-neutral-500">
                            {lang === 'bn'
                              ? 'হাজিরা নেওয়ার জন্য আগে "ভর্তি ও ৬০০+ শিক্ষার্থী এন্ট্রি" মেনু থেকে শিক্ষার্থীদের নাম যুক্ত করুন।'
                              : 'Add students first under "Admission & 600+ Entry" to take daily attendance.'}
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((st) => {
                          const currentStatus = attendanceMap[st.id] || 'present';
                          return (
                            <tr
                              key={st.id}
                              className="hover:bg-neutral-50 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-3 px-4 font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                                {st.rollNo}
                              </td>
                              <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-white">
                                {st.nameBn}
                              </td>
                              <td className="py-3 px-4 text-neutral-600 dark:text-slate-300">
                                {st.className} · {st.section}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                                {st.attendanceRate}%
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center gap-1 bg-neutral-100 dark:bg-slate-800 p-1 rounded-lg">
                                  {(
                                    [
                                      {
                                        id: 'present',
                                        labelBn: 'উপস্থিত',
                                        labelEn: 'Present',
                                        activeClass: 'bg-emerald-600 text-white',
                                      },
                                      {
                                        id: 'absent',
                                        labelBn: 'অনুপস্থিত',
                                        labelEn: 'Absent',
                                        activeClass: 'bg-red-600 text-white',
                                      },
                                      {
                                        id: 'late',
                                        labelBn: 'বিলম্ব',
                                        labelEn: 'Late',
                                        activeClass: 'bg-amber-600 text-white',
                                      },
                                      {
                                        id: 'leave',
                                        labelBn: 'ছুটি',
                                        labelEn: 'Leave',
                                        activeClass: 'bg-slate-700 text-white',
                                      },
                                    ] as const
                                  ).map((opt) => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => handleMarkAttendance(st, opt.id)}
                                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                                        currentStatus === opt.id
                                          ? opt.activeClass
                                          : 'text-neutral-600 dark:text-slate-400 hover:text-neutral-900'
                                      }`}
                                    >
                                      {lang === 'bn' ? opt.labelBn : opt.labelEn}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 6: GUARDIAN PROGRESS REPORT & RESULT CARDS
          =============================================================== */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'অভিভাবক প্রগ্রেস রিপোর্ট ও একাডেমিক রেজাল্ট কার্ড'
                      : 'Guardian Progress Reports & Official Academic Result Cards'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'শিক্ষার্থীর বিষয়ভিত্তিক নম্বরপত্র, জিপিএ, উপস্থিতির হার ও শিক্ষকের মূল্যায়ন দেখুন এবং প্রিন্ট করুন'
                      : 'Inspect subject-wise marksheets, GPA, attendance, and teacher remarks'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      downloadResultsCsv(results);
                      triggerToast(
                        lang === 'bn'
                          ? '✓ একাডেমিক রেজাল্ট ও জিপিএ শিট (.csv) ডাউনলোড হয়েছে!'
                          : '✓ Academic result marksheet (.csv) downloaded!'
                      );
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'রেজাল্ট শিট ডাউনলোড (CSV)' : 'Download Results CSV'}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('teacher')}
                    className="rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    {lang === 'bn' ? '+ নম্বর এন্ট্রি ও রেজাল্ট তৈরি করুন' : '+ Enter Student Marks'}
                  </button>
                </div>
              </div>

              {results.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-3">
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'এখনো কোনো শিক্ষার্থীর রেজাল্ট কার্ড তৈরি করা হয়নি। ফ্যাকাল্টি স্টুডিও (শিক্ষক প্যানেল) থেকে রোল সিলেক্ট করে বিষয়ভিত্তিক নম্বর এন্ট্রি করুন।'
                      : 'No result cards generated yet. Go to Faculty Studio to enter marks for any enrolled student.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('teacher')}
                    className="rounded-lg bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-neutral-900"
                  >
                    {lang === 'bn' ? 'ফ্যাকাল্টি স্টুডিওতে যান →' : 'Go to Faculty Studio →'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((res) => {
                    const st = students.find((s) => s.rollNo === res.rollNo);
                    return (
                      <div
                        key={res.id}
                        className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 border-b border-neutral-200 dark:border-slate-800 pb-3">
                            <div>
                              <div className="text-xs font-mono tabular-nums text-neutral-500 dark:text-slate-400">
                                {lang === 'bn' ? 'রোল:' : 'Roll:'} {res.rollNo} · {res.className}
                              </div>
                              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                                {res.studentNameBn}
                              </h3>
                            </div>
                            <div className="text-right font-mono tabular-nums">
                              <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                                GPA {res.gpa.toFixed(2)}
                              </div>
                              <div className="text-[11px] font-semibold text-neutral-600 dark:text-slate-400">
                                Grade {res.grade}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 text-[11px] font-mono tabular-nums">
                            <div>
                              <span className="text-neutral-400 block">Bangla</span>
                              <strong className="text-neutral-900 dark:text-white">
                                {res.bangla}
                              </strong>
                            </div>
                            <div>
                              <span className="text-neutral-400 block">English</span>
                              <strong className="text-neutral-900 dark:text-white">
                                {res.english}
                              </strong>
                            </div>
                            <div>
                              <span className="text-neutral-400 block">Math</span>
                              <strong className="text-neutral-900 dark:text-white">
                                {res.math}
                              </strong>
                            </div>
                            <div>
                              <span className="text-neutral-400 block">Science</span>
                              <strong className="text-neutral-900 dark:text-white">
                                {res.science}
                              </strong>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-neutral-100 dark:border-slate-800/80 text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-neutral-500">
                                {lang === 'bn' ? 'উপস্থিতির হার:' : 'Attendance:'}
                              </span>
                              <span className="font-mono tabular-nums font-semibold">
                                {st ? st.attendanceRate : 100}%
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-neutral-600 dark:text-slate-300 line-clamp-2">
                            {res.teacherRemarksBn}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setViewingResult(res)}
                          className="w-full rounded-lg bg-red-700 hover:bg-red-800 py-2 text-xs font-semibold text-white transition-colors"
                        >
                          {lang === 'bn'
                            ? 'পূর্ণাঙ্গ রেজাল্ট কার্ড ও প্রিন্ট'
                            : 'View Official Result Card & Print'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===============================================================
              TAB 7: ONLINE EXAMINATION SYSTEM
          =============================================================== */}
          {activeTab === 'exams' && (
            <OnlineExamView
              exams={exams}
              attempts={examAttempts}
              students={students}
              lang={lang}
              isTeacherMode={true}
              onSubmitAttempt={async (att) => {
                const newAttempt: ExamAttemptRecord = {
                  ...att,
                  id: `att-${Date.now()}`,
                  studentUid: user?.uid || 'local-user',
                  dateStr: new Date().toISOString().slice(0, 10),
                };
                setExamAttempts((prev) => [newAttempt, ...prev]);
                triggerToast(
                  lang === 'bn'
                    ? `অনলাইন পরীক্ষার ফলাফল সংরক্ষিত হয়েছে! প্রাপ্ত নম্বর: ${att.score}/${att.totalMarks}`
                    : `Online exam score saved: ${att.score}/${att.totalMarks}`
                );
              }}
              onCreateExam={async (newEx) => {
                const exId = `exam-${Date.now()}`;
                const created: OnlineExamRecord = {
                  id: exId,
                  ...newEx,
                  status: 'published',
                  authorId: user?.uid || 'local-user',
                  questions: INITIAL_EXAMS[0].questions,
                };
                setExams((prev) => [created, ...prev]);
                if (user) {
                  try {
                    await setDoc(doc(db, 'exams', exId), {
                      titleBn: created.titleBn.slice(0, 150),
                      titleEn: created.titleEn.slice(0, 150),
                      subjectBn: created.subjectBn.slice(0, 80),
                      subjectEn: created.subjectEn.slice(0, 80),
                      className: created.className.slice(0, 40),
                      durationMinutes: created.durationMinutes,
                      totalMarks: created.totalMarks,
                      status: 'published',
                      authorId: user.uid,
                      createdAt: serverTimestamp(),
                    });
                  } catch (err) {
                    handleFirestoreError(err, OperationType.CREATE, 'exams');
                  }
                }
                triggerToast(
                  lang === 'bn'
                    ? 'নতুন অনলাইন পরীক্ষা সফলভাবে প্রকাশিত হয়েছে!'
                    : 'New online examination published!'
                );
              }}
            />
          )}

          {/* ===============================================================
              TAB 8: DEDICATED TEACHER / FACULTY STUDIO PANEL
          =============================================================== */}
          {activeTab === 'teacher' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-neutral-900 dark:text-white">
                    {lang === 'bn'
                      ? 'ফ্যাকাল্টি স্টুডিও — শিক্ষক ও একাডেমিক কন্ট্রোল প্যানেল'
                      : 'Faculty Studio — Teacher & Academic Control Panel'}
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'রেজাল্ট কার্ডের নম্বর এন্ট্রি, নোটিশ প্রকাশ এবং ৬০০+ শিক্ষার্থীর ডাটাবেস পরিচালনা করুন'
                      : 'Enter exam marksheets, broadcast school notices, and manage the student database'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('admission')}
                    className="flex items-center gap-1.5 rounded-lg bg-red-700 hover:bg-red-800 px-3.5 py-2 text-xs font-semibold text-white"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'bn'
                        ? 'ভর্তি ও ৬০০+ শিক্ষার্থী এন্ট্রি প্যানেল'
                        : 'Open Admission & 600+ Entry'}
                    </span>
                  </button>
                  {twoFactorEnabled && !twoFactorVerified && (
                    <button
                      onClick={() => setActiveTab('security')}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{lang === 'bn' ? '2FA যাচাই করুন' : 'Verify 2FA Session'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Enter / Update Result Card Marks */}
                <form
                  onSubmit={handleUpdateResultMarks}
                  className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
                >
                  <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-slate-800 pb-3">
                    <Award className="w-4 h-4 text-red-700 dark:text-red-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {lang === 'bn'
                        ? 'রেজাল্ট কার্ড ও প্রগ্রেস রিপোর্ট নম্বর এন্ট্রি'
                        : 'Enter / Update Student Result Card Marks'}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                      {lang === 'bn'
                        ? 'শিক্ষার্থীর রোল নম্বর নির্বাচন বা টাইপ করুন *'
                        : 'Select or Type Student Roll No *'}
                    </label>
                    {students.length > 0 ? (
                      <select
                        value={marksUpdateForm.rollNo}
                        onChange={(e) =>
                          setMarksUpdateForm({ ...marksUpdateForm, rollNo: e.target.value })
                        }
                        className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums"
                      >
                        <option value="">
                          {lang === 'bn' ? '-- শিক্ষার্থী নির্বাচন করুন --' : '-- Select Student --'}
                        </option>
                        {students.map((s) => (
                          <option key={s.id} value={s.rollNo}>
                            Roll {s.rollNo} — {s.nameBn} ({s.className})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={marksUpdateForm.rollNo}
                        onChange={(e) =>
                          setMarksUpdateForm({ ...marksUpdateForm, rollNo: e.target.value })
                        }
                        placeholder={
                          lang === 'bn'
                            ? 'আগে ভর্তি ট্যাব থেকে শিক্ষার্থী যুক্ত করুন'
                            : 'Add students first in Admission tab'
                        }
                        className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono tabular-nums"
                      />
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { key: 'bangla', label: 'বাংলা (Bangla)' },
                        { key: 'english', label: 'ইংরেজি (English)' },
                        { key: 'math', label: 'গণিত (Math)' },
                        { key: 'science', label: 'বিজ্ঞান (Science)' },
                        { key: 'bgs', label: 'বাওবি (BGS)' },
                        { key: 'religion', label: 'ধর্ম (Religion)' },
                        { key: 'ict', label: 'আইসিটি (ICT)' },
                      ] as const
                    ).map((sub) => (
                      <div key={sub.key}>
                        <label className="block text-neutral-500 mb-0.5">{sub.label}</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={marksUpdateForm[sub.key]}
                          onChange={(e) =>
                            setMarksUpdateForm({
                              ...marksUpdateForm,
                              [sub.key]: e.target.value,
                            })
                          }
                          placeholder="0-100"
                          className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 font-mono tabular-nums"
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                      {lang === 'bn' ? 'শ্রেণি শিক্ষকের মন্তব্য' : 'Class Teacher Remarks'}
                    </label>
                    <input
                      type="text"
                      value={marksUpdateForm.teacherRemarksBn}
                      onChange={(e) =>
                        setMarksUpdateForm({
                          ...marksUpdateForm,
                          teacherRemarksBn: e.target.value,
                        })
                      }
                      placeholder={
                        lang === 'bn' ? 'শিক্ষার্থীর প্রগ্রেস মন্তব্য লিখুন...' : 'Enter remarks...'
                      }
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-neutral-900 dark:bg-white py-2.5 font-semibold text-white dark:text-neutral-900"
                  >
                    {lang === 'bn'
                      ? 'রেজাল্ট কার্ড তৈরি ও আপডেট করুন'
                      : 'Generate & Save Result Card'}
                  </button>
                </form>

                {/* 2. Publish Notice & Send Notification */}
                <form
                  onSubmit={handlePublishNotice}
                  className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
                >
                  <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-slate-800 pb-3">
                    <Bell className="w-4 h-4 text-red-700 dark:text-red-400" />
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      {lang === 'bn'
                        ? 'নতুন নোটিশ ও পুশ নোটিফিকেশন প্রকাশ করুন'
                        : 'Broadcast School Notice & Alert'}
                    </h3>
                  </div>

                  <div>
                    <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                      {lang === 'bn' ? 'নোটিশের শিরোনাম *' : 'Notice Title *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newNoticeForm.titleBn}
                      onChange={(e) =>
                        setNewNoticeForm({ ...newNoticeForm, titleBn: e.target.value })
                      }
                      placeholder={
                        lang === 'bn' ? 'নোটিশের শিরোনাম লিখুন...' : 'Enter notice headline...'
                      }
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                      {lang === 'bn' ? 'বিস্তারিত বিবরণ *' : 'Notice Content *'}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={newNoticeForm.contentBn}
                      onChange={(e) =>
                        setNewNoticeForm({ ...newNoticeForm, contentBn: e.target.value })
                      }
                      placeholder={
                        lang === 'bn'
                          ? 'নোটিশের বিস্তারিত বার্তা এখানে লিখুন...'
                          : 'Write full announcement details...'
                      }
                      className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                        {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                      </label>
                      <select
                        value={newNoticeForm.category}
                        onChange={(e) =>
                          setNewNoticeForm({
                            ...newNoticeForm,
                            category: e.target.value as NoticeRecord['category'],
                          })
                        }
                        className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5"
                      >
                        <option value="academic">Academic</option>
                        <option value="exam">Exam</option>
                        <option value="fee">Tuition Fee</option>
                        <option value="holiday">Holiday</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-neutral-600 dark:text-slate-400 mb-1">
                        {lang === 'bn' ? 'গুরুত্ব' : 'Priority'}
                      </label>
                      <select
                        value={newNoticeForm.priority}
                        onChange={(e) =>
                          setNewNoticeForm({
                            ...newNoticeForm,
                            priority: e.target.value as NoticeRecord['priority'],
                          })
                        }
                        className="w-full rounded-lg border border-neutral-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5"
                      >
                        <option value="urgent">Urgent</option>
                        <option value="important">Important</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-red-700 hover:bg-red-800 py-2.5 font-semibold text-white transition-colors"
                  >
                    {lang === 'bn'
                      ? 'নোটিশ প্রকাশ ও নোটিফিকেশন পাঠান'
                      : 'Publish & Send Push Notification'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ===============================================================
              TAB 9: SECURITY, 2FA, ENCRYPTION, AUDIT & BACKUP
          =============================================================== */}
          {activeTab === 'security' && (
            <SecurityBackupView
              lang={lang}
              twoFactorEnabled={twoFactorEnabled}
              twoFactorVerified={twoFactorVerified}
              onToggleTwoFactor={(enabled) => {
                setTwoFactorEnabled(enabled);
                saveCached('edms_v2_2fa_enabled', enabled);
                triggerToast(
                  enabled
                    ? lang === 'bn'
                      ? 'টু-ফ্যাক্টর অথেন্টিকেশন (2FA) সক্রিয় করা হয়েছে।'
                      : 'Two-Factor Authentication (2FA) enabled.'
                    : lang === 'bn'
                      ? 'টু-ফ্যাক্টর অথেন্টিকেশন নিষ্ক্রিয় করা হয়েছে।'
                      : 'Two-Factor Authentication disabled.'
                );
              }}
              onVerifyTwoFactor={() => setTwoFactorVerified(true)}
              students={students}
              payments={payments}
              notices={notices}
              results={results}
              onSyncOfflineCache={() => {
                saveCached('edms_v2_students', students);
                saveCached('edms_v2_payments', payments);
                saveCached('edms_v2_notices', notices);
                saveCached('edms_v2_results', results);
                triggerToast(
                  lang === 'bn'
                    ? 'অফলাইন ডাটাবেস ক্যাশ সফলভাবে সিঙ্ক ও হালনাগাদ হয়েছে!'
                    : 'Offline database cache synchronized successfully!'
                );
              }}
            />
          )}
        </main>
      </div>

      {/* Clean Quiet Footer */}
      <footer className="border-t border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4 text-xs text-neutral-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          © {new Date().getFullYear()}{' '}
          <strong className="text-neutral-800 dark:text-slate-200">
            {lang === 'bn'
              ? 'এল্ ডরাডো মডেল স্কুল (El Dorado Model School)'
              : 'El Dorado Model School (এল্ ডরাডো মডেল স্কুল)'}
          </strong>{' '}
          ·{' '}
          {lang === 'bn'
            ? 'বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা'
            : 'Burirpara, Zirabo, Ashulia, Savar, Dhaka'}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveTab('admission')} className="hover:underline">
            {lang === 'bn' ? 'ভর্তি ও ৬০০+ এন্ট্রি' : 'Admission & 600+ Entry'}
          </button>
          <span>·</span>
          <button onClick={() => setActiveTab('fees')} className="hover:underline">
            {lang === 'bn' ? 'বিকাশ/নগদ/রকেট পেমেন্ট' : 'bKash/Nagad/Rocket'}
          </button>
          <span>·</span>
          <button onClick={() => setActiveTab('security')} className="hover:underline">
            {lang === 'bn' ? 'সিকিউরিটি ও ব্যাকআপ' : '2FA & Backup'}
          </button>
        </div>
      </footer>

      {/* Online Payment Gateway Modal (bKash, Nagad, Rocket) */}
      {payingStudent && (
        <PaymentModal
          student={payingStudent}
          lang={lang}
          onClose={() => setPayingStudent(null)}
          onCompletePayment={handleCompletePayment}
        />
      )}

      {/* Digital QR Tuition Fee Receipt & Verification Certificate Modal */}
      {viewingQrReceipt && (
        <QrReceiptModal
          receipt={viewingQrReceipt}
          lang={lang}
          onClose={() => setViewingQrReceipt(null)}
        />
      )}

      {/* Official Academic Result Card & Guardian Progress Report Modal */}
      {viewingResult && (
        <ResultCardModal
          result={viewingResult}
          student={students.find((s) => s.rollNo === viewingResult.rollNo)}
          lang={lang}
          onClose={() => setViewingResult(null)}
        />
      )}

      {/* Online App & File Instant Download Center Modal */}
      {showDownloadCenter && (
        <OnlineDownloadCenterModal
          lang={lang}
          onClose={() => setShowDownloadCenter(false)}
          students={students}
          payments={payments}
          notices={notices}
          results={results}
          attendanceMap={attendanceMap}
          attendanceDate={attendanceDate}
          isInstallable={isInstallable}
          onNativeInstall={installNativePwa}
          onRestoreDatabase={(restored) => {
            if (restored.students) setStudents(restored.students);
            if (restored.payments) setPayments(restored.payments);
            if (restored.notices) setNotices(restored.notices);
            if (restored.results) setResults(restored.results);
            if (restored.attendanceMap) setAttendanceMap(restored.attendanceMap);
            triggerToast(
              lang === 'bn'
                ? '✓ ব্যাকআপ ফাইল থেকে সম্পূর্ণ ডাটাবেস সফলভাবে রিস্টোর হয়েছে!'
                : '✓ Database restored from backup file!'
            );
          }}
        />
      )}

      {/* Live Customer & Guardian Support Chat */}
      <LiveSupportChat
        lang={lang}
        messages={supportMessages}
        onSendMessage={async (text, autoReply) => {
          const msgId = `msg-${Date.now()}`;
          const newMsg: SupportMessageRecord = {
            id: msgId,
            senderUid: user?.uid || 'local-user',
            senderName:
              user?.displayName || (lang === 'bn' ? 'অভিভাবক / শিক্ষার্থী' : 'Guardian / Student'),
            senderRole: 'guardian',
            text,
            replyText: autoReply,
            status: 'open',
            timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setSupportMessages((prev) => [...prev, newMsg]);

          if (user) {
            try {
              await setDoc(doc(db, 'supportMessages', msgId), {
                senderUid: user.uid,
                senderName: newMsg.senderName.slice(0, 100),
                senderRole: 'guardian',
                text: text.slice(0, 1000),
                replyText: autoReply.slice(0, 1000),
                status: 'open',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, 'supportMessages');
            }
          }
        }}
      />

      {/* Offline Status Banner */}
      <OfflineIndicator lang={lang} />
    </div>
  );
}
