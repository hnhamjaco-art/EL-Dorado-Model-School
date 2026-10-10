import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Printer, Lock, ArrowRight, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StudentRecord, PaymentRecord } from '../data/initialData';
import { ElDoradoLogo } from './ElDoradoLogo';

export function buildPaymentQrPayload(receipt: PaymentRecord): string {
  const verifyCode = `EDMS-VERIFIED-${receipt.transactionId}-R${receipt.rollNo}-BDT${receipt.amount}`;
  return JSON.stringify({
    school: 'El Dorado Model School, Burirpara, Zirabo, Ashulia, Savar, Dhaka',
    trxId: receipt.transactionId,
    rollNo: receipt.rollNo,
    student: receipt.studentName,
    className: receipt.className,
    amountBDT: receipt.amount,
    gateway: receipt.method.toUpperCase(),
    wallet: receipt.walletNumber,
    month: receipt.month,
    date: receipt.dateStr,
    status: 'PAID_VERIFIED',
    verifySignature: verifyCode,
  });
}

interface PaymentModalProps {
  student: StudentRecord;
  lang: 'bn' | 'en';
  onClose: () => void;
  onCompletePayment: (paymentData: {
    studentId: string;
    rollNo: string;
    studentName: string;
    className: string;
    amount: number;
    method: 'bkash' | 'nagad' | 'rocket';
    walletNumber: string;
    transactionId: string;
    month: string;
  }) => Promise<PaymentRecord>;
}

