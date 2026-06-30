/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, Terminal, Command, X } from 'lucide-react';
import { Goal, Task } from '../types';

interface SpotlightProps {
  isOpen: boolean;
  onClose: () => void;
  goals: Goal[];
  onSelectGoal: (goal: Goal) => void;
  onTriggerPanic: () => void;
  onTriggerSimulateDay: () => void;
  onTriggerThemeToggle: () => void;
  onTriggerDemo: () => void;
  onNavigate: (tab: 'dashboard' | 'timeline' | 'settings' | 'workspace') => void;
  onPlanRecover?: (goal: Goal, availableHoursRemaining: number) => Promise<void>;
}

export default function Spotlight({
  isOpen,
  onClose,
  goals,
  onSelectGoal,
  onTriggerPanic,
  onTriggerSimulateDay,
  onTriggerThemeToggle,
  onTriggerDemo,
  onNavigate,
  onPlanRecover
}: SpotlightProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter commands and items
  const commands = [
    { name: "Reschedule everything", action: () => { alert("AI Decision engine initiated schedule recovery. Restructured ML paper deadlines."); onClose(); }, desc: "Resolve timeline conflicts globally" },
    { name: "I only have 2 hours today", action: () => { if (onPlanRecover && goals[0]) { onPlanRecover(goals[0], 2); } alert("Applied 2-hour available triage. Postponed non-critical milestones."); onClose(); }, desc: "Triage available bandwidth to 2h" },
    { name: "Move low priority work", action: () => { alert("Postponed Operating Systems Lab reports by 2 days (+18% stress relief)."); onClose(); }, desc: "Prune low impact milestones" },
    { name: "What's my biggest risk?", action: () => { alert("Machine Learning Research Paper is beginning to drift. Procrastinating today adds +3.5h delay debt."); onClose(); }, desc: "Assess timeline bottleneck" },
    { name: "Generate emergency schedule", action: () => { alert("Emergency Schedule successfully generated. Slashed advanced neural parameters task."); onClose(); }, desc: "Generate panic response schedule" },
    { name: "Create new project", action: () => { onNavigate('timeline'); onClose(); }, desc: "Opens schedule initialization form" },
    { name: "Trigger panic recovery", action: () => { onTriggerPanic(); onClose(); }, desc: "Launches 'I messed up' triage menu" },
    { name: "Simulate +1 day", action: () => { onTriggerSimulateDay(); onClose(); }, desc: "Advance the station time clock" },
    { name: "Toggle theme", action: () => { onTriggerThemeToggle(); onClose(); }, desc: "Switch Light and Dark modes" },
    { name: "Load demo mode", action: () => { onTriggerDemo(); onClose(); }, desc: "Preload Alex ML project logs" },
    { name: "Open dashboard HUD", action: () => { onNavigate('dashboard'); onClose(); }, desc: "Jump to overview brief" }
  ];

  const searchResults: { type: string; title: string; category?: string; target: any; action: () => void }[] = [];

  goals.forEach(g => {
    if (g.title.toLowerCase().includes(query.toLowerCase())) {
      searchResults.push({
        type: "Project",
        title: g.title,
        category: g.category,
        target: g,
        action: () => { onSelectGoal(g); onClose(); }
      });
    }

    g.tasks.forEach(t => {
      if (t.title.toLowerCase().includes(query.toLowerCase())) {
        searchResults.push({
          type: "Task",
          title: t.title,
          category: `Project: ${g.title}`,
          target: t,
          action: () => { onSelectGoal(g); onClose(); }
        });
      }
    });

    if (g.aiAnalysis.toLowerCase().includes(query.toLowerCase())) {
      searchResults.push({
        type: "AI Suggestion",
        title: g.aiAnalysis,
        category: `Project: ${g.title}`,
        target: g,
        action: () => { onSelectGoal(g); onClose(); }
      });
    }
  });

  const filteredCommands = commands.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase()) || 
    c.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1012]/80 backdrop-blur-sm flex items-start justify-center p-4 pt-20">
      <div className="bg-card-app border border-border-app rounded-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[70vh]">
        
        {/* Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-app/40 bg-bg-app/40">
          <Search className="w-4 h-4 text-text-secondary" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, commands..."
            className="flex-1 bg-transparent text-xs text-text-primary outline-none placeholder-text-secondary font-mono"
          />
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-hover-app text-text-secondary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          
          {/* Spotlight matches */}
          {query.trim() !== '' && searchResults.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-text-secondary uppercase px-2">Matches</span>
              <div className="space-y-1">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    onClick={res.action}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-hover-app transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-text-primary block truncate">{res.title}</span>
                      <span className="text-[10px] text-text-secondary font-mono block mt-0.5">{res.type} {res.category ? `• ${res.category}` : ""}</span>
                    </div>
                    <ChevronRightIcon className="w-3.5 h-3.5 text-text-secondary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Commands palette */}
          {filteredCommands.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono text-text-secondary uppercase px-2">Commands</span>
              <div className="space-y-0.5">
                {filteredCommands.map((com, i) => (
                  <button
                    key={i}
                    onClick={com.action}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-hover-app transition-colors flex items-center justify-between text-xs cursor-pointer font-mono"
                  >
                    <div>
                      <span className="font-bold text-text-primary block">{com.name}</span>
                      <span className="text-[10px] text-text-secondary block mt-0.5">{com.desc}</span>
                    </div>
                    <Command className="w-3.5 h-3.5 text-text-secondary" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() !== '' && searchResults.length === 0 && filteredCommands.length === 0 && (
            <div className="py-8 text-center text-xs text-text-secondary font-mono">
              No matching commands or database items found.
            </div>
          )}

        </div>

        {/* Footer shortcuts hint */}
        <div className="bg-bg-app/40 border-t border-border-app/40 px-4 py-2 flex items-center justify-between text-[10px] text-text-secondary font-mono">
          <span>esc to close</span>
          <span>enter to select</span>
        </div>

      </div>
    </div>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
