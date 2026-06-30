/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface LandingPageProps {
  onStartRecovering: () => void;
  onSeeDemo: () => void;
  onGoToDashboard: () => void;
  hasGoals: boolean;
}

export default function LandingPage({ onStartRecovering, onSeeDemo, onGoToDashboard, hasGoals }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does OhNo predict failure?",
      a: "Traditional calendars assume linear progress. OhNo simulates your available daily hours against the estimated complexity of remaining tasks. When the math doesn't check out, it flags it instantly."
    },
    {
      q: "What is recovery triage?",
      a: "When you fall behind, OhNo reorganizes your remaining timeline. It compresses low-priority steps, schedules high-impact checkpoints first, and fits the work strictly within your remaining bandwidth."
    },
    {
      q: "Does this replace my calendar or todo list?",
      a: "Yes. OhNo is a Deadline Recovery Operating System. It functions as both your schedule-builder and a teammate keeping you on track."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F1012] text-[#F5F5F5] font-sans selection:bg-accent-app selection:text-black flex flex-col">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] flex items-center justify-center text-[#0F1012] font-black text-sm">
            !
          </div>
          <span className="text-lg font-bold tracking-tight text-[#F5F5F5]">OhNo</span>
        </div>
        <div className="flex items-center gap-3">
          {hasGoals && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-4 py-2 text-xs font-mono font-bold bg-transparent text-[#F5F5F5] border border-[#2A2D33] rounded-lg hover:bg-[#202329] transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={onStartRecovering}
            className="px-4 py-2 text-xs font-mono font-bold bg-accent-app text-black rounded-lg hover:opacity-90 transition-all cursor-pointer"
          >
            New Project
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-32 pb-24 text-center flex flex-col items-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-[#F5F5F5] leading-[1.05] max-w-3xl">
          Stop Missing Deadlines.
        </h1>
        <p className="text-base sm:text-lg text-[#9FA3A9] mt-8 max-w-2xl leading-relaxed">
          OhNo predicts when you'll fail before you do—and helps you recover.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={onStartRecovering}
            className="px-6 py-3 text-xs font-mono font-bold bg-accent-app text-black rounded-lg hover:opacity-90 transition-all cursor-pointer"
          >
            Start New Project
          </button>
          {hasGoals && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-6 py-3 text-xs font-mono font-bold bg-transparent text-[#F5F5F5] border border-[#2A2D33] rounded-lg hover:bg-[#202329] transition-all cursor-pointer"
            >
              Go to Dashboard
            </button>
          )}
          <button
            type="button"
            onClick={onSeeDemo}
            className="px-6 py-3 text-xs font-mono font-bold bg-transparent text-[#F5F5F5] border border-[#2A2D33] rounded-lg hover:bg-[#202329] transition-all cursor-pointer"
          >
            See Demo
          </button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="border-t border-[#2A2D33]/40 py-28 bg-[#18191D]/10">
        <div className="max-w-5xl mx-auto px-6">
          <span className="text-xs font-mono text-[#9FA3A9]">// The problem</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F5] mt-4 max-w-xl">
            Your calendar is lying to you.
          </h2>
          <p className="text-sm sm:text-base text-[#9FA3A9] mt-6 max-w-2xl leading-relaxed">
            Traditional tools show you *what* is due, but never *if* you actually have the hours to complete it. They watch you slip behind in silence, leaving you with last-minute panic when recovery is no longer possible.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-[#2A2D33]/40 py-28">
        <div className="max-w-5xl mx-auto px-6">
          <span className="text-xs font-mono text-[#9FA3A9]">// How OhNo works</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F5] mt-4 mb-16">
            Proactive panic mitigation.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-[#D9FF57]">01 / SIMULATE</span>
              <h3 className="text-sm font-bold text-[#F5F5F5]">Hour Calibration</h3>
              <p className="text-xs sm:text-sm text-[#9FA3A9] leading-relaxed">
                OhNo continuously simulates your timeline, measuring task complexity against your active daily available hour budget.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-[#D9FF57]">02 / PREDICT</span>
              <h3 className="text-sm font-bold text-[#F5F5F5]">Early Drift Detection</h3>
              <p className="text-xs sm:text-sm text-[#9FA3A9] leading-relaxed">
                Before "oh no" becomes reality, our algorithm flags schedule slippage and shows you exactly where the system is overloaded.
              </p>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-[#D9FF57]">03 / RECOVER</span>
              <h3 className="text-sm font-bold text-[#F5F5F5]">Resilient Triage</h3>
              <p className="text-xs sm:text-sm text-[#9FA3A9] leading-relaxed">
                With a single tap, restructure incomplete items: compressing tasks, adjusting priorities, and creating a clean path forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specs Section (Pure typography, no boxed cards) */}
      <section className="border-t border-[#2A2D33]/40 py-28 bg-[#18191D]/10">
        <div className="max-w-5xl mx-auto px-6">
          <span className="text-xs font-mono text-[#9FA3A9]">// System specs</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F5] mt-4 mb-16">
            Engineered for high-stakes workloads.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#F5F5F5]">Recovery OS</h3>
              <p className="text-xs sm:text-sm text-[#9FA3A9] leading-relaxed">
                Automatically adjusts timelines dynamically when days are missed, recalculating effort allocation parameters instantly.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-[#F5F5F5]">Teammate Guidance</h3>
              <p className="text-xs sm:text-sm text-[#9FA3A9] leading-relaxed">
                Provides contextual execution notes and scheduling advice to save you from fatigue and burnout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-[#2A2D33]/40 py-28">
        <div className="max-w-5xl mx-auto px-6">
          <span className="text-xs font-mono text-[#9FA3A9]">// Validation</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F5F5F5] mt-4 mb-16">
            What survivors are saying.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#F5F5F5] italic leading-relaxed">
                "OhNo predicted I would fail my systems programming draft 3 days early. The recovery plan cut out non-essential documentation blocks and saved my grade."
              </p>
              <div className="text-[10px] font-mono text-[#9FA3A9] mt-6 font-semibold">// Alex G., CS Undergraduate</div>
            </div>
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-[#F5F5F5] italic leading-relaxed">
                "It feels like having a pragmatic, hyper-organized partner. It doesn't nag you with alarms; it just silently updates the path when you drift."
              </p>
              <div className="text-[10px] font-mono text-[#9FA3A9] mt-6 font-semibold">// Sarah M., Product Engineer</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-[#2A2D33]/40 py-28 bg-[#18191D]/5">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F5F5F5] text-center mb-16">
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-[#2A2D33]/40">
            {faqs.map((faq, idx) => (
              <details key={idx} className="group py-5 outline-none">
                <summary className="w-full flex items-center justify-between text-left text-xs font-bold text-[#F5F5F5] hover:text-accent-app transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-xs text-text-secondary font-mono ml-4 group-open:hidden">[+]</span>
                  <span className="text-xs text-text-secondary font-mono ml-4 hidden group-open:inline">[-]</span>
                </summary>
                <p className="text-xs text-[#9FA3A9] mt-3 leading-relaxed animate-page-slide">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2D33]/40 bg-[#0F1012] py-12 text-center text-xs text-[#9FA3A9] font-mono mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} OhNo. All recovery vectors aligned.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#F5F5F5] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#F5F5F5] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#F5F5F5] transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
