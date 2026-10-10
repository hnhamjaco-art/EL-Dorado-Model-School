import React, { useState } from 'react';
import { MessageSquare, Send, X, Headphones } from 'lucide-react';
import { SupportMessageRecord } from '../data/initialData';

interface LiveSupportChatProps {
  lang: 'bn' | 'en';
  messages: SupportMessageRecord[];
  onSendMessage: (text: string, autoReply: string) => Promise<void>;
}

export const LiveSupportChat: React.FC<LiveSupportChatProps> = ({
  lang,
  messages,
  onSendMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const generateInstantReply = (userText: string): string => {
    const lower = userText.toLowerCase();
    if (
      lower.includes('বেতন') ||
      lower.includes('fee') ||
      lower.includes('bkash') ||
      lower.includes('বিকাশ') ||
      lower.includes('নগদ')
    ) {
      return lang === 'bn'
        ? 'ধন্যবাদ! আপনি "বেতন ও পেমেন্ট" ট্যাবে গিয়ে শিক্ষার্থীর রোল নম্বর লিখে বকেয়া বেতন দেখতে পারবেন এবং বিকাশ, নগদ বা রকেটের মাধ্যমে সাথে সাথে পরিশোধ করে মানি রিসিট ডাউনলোড করতে পারবেন।'
        : 'Thank you! Go to the "Tuition Fees" tab, enter the Roll Number to view due balance, and pay directly via bKash, Nagad, or Rocket for an instant receipt.';
    }
    if (lower.includes('রেজাল্ট') || lower.includes('result') || lower.includes('প্রগ্রেস')) {
      return lang === 'bn'
        ? 'শিক্ষার্থীর বিষয়ভিত্তিক রেজাল্ট কার্ড ও প্রগ্রেস রিপোর্ট দেখতে "প্রগ্রেস ও রেজাল্ট" মেনুতে ক্লিক করুন এবং মার্কশিট প্রিন্ট করে নিন।'
        : 'You can inspect subject-wise marksheets and guardian progress reports under the "Results & Progress" tab.';
    }
    return lang === 'bn'
      ? 'এল ডরাডো মডেল স্কুল হেল্পডেস্কে যোগাযোগের জন্য ধন্যবাদ (রাঙ্গারপাড়া, জিরাবো, আশুলিয়া, সাভার, ঢাকা)। আমাদের অফিস প্রতিনিধি শীঘ্রই আপনার প্রশ্নের বিস্তারিত উত্তর দেবেন। জরুরি প্রয়োজনে কল করুন: 01711-234567.'
      : 'Thank you for contacting El Dorado Model School Support Desk (Zirabo, Ashulia, Savar, Dhaka). Our admin team has logged your query. Hotline: 01711-234567.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const textToSend = input.trim();
    setInput('');
    setSending(true);
    try {
      const reply = generateInstantReply(textToSend);
      await onSendMessage(textToSend, reply);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 no-print">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-full bg-red-700 hover:bg-red-800 px-4 py-3 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{lang === 'bn' ? 'লাইভ সাপোর্ট চ্যাট' : 'Live Support Chat'}</span>
        </button>
      ) : (
        <div className="w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[480px]">
          <div className="bg-red-700 px-4 py-3 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4" />
              <div>
                <h4 className="text-xs font-bold">
                  {lang === 'bn'
                    ? 'এল ডরাডো স্কুল লাইভ হেল্পডেস্ক'
                    : 'El Dorado School Live Support'}
                </h4>
                <p className="text-[10px] opacity-90">
                  {lang === 'bn' ? 'তাৎক্ষণিক অভিভাবক ও শিক্ষার্থী সহায়তা' : 'Instant Guardian & Student Helpdesk'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-black/20 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 flex-1 overflow-y-auto space-y-3 max-h-72 text-xs bg-neutral-50 dark:bg-slate-950/60">
            <div className="rounded-lg bg-white dark:bg-slate-800 border border-neutral-200 dark:border-neutral-700 p-2.5 text-neutral-700 dark:text-neutral-200">
              {lang === 'bn'
                ? 'আসসালামু আলাইকুম! এল ডরাডো মডেল স্কুলের লাইভ সাপোর্টে স্বাগতম। রোল অনুযায়ী বেতন, বিকাশ/নগদ পেমেন্ট, অনলাইন পরীক্ষা বা রেজাল্ট সংক্রান্ত যেকোনো প্রশ্ন লিখুন।'
                : 'Welcome to El Dorado Model School Live Support! Ask us anything about roll-based tuition fees, bKash/Nagad payment, online exams, or result cards.'}
            </div>

            {messages.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <div className="ml-8 rounded-lg bg-red-700 text-white p-2.5">
                  <div className="text-[10px] opacity-80 mb-0.5">
                    {m.senderName} · {m.timeStr}
                  </div>
                  <div>{m.text}</div>
                </div>
                {m.replyText && (
                  <div className="mr-6 rounded-lg bg-white dark:bg-slate-800 border border-neutral-200 dark:border-neutral-700 p-2.5 text-neutral-700 dark:text-neutral-200">
                    <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                      {lang === 'bn' ? 'স্কুল হেল্পডেস্ক:' : 'School Support:'}
                    </div>
                    <div>{m.replyText}</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Question Prompts */}
          <div className="px-3 py-1.5 bg-neutral-100 dark:bg-slate-800/80 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() =>
                setInput(
                  lang === 'bn'
                    ? 'বিকাশে বেতন পরিশোধ করার নিয়ম কী?'
                    : 'How can I pay tuition fees via bKash?'
                )
              }
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
            >
              {lang === 'bn' ? 'বিকাশ পেমেন্ট নিয়ম' : 'bKash Fee Help'}
            </button>
            <button
              type="button"
              onClick={() =>
                setInput(
                  lang === 'bn'
                    ? 'রেজাল্ট কার্ড ও প্রগ্রেস রিপোর্ট কীভাবে দেখবো?'
                    : 'How to view Result Card?'
                )
              }
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 whitespace-nowrap"
            >
              {lang === 'bn' ? 'রেজাল্ট কার্ড তথ্য' : 'Result Card'}
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-2.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-slate-900"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'bn' ? 'আপনার বার্তা লিখুন...' : 'Type your message...'}
              maxLength={400}
              className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="p-2 rounded-lg bg-red-700 hover:bg-red-800 text-white disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