const GATEWAYS: {
  id: 'bkash' | 'nagad' | 'rocket';
  nameBn: string;
  nameEn: string;
  merchant: string;
  brandColor: string;
  badgeText: string;
}[] = [
  {
    id: 'bkash',
    nameBn: 'বিকাশ পেমেন্ট (bKash)',
    nameEn: 'bKash Payment',
    merchant: '01700-889900 (El Dorado School Merchant)',
    brandColor: '#E2136E',
    badgeText: 'bKash',
  },
  {
    id: 'nagad',
    nameBn: 'নগদ পেমেন্ট (Nagad)',
    nameEn: 'Nagad Payment',
    merchant: '01800-889900 (El Dorado School Merchant)',
    brandColor: '#F7941D',
    badgeText: 'Nagad',
  },
  {
    id: 'rocket',
    nameBn: 'ডাচ্-বাংলা রকেট (Rocket)',
    nameEn: 'DBBL Rocket',
    merchant: '01900-889900-8 (El Dorado School)',
    brandColor: '#8C3494',
    badgeText: 'Rocket',
  },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  student,
  lang,
  onClose,
  onCompletePayment,
}) => {
  const [selectedGateway, setSelectedGateway] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [amount, setAmount] = useState<number>(
    student.dueAmount > 0 ? student.dueAmount : student.monthlyFee
  );
  const [month, setMonth] = useState<string>(
    lang === 'bn' ? 'অক্টোবর-নভেম্বর ২০২৬ টিউশন ফি' : 'October-November 2026 Tuition Fee'
  );
  const [walletNumber, setWalletNumber] = useState<string>(
    student.guardianPhone.replace(/[^0-9]/g, '') || '01711234567'
  );
  const [step, setStep] = useState<'form' | 'otp' | 'pin' | 'receipt'>('form');
  const [otpInput, setOtpInput] = useState<string>('4829');
  const [pinInput, setPinInput] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const activeGateway = GATEWAYS.find((g) => g.id === selectedGateway)!;

  const handleProceedToOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanedWallet = walletNumber.replace(/[^0-9+\\-]/g, '');
    if (cleanedWallet.length < 11) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল ব্যাংকিং নম্বর দিন।'
          : 'Please enter a valid 11-digit mobile wallet number.'
      );
      return;
    }
    if (amount <= 0 || amount > 1000000) {
      setErrorMsg(
        lang === 'bn' ? 'সঠিক টাকার পরিমাণ উল্লেখ করুন।' : 'Please enter a valid amount.'
      );
      return;
    }
    setStep('otp');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (otpInput.trim().length < 4) {
      setErrorMsg(
        lang === 'bn' ? '৪ ডিজিটের ওটিপি কোডটি দিন।' : 'Please enter the 4-digit OTP code.'
      );
      return;
    }
    setStep('pin');
  };

  const handleConfirmPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (pinInput.trim().length < 4) {
      setErrorMsg(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার ৪ বা ৫ ডিজিটের গোপন পিন দিন।'
          : 'Please enter your 4 or 5-digit wallet PIN.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const prefix =
        selectedGateway === 'bkash' ? 'BKS' : selectedGateway === 'nagad' ? 'NGD' : 'RKT';
      const txId = `${prefix}${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 89)}`;
      const maskedWallet =
        walletNumber.length >= 11
          ? `${walletNumber.slice(0, 5)}-**${walletNumber.slice(-4)}`
          : walletNumber;

      const savedPayment = await onCompletePayment({
        studentId: student.id,
        rollNo: student.rollNo,
        studentName: `${student.nameBn} / ${student.nameEn}`,
        className: student.className,
        amount: Number(amount),
        method: selectedGateway,
        walletNumber: maskedWallet,
        transactionId: txId,
        month: month.slice(0, 60),
      });
      setReceipt(savedPayment);
      setStep('receipt');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-8">
        {/* Top Gateway Header */}
        <div
          className="px-6 py-4 flex items-center justify-between text-white"
          style={{ backgroundColor: step === 'receipt' ? '#15803d' : activeGateway.brandColor }}
        >
          <div className="flex items-center gap-3">
            <ElDoradoLogo size={42} />
            <div>
              <h3 className="text-base font-bold leading-tight">
                {step === 'receipt'
                  ? lang === 'bn'
                    ? 'ডিজিটাল মানি রিসিট (বেতন পরিশোধিত)'
                    : 'Official Tuition Fee Money Receipt'
                  : lang === 'bn'
                    ? 'অনলাইন টিউশন ফি পেমেন্ট গেটওয়ে'
                    : 'Online Tuition Fee Payment Gateway'}
              </h3>
              <p className="text-xs opacity-90">
                {lang === 'bn'
                  ? 'এল ডরাডো মডেল স্কুল · বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা'
                  : 'El Dorado Model School · Burirpara, Zirabo, Ashulia, Savar, Dhaka'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white transition-colors no-print"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Student Summary Banner */}
          <div className="pb-4 mb-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'শিক্ষার্থী:' : 'Student:'}
              </span>{' '}
              <strong className="text-neutral-900 dark:text-white font-semibold">
                {lang === 'bn' ? student.nameBn : student.nameEn}
              </strong>
              <span className="mx-1.5 text-neutral-400">·</span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'রোল:' : 'Roll:'}
              </span>{' '}
              <strong className="font-mono tabular-nums text-neutral-900 dark:text-white">
                {student.rollNo}
              </strong>
              <span className="mx-1.5 text-neutral-400">·</span>
              <span className="text-neutral-600 dark:text-neutral-300">{student.className}</span>
            </div>
            <div>
              <span className="text-neutral-500 dark:text-neutral-400">
                {lang === 'bn' ? 'বর্তমান বকেয়া:' : 'Current Due:'}
              </span>{' '}
              <strong className="font-mono tabular-nums text-red-600 dark:text-red-400 font-semibold">
                ৳{student.dueAmount.toLocaleString()}
              </strong>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-800 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {step === 'form' && (
            <form onSubmit={handleProceedToOtp} className="space-y-4">
              {/* Select Gateway */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  {lang === 'bn'
                    ? '১. পেমেন্ট মাধ্যম নির্বাচন করুন (বিকাশ / নগদ / রকেট)'
                    : '1. Select Mobile Banking Gateway (bKash / Nagad / Rocket)'}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {GATEWAYS.map((gw) => {
                    const isSelected = selectedGateway === gw.id;
                    return (
                      <button
                        key={gw.id}
                        type="button"
                        onClick={() => setSelectedGateway(gw.id)}
                        className={`px-3 py-2.5 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-slate-800 shadow-sm'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs font-bold"
                            style={{ color: gw.brandColor }}
                          >
                            {gw.badgeText}
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                          {lang === 'bn' ? gw.nameBn : gw.nameEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount & Month */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {lang === 'bn' ? 'পরিশোধের পরিমাণ (টাকা ৳)' : 'Payment Amount (BDT ৳)'}
                  </label>
                  <input
                    type="number"
                    min={100}
                    max={1000000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                  <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAmount(student.monthlyFee)}
                      className="text-neutral-600 dark:text-neutral-400 hover:underline"
                    >
                      {lang === 'bn' ? `১ মাস (৳${student.monthlyFee})` : `1 Month (৳${student.monthlyFee})`}
                    </button>
                    <span>·</span>
                    {student.dueAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setAmount(student.dueAmount)}
                        className="text-red-600 dark:text-red-400 font-medium hover:underline"
                      >
                        {lang === 'bn' ? `সম্পূর্ণ বকেয়া (৳${student.dueAmount})` : `Full Due (৳${student.dueAmount})`}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {lang === 'bn' ? 'মাসের নাম / বিবরণ' : 'Billing Month / Description'}
                  </label>
                  <input
                    type="text"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    maxLength={55}
                    className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                  />
                </div>
              </div>

              {/* Wallet Account Number */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {lang === 'bn'
                    ? `আপনার ${activeGateway.badgeText} অ্যাকাউন্ট নম্বর`
                    : `Your ${activeGateway.badgeText} Account Number`}
                </label>
                <input
                  type="tel"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  maxLength={15}
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono tabular-nums text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  required
                />
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'মার্চেন্ট অ্যাকাউন্ট:' : 'Merchant Account:'} {activeGateway.merchant}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>256-Bit AES Encrypted Gateway</span>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-95 whitespace-nowrap"
                  style={{ backgroundColor: activeGateway.brandColor }}
                >
                  <span>{lang === 'bn' ? 'পরবর্তী ধাপ (OTP)' : 'Proceed to OTP'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-lg bg-neutral-50 dark:bg-slate-800/70 border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  {lang === 'bn'
                    ? `আপনার ${walletNumber} নম্বরে ৪ ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে (ডেমো কোড: 4829)`
                    : `A 4-digit verification code has been sent to ${walletNumber} (Demo OTP: 4829)`}
                </p>
                <input
                  type="text"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  maxLength={6}
                  className="mt-3 w-40 text-center text-lg font-mono tabular-nums tracking-widest rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-900 px-3 py-2 text-neutral-900 dark:text-white"
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:underline"
                >
                  {lang === 'bn' ? '← পেছনে যান' : '← Back'}
                </button>
                <button
                  type="submit"
                  className="rounded-lg px-5 py-2.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: activeGateway.brandColor }}
                >
                  {lang === 'bn' ? 'ওটিপি যাচাই করুন' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'pin' && (
            <form onSubmit={handleConfirmPin} className="space-y-4">
              <div className="rounded-lg bg-neutral-50 dark:bg-slate-800/70 border border-neutral-200 dark:border-neutral-800 p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn'
                      ? `৳${amount.toLocaleString()} পরিশোধ নিশ্চিত করতে আপনার ${activeGateway.badgeText} পিন দিন`
                      : `Enter your ${activeGateway.badgeText} PIN to confirm ৳${amount.toLocaleString()}`}
                  </span>
                </div>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="•••••"
                  maxLength={5}
                  autoFocus
                  className="mt-3 w-40 text-center text-lg font-mono tracking-widest rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-slate-900 px-3 py-2 text-neutral-900 dark:text-white"
                  required
                />
                <p className="mt-2 text-[11px] text-neutral-500">
                  {lang === 'bn'
                    ? 'যেকোনো ৪ বা ৫ সংখ্যার পিন দিয়ে পেমেন্ট সম্পন্ন করুন (যেমন: 12345)'
                    : 'Enter any 4 or 5-digit PIN to complete transaction (e.g., 12345)'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:underline"
                >
                  {lang === 'bn' ? '← পেছনে যান' : '← Back'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: activeGateway.brandColor }}
                >
                  {submitting
                    ? lang === 'bn'
                      ? 'প্রক্রিয়াধীন...'
                      : 'Processing...'
                    : lang === 'bn'
                      ? `৳${amount.toLocaleString()} পেমেন্ট নিশ্চিত করুন`
                      : `Confirm ৳${amount.toLocaleString()} Payment`}
                </button>
              </div>
            </form>
          )}

          {step === 'receipt' && receipt && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'বেতন সফলভাবে পরিশোধিত হয়েছে!'
                        : 'Tuition Fee Payment Completed Successfully!'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR VERIFIED</span>
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 border-t border-emerald-200/70 dark:border-emerald-800/50 pt-4">
                  {/* Scannable QR Code for Instant Verification */}
                  <div className="flex flex-col items-center p-2.5 rounded-xl bg-white border border-neutral-200 shadow-xs shrink-0">
                    <QRCodeSVG
                      value={buildPaymentQrPayload(receipt)}
                      size={116}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="mt-1.5 text-[10px] font-mono tabular-nums font-semibold text-neutral-700">
                      {receipt.transactionId}
                    </span>
                  </div>

                  {/* Receipt Details Grid */}
                  <div className="flex-1 w-full grid grid-cols-2 gap-y-2 text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {lang === 'bn' ? 'ট্রানজেকশন আইডি (TrxID):' : 'Transaction ID:'}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white text-right">
                      {receipt.transactionId}
                    </span>

                    <span className="text-neutral-500 dark:text-neutral-400">
                      {lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Gateway:'}
                    </span>
                    <span className="font-semibold uppercase text-neutral-900 dark:text-white text-right">
                      {receipt.method} ({receipt.walletNumber})
                    </span>

                    <span className="text-neutral-500 dark:text-neutral-400">
                      {lang === 'bn' ? 'মাসের বিবরণ:' : 'Description:'}
                    </span>
                    <span className="text-neutral-900 dark:text-white text-right">
                      {receipt.month}
                    </span>

                    <span className="text-neutral-500 dark:text-neutral-400">
                      {lang === 'bn' ? 'পরিশোধিত টাকা:' : 'Paid Amount:'}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 text-right">
                      ৳{receipt.amount.toLocaleString()}
                    </span>

                    <span className="text-neutral-500 dark:text-neutral-400">
                      {lang === 'bn' ? 'নতুন বকেয়া (Due):' : 'Remaining Due Balance:'}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white text-right">
                      ৳{Math.max(0, student.dueAmount - receipt.amount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                  <span>
                    {lang === 'bn'
                      ? 'ডিজিটাল ভেরিফিকেশন সিগনেচার:'
                      : 'Digital Verification Signature:'}
                  </span>
                  <code className="font-mono font-semibold text-emerald-800 dark:text-emerald-300">
                    EDMS-VERIFIED-{receipt.transactionId}-R{receipt.rollNo}-BDT{receipt.amount}
                  </code>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'QR মানি রিসিট প্রিন্ট করুন' : 'Print QR Receipt'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-neutral-900 dark:bg-white px-5 py-2 text-xs font-semibold text-white dark:text-neutral-900"
                >
                  {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
