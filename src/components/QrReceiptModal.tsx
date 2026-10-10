import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Search,
  AlertCircle,
  Copy,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentRecord } from '../data/initialData';
import { ElDoradoLogo } from './ElDoradoLogo';
import { buildPaymentQrPayload } from './PaymentModal';
import { downloadSingleQrReceiptHtml } from '../utils/downloadCenter';

interface QrReceiptModalProps {
  receipt: PaymentRecord;
  lang: 'bn' | 'en';
  onClose: () => void;
}

export const QrReceiptModal: React.FC<QrReceiptModalProps> = ({ receipt, lang, onClose }) => {
  const [copied, setCopied] = useState(false);
  const qrPayload = buildPaymentQrPayload(receipt);
  const verifySignature = `EDMS-VERIFIED-${receipt.transactionId}-R${receipt.rollNo}-BDT${receipt.amount}`;

  const handleCopySignature = async () => {
    try {
      await navigator.clipboard.writeText(verifySignature);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden my-8">
        {/* Top Action Bar */}
        <div className="px-6 py-3.5 bg-emerald-700 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <QrCode className="w-4 h-4" />
            <span>
              {lang === 'bn'
                ? 'ডিজিটাল QR মানি রিসিট ও পেমেন্ট ভেরিফিকেশন সনদ'
                : 'Digital QR Tuition Receipt & Payment Verification Certificate'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadSingleQrReceiptHtml(receipt)}
              className="flex items-center gap-1.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-50 px-3 py-1.5 text-xs font-bold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রিসিট ডাউনলোড' : 'Download'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-lg bg-white/15 hover:bg-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'প্রিন্ট রিসিট' : 'Print Receipt'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 space-y-5">
          {/* School Header */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <ElDoradoLogo size={64} />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                {lang === 'bn'
                  ? 'এল্ ডরাডো মডেল স্কুল (El Dorado Model School)'
                  : 'El Dorado Model School (এল্ ডরাডো মডেল স্কুল)'}
              </h3>
              <p className="text-xs text-red-700 dark:text-red-400 font-semibold">
                {lang === 'bn'
                  ? 'জ্ঞানই আলো · স্থাপিতঃ ২০০৯ খ্রীঃ'
                  : 'Knowledge is Light · Est. 2009'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {lang === 'bn'
                  ? 'বুড়িরপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা'
                  : 'Burirpara, Zirabo, Ashulia, Savar, Dhaka'}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'bn' ? 'ভেরিফায়েড পেইড' : 'VERIFIED PAID'}</span>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-neutral-500 mt-0.5">
                {receipt.dateStr}
              </div>
            </div>
          </div>

          {/* QR Code + Transaction Data Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-5 flex flex-col items-center justify-center p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white shadow-xs">
              <QRCodeSVG value={qrPayload} size={148} level="H" includeMargin={false} />
              <span className="mt-2 text-[11px] font-mono tabular-nums font-bold text-neutral-800">
                {receipt.transactionId}
              </span>
              <span className="text-[10px] text-neutral-500 text-center mt-0.5">
                {lang === 'bn'
                  ? 'স্মার্টফোন ক্যামেরা দিয়ে স্ক্যান করে যাচাই করুন'
                  : 'Scan with any QR reader to verify'}
              </span>
            </div>

            <div className="sm:col-span-7 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'ট্রানজেকশন আইডি (TrxID):' : 'Transaction ID:'}
                </span>
                <strong className="font-mono tabular-nums text-neutral-900 dark:text-white">
                  {receipt.transactionId}
                </strong>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'শিক্ষার্থীর রোল নম্বর:' : 'Student Roll No:'}
                </span>
                <strong className="font-mono tabular-nums text-neutral-900 dark:text-white">
                  #{receipt.rollNo}
                </strong>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'শিক্ষার্থীর নাম:' : 'Student Name:'}
                </span>
                <strong className="text-neutral-900 dark:text-white text-right">
                  {receipt.studentName}
                </strong>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'শ্রেণি:' : 'Class:'}
                </span>
                <strong className="text-neutral-900 dark:text-white">{receipt.className}</strong>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'মাসের বিবরণ:' : 'Fee Description:'}
                </span>
                <span className="text-neutral-900 dark:text-white text-right">{receipt.month}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500 dark:text-neutral-400">
                  {lang === 'bn' ? 'পেমেন্ট মাধ্যম:' : 'Payment Gateway:'}
                </span>
                <strong className="uppercase text-neutral-900 dark:text-white">
                  {receipt.method} ({receipt.walletNumber})
                </strong>
              </div>

              <div className="flex justify-between pt-1 text-sm">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {lang === 'bn' ? 'পরিশোধিত মোট টাকা:' : 'Total Amount Paid:'}
                </span>
                <strong className="font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                  ৳{receipt.amount.toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          {/* Digital Signature Footer */}
          <div className="rounded-lg bg-neutral-50 dark:bg-slate-800/70 border border-neutral-200 dark:border-neutral-800 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 truncate">
                {verifySignature}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopySignature}
              className="flex items-center gap-1 rounded border border-neutral-300 dark:border-neutral-700 px-2.5 py-1 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-slate-800 no-print"
            >
              <Copy className="w-3 h-3" />
              <span>
                {copied
                  ? lang === 'bn'
                    ? 'কপি হয়েছে!'
                    : 'Copied!'
                  : lang === 'bn'
                    ? 'কোড কপি'
                    : 'Copy Code'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface QrVerificationBarProps {
  payments: PaymentRecord[];
  lang: 'bn' | 'en';
  onInspectReceipt: (receipt: PaymentRecord) => void;
}

export const QrVerificationBar: React.FC<QrVerificationBarProps> = ({
  payments,
  lang,
  onInspectReceipt,
}) => {
  const [verifyInput, setVerifyInput] = useState('');
  const [verifiedPayment, setVerifiedPayment] = useState<PaymentRecord | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleVerifyLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = verifyInput.trim();
    if (!raw) return;

    setNotFound(false);
    setVerifiedPayment(null);

    // Check if user pasted full JSON payload from QR scan
    let extractedTrx = raw;
    try {
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        if (parsed.trxId) extractedTrx = String(parsed.trxId);
      }
    } catch {
      // not JSON
    }

    const q = extractedTrx.toLowerCase();
    const found = payments.find(
      (p) =>
        p.transactionId.toLowerCase() === q ||
        `edms-verified-${p.transactionId}-r${p.rollNo}-bdt${p.amount}`.toLowerCase() === q ||
        q.includes(p.transactionId.toLowerCase())
    );

    if (found) {
      setVerifiedPayment(found);
    } else {
      setNotFound(true);
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              {lang === 'bn'
                ? 'কুইক QR ও ট্রানজেকশন আইডি (TrxID) ডিজিটাল পেমেন্ট ভেরিফিকেশন'
                : 'Quick QR & TrxID Digital Tuition Receipt Verification'}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'মানি রিসিটের QR কোড স্ক্যান করা তথ্য অথবা ট্রানজেকশন আইডি (TrxID) লিখে পেমেন্টের সত্যতা সাথে সাথে যাচাই করুন'
                : 'Paste scanned QR payload, Verification Signature, or Transaction ID (TrxID) to verify paid tuition'}
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyLookup} className="flex items-center gap-2 w-full lg:w-auto">
          <input
            type="text"
            value={verifyInput}
            onChange={(e) => {
              setVerifyInput(e.target.value);
              setNotFound(false);
            }}
            placeholder={
              lang === 'bn'
                ? 'TrxID বা QR ভেরিফিকেশন কোড দিন...'
                : 'Enter TrxID or QR Verification Code...'
            }
            className="w-full lg:w-72 rounded-lg border border-neutral-300 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'রিসিট যাচাই করুন' : 'Verify Receipt'}</span>
          </button>
        </form>
      </div>

      {verifiedPayment && (
        <div className="pt-3 border-t border-neutral-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'bn'
                ? `✓ ভেরিফায়েড পেমেন্ট! রোল #${verifiedPayment.rollNo} (${verifiedPayment.studentName}) · পরিমাণ: ৳${verifiedPayment.amount.toLocaleString()} · মাধ্যম: ${verifiedPayment.method.toUpperCase()} · TrxID: ${verifiedPayment.transactionId}`
                : `✓ Verified Authentic Receipt! Roll #${verifiedPayment.rollNo} (${verifiedPayment.studentName}) · Paid: ৳${verifiedPayment.amount.toLocaleString()} via ${verifiedPayment.method.toUpperCase()}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onInspectReceipt(verifiedPayment)}
            className="rounded-lg border border-emerald-300 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            {lang === 'bn' ? 'QR সনদ ও প্রিন্ট দেখুন →' : 'Open QR Certificate →'}
          </button>
        </div>
      )}

      {notFound && (
        <div className="pt-3 border-t border-neutral-200 dark:border-slate-800 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'এই ট্রানজেকশন আইডি বা QR কোডের সাথে কোনো পরিশোধিত মানি রিসিট পাওয়া যায়নি।'
              : 'No matching paid tuition receipt found for this Transaction ID or QR signature.'}
          </span>
        </div>
      )}
    </div>
  );
};
