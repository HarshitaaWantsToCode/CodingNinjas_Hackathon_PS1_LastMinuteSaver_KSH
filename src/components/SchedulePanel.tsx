/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  CalendarCheck,
  CheckCircle
} from 'lucide-react';
import { Goal, Task, Scenario } from '../types';

interface SchedulePanelProps {
  goal: Goal;
  onToggleTask: (taskId: string) => void;
  onPlanRecover: (goal: Goal, availableHoursRemaining: number) => Promise<void>;
  onAddTask: (goalId: string, title: string, scheduledDate: string, estimatedHours: number, priority: 'high'|'medium'|'low', isCritical: boolean) => void;
  onDeleteGoal: (goalId: string) => void;
  isRecovering: boolean;
  currentDate: string; // YYYY-MM-DD
  onTriggerPanic?: (goal: Goal) => void;
  isPanicMode?: boolean;
}

export default function SchedulePanel({ 
  goal, 
  onToggleTask, 
  onPlanRecover, 
  onAddTask,
  onDeleteGoal,
  isRecovering, 
  currentDate,
  onTriggerPanic,
  isPanicMode
}: SchedulePanelProps) {
  const [revisedHours, setRevisedHours] = useState<number>(goal.availableHours);
  const [showRecoveryDeck, setShowRecoveryDeck] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // AI Triage states
  const [isGeneratingAiTriage, setIsGeneratingAiTriage] = useState(false);
  const [aiTriagePlan, setAiTriagePlan] = useState<any>(null);

  // Google Calendar Sync states
  const [isSyncingGCal, setIsSyncingGCal] = useState(false);
  const [gcalLogs, setGcalLogs] = useState<string[]>([]);
  const [gcalConfirmation, setGcalConfirmation] = useState<string | null>(null);

  const handleGenerateAiTriagePlan = async () => {
    setIsGeneratingAiTriage(true);
    setAiTriagePlan(null);
    try {
      const res = await fetch("/api/plan/triage-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          currentDateString: currentDate
        })
      });
      if (!res.ok) throw new Error("Triage Deck API returned error status.");
      const data = await res.json();
      setAiTriagePlan(data);
    } catch (err: any) {
      console.error(err);
      alert("Failed to generate AI recovery plan. Make sure server is running and Gemini is configured.");
    } finally {
      setIsGeneratingAiTriage(false);
    }
  };

  const handleApplyAiTriagePlan = async () => {
    if (!aiTriagePlan || !aiTriagePlan.steps) return;
    const totalHoursProposed = aiTriagePlan.steps.reduce((sum: number, step: any) => sum + (step.hours || 1.5), 0);
    try {
      await onPlanRecover(goal, totalHoursProposed);
      setShowRecoveryDeck(false);
      setAiTriagePlan(null);
    } catch (err: any) {
      setRecoveryError(err.message || "Failed to apply AI Triage plan.");
    }
  };

  const handleSyncToGCal = async () => {
    setIsSyncingGCal(true);
    setGcalConfirmation(null);
    setGcalLogs([
      "[API] Connecting to Google Calendar API...",
      "[API] Authenticating calendar session node...",
      "[API] Fetching event slots..."
    ]);

    const incomplete = goal.tasks.filter(t => !t.completed);
    if (incomplete.length === 0) {
      setGcalLogs(p => [...p, "[API] No tasks remaining to schedule."]);
      setIsSyncingGCal(false);
      return;
    }

    try {
      const res = await fetch("/api/plan/gcal-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: incomplete,
          currentDateString: currentDate
        })
      });

      if (!res.ok) throw new Error("Calendar sync API failed.");
      const data = await res.json();

      // Output logs sequentially for animation feel
      if (data.toolCalls && data.toolCalls.length > 0) {
        data.toolCalls.forEach((call: any, idx: number) => {
          setTimeout(() => {
            setGcalLogs(p => [
              ...p,
              `[Tool Call] Calendar.createEvent({ summary: "${call.summary}", start: "${call.start}", end: "${call.end}" })`
            ]);
          }, 300 * (idx + 1));
        });

        setTimeout(() => {
          setGcalLogs(p => [...p, "[API] Event synchronization finalized.", "✓ Google Calendar update complete."]);
          setGcalConfirmation(data.confirmation || "Study events synced successfully.");
          setIsSyncingGCal(false);
        }, 300 * (data.toolCalls.length + 1.5));
      } else {
        setGcalLogs(p => [...p, "[API] Calendar sync complete (0 tasks modified)."]);
        setIsSyncingGCal(false);
      }
    } catch (err) {
      setGcalLogs(p => [...p, "[Error] Failed to connect to calendar server."]);
      setIsSyncingGCal(false);
    }
  };

  // What-if Simulator scenarios
  const defaultScenarios: Scenario[] = [
    { name: "Skip Today's Work", outcome: "Pushes training to tomorrow, forcing a 7h crunch block.", riskImpact: "Critical Drift (+40% Risk)", delayDebt: 3.5 },
    { name: "Scope Reduction", outcome: "Skips advanced plots. Cuts 3 hours of effort, but drops maximum paper grade potential by 15%.", riskImpact: "Stable (-10% Risk)", delayDebt: -3 },
    { name: "Crunch Mode", outcome: "Consolidates sleep intervals to execute double-load tomorrow. Retains full features.", riskImpact: "High Stress (+5% Risk)", delayDebt: 0 }
  ];

  const activeScenarios = goal.scenarios && goal.scenarios.length > 0 ? goal.scenarios : defaultScenarios;
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number>(0);
  const activeScenario = activeScenarios[selectedScenarioIdx];

  // Quick insert task
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customHours, setCustomHours] = useState(1.5);
  const [customDate, setCustomDate] = useState(goal.deadline);
  const [customPriority, setCustomPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [customIsCritical, setCustomIsCritical] = useState(false);



  // Group tasks by date
  const groupedTasks: { [date: string]: Task[] } = {};
  goal.tasks.forEach(t => {
    if (!groupedTasks[t.scheduledDate]) {
      groupedTasks[t.scheduledDate] = [];
    }
    groupedTasks[t.scheduledDate].push(t);
  });

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const overdueTasksCount = goal.tasks.filter(t => 
    !t.completed && new Date(t.scheduledDate) < new Date(currentDate)
  ).length;

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    if (revisedHours <= 0) {
      setRecoveryError('Please declare a valid bandwidth limit.');
      return;
    }
    try {
      await onPlanRecover(goal, revisedHours);
      setShowRecoveryDeck(false);
    } catch (err: any) {
      setRecoveryError(err.message || 'Triage mutation failed.');
    }
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onAddTask(
      goal.id, 
      customTitle.trim(), 
      customDate || currentDate, 
      customHours, 
      customPriority, 
      customIsCritical
    );
    setCustomTitle('');
    setShowAddTaskForm(false);
  };



  return (
    <div className="space-y-10" id={`schedule-panel-${goal.id}`}>
      
      {/* Header Panel (Typography focused) */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-border-app/40">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-mono text-text-secondary uppercase">
              {goal.category}
            </span>
            {overdueTasksCount > 0 && (
              <span className="text-[#FF5A6C] text-[10px] font-mono font-bold uppercase">
                ● {overdueTasksCount} overdue
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-text-primary mt-2">{goal.title}</h1>
          <p className="text-xs text-text-secondary mt-1.5 flex gap-4 font-mono">
            <span>Deadline: {goal.deadline}</span>
            <span>Budget: {goal.availableHours}h</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 pt-1">
          <button
            onClick={() => {
              if (onTriggerPanic) onTriggerPanic(goal);
            }}
            className="px-3.5 py-2 text-xs font-mono font-bold bg-[#FF5A6C]/10 hover:bg-[#FF5A6C]/20 text-[#FF5A6C] rounded-lg cursor-pointer transition-all"
          >
            I messed up
          </button>

          <button
            onClick={() => setShowRecoveryDeck(!showRecoveryDeck)}
            className="px-3.5 py-2 text-xs font-mono bg-card-app text-text-primary border border-border-app hover:bg-hover-app rounded-lg cursor-pointer transition-all"
          >
            Triage deck
          </button>

          <button
            onClick={handleSyncToGCal}
            disabled={isSyncingGCal}
            className="px-3.5 py-2 text-xs font-mono bg-card-app text-text-primary border border-border-app hover:bg-hover-app rounded-lg cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            {isSyncingGCal ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-app" />
            ) : (
              <CalendarCheck className="w-3.5 h-3.5 text-accent-app" />
            )}
            <span>Sync Calendar</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Delete pipeline?")) {
                onDeleteGoal(goal.id);
              }
            }}
            className="p-2 border border-border-app bg-card-app text-text-secondary hover:text-[#FF5A6C] hover:bg-[#FF5A6C]/10 rounded-lg transition-colors cursor-pointer"
            title="Delete pipeline"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Triage Deck Panel */}
      {showRecoveryDeck && (
        <form onSubmit={handleRecoverySubmit} className="bg-card-app border border-border-app p-4 rounded-xl space-y-4 animate-page-slide">
          <div className="text-xs font-bold text-text-primary font-mono">Triage Bandwidth Limits</div>
          <p className="text-[10px] text-text-secondary leading-relaxed font-mono">
            Re-allocate study availability below. The OhNo AI engine will automatically adjust task budgets and distribute workloads.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                max="100"
                value={revisedHours}
                onChange={(e) => setRevisedHours(parseInt(e.target.value) || revisedHours)}
                className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg pl-3 pr-8 py-2 text-xs text-text-primary outline-none font-mono"
              />
              <span className="absolute right-3 top-2 text-[10px] text-text-secondary font-mono font-bold">h</span>
            </div>
            <button
              type="submit"
              disabled={isRecovering}
              className="px-4 py-2 text-xs font-mono font-bold bg-text-primary text-bg-app rounded-lg cursor-pointer transition-all disabled:opacity-40"
            >
              {isRecovering ? "Mutating..." : "Apply Triage"}
            </button>
          </div>
          {recoveryError && (
            <div className="text-[10px] text-danger-app font-mono">{recoveryError}</div>
          )}

          {/* AI generated plan steps */}
          <div className="space-y-3 border-t border-border-app/20 pt-3">
            <button
              type="button"
              onClick={handleGenerateAiTriagePlan}
              disabled={isGeneratingAiTriage}
              className="w-full py-2 bg-accent-app/10 hover:bg-accent-app/20 text-accent-app border border-accent-app/20 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
            >
              {isGeneratingAiTriage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Consulting OhNo Triage Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-accent-app" />
                  <span>Generate AI Recovery Steps</span>
                </>
              )}
            </button>

            {aiTriagePlan && (
              <div className="p-4 bg-bg-app border border-border-app rounded-xl space-y-3.5 animate-page-slide">
                <div className="text-[10px] font-mono text-accent-app font-bold uppercase tracking-wider">// AI Triage Recommendations</div>
                <p className="text-xs text-text-primary italic leading-relaxed">
                  "{aiTriagePlan.message}"
                </p>
                <div className="space-y-2.5 pt-1">
                  {aiTriagePlan.steps?.map((step: any, idx: number) => (
                    <div key={idx} className="text-xs font-mono flex items-start gap-3 border-b border-border-app/10 pb-2 last:border-0 last:pb-0">
                      <span className="w-5 h-5 rounded-full bg-border-app/50 text-text-secondary flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</span>
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-text-primary font-bold block truncate">{step.title}</span>
                        <span className="text-[10px] text-text-secondary block">{step.notes}</span>
                      </div>
                      <span className="text-accent-app shrink-0 ml-auto font-bold">{step.hours}h</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleApplyAiTriagePlan}
                  className="w-full py-2 bg-success-app text-black rounded-lg text-xs font-mono font-bold transition-all hover:opacity-90 cursor-pointer"
                >
                  Apply AI Triage Recommendations
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Google Calendar Sync Terminal Console */}
      {(isSyncingGCal || gcalLogs.length > 0) && (
        <div className="bg-[#18191D] border border-border-app p-4 rounded-xl space-y-3 font-mono animate-page-slide" id="gcal-sync-terminal">
          <div className="flex justify-between items-center border-b border-border-app/40 pb-2">
            <span className="text-[9px] text-accent-app font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" /> Calendar Integration Engine
            </span>
            {gcalConfirmation && (
              <button
                onClick={() => {
                  setGcalLogs([]);
                  setGcalConfirmation(null);
                }}
                className="text-text-secondary hover:text-text-primary text-[10px] cursor-pointer"
              >
                Clear logs
              </button>
            )}
          </div>
          <div className="bg-bg-app/50 border border-border-app/30 p-3 rounded-lg text-left text-[9px] text-text-secondary h-28 overflow-y-auto space-y-1.5">
            {gcalLogs.map((log, idx) => (
              <div key={idx} className={log.startsWith("[Error]") ? "text-[#FF5A6C]" : log.startsWith("[Tool") ? "text-accent-app font-bold" : "text-text-secondary"}>
                {log}
              </div>
            ))}
          </div>
          {gcalConfirmation && (
            <div className="p-3 bg-success-app/5 border border-success-app/20 rounded-lg text-[10px] text-success-app animate-fade-in flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-success-app animate-ping shrink-0" />
              <span>{gcalConfirmation}</span>
            </div>
          )}
        </div>
      )}

      {/* Best vs. Worst Case Scenario Matrix */}
      <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4" id="what-if-simulator">
        <div>
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Scenario Telemetry & Insights</h3>
          <p className="text-[10px] text-text-secondary mt-0.5 font-mono">// Comparison vectors for agenda compliance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Best Case */}
          <div className="bg-success-app/5 border border-success-app/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-success-app uppercase font-mono">
              <span>🌟 Best Case (On Schedule)</span>
            </div>
            <p className="text-xs text-text-primary leading-relaxed font-mono">
              Complete remaining study blocks on schedule. Success likelihood stays at <strong className="text-success-app">{Math.min(100, Math.max(10, 100 - (goal.driftProbability || 35)))}%</strong>. Timeline drifts by 0h.
            </p>
            <div className="text-[10px] text-success-app font-semibold italic font-mono pt-1">
              "You can do this! Stay focused and execute today's target slots."
            </div>
          </div>

          {/* Worst Case */}
          <div className="bg-[#FF5A6C]/5 border border-[#FF5A6C]/15 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF5A6C] uppercase font-mono">
              <span>⚠️ Worst Case (Skip Today)</span>
            </div>
            <p className="text-xs text-text-primary leading-relaxed font-mono">
              Skip today's study slots. Success slides to <strong className="text-[#FF5A6C]">{Math.max(5, Math.round((Math.min(100, Math.max(10, 100 - (goal.driftProbability || 35)))) * 0.4))}%</strong>. Triggers a +{goal.availableHours > 0 ? (goal.availableHours / 3).toFixed(1) : 3}h crunch delay debt tomorrow.
            </p>
            <div className="text-[10px] text-[#FF5A6C] font-semibold italic font-mono pt-1">
              "OhNo is ready to recover. If you drift, we'll re-calculate slots instantly!"
            </div>
          </div>
        </div>

        {/* Reassuring Coaching Banner */}
        <div className="p-3.5 bg-accent-app/5 border border-accent-app/20 rounded-xl text-xs font-mono flex items-center justify-between gap-3 text-text-primary">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-app shrink-0 animate-pulse" />
            <span>
              <strong>Coaching Directive:</strong> Your daily commitment budget is sufficient. Take one step at a time! You've got this.
            </span>
          </div>
        </div>
      </div>

      {/* Recovery message brief */}
      {goal.recoveryMessage && (
        <div className="p-4 bg-danger-app/5 border border-danger-app/10 rounded-xl text-xs space-y-1 animate-fade-in" id="recovery-briefcase">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#FF5A6C] font-semibold uppercase">
            <span>Recovery directive</span>
            {goal.lastRecoveredAt && <span>RE-CALIBRATED: {goal.lastRecoveredAt}</span>}
          </div>
          <p className="text-text-primary italic mt-1">"{goal.recoveryMessage}"</p>
        </div>
      )}

      {/* Timeline List (Continuous Thread) */}
      <div className="space-y-6 pt-4" id="flight-schedule-days">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h3 className="text-xs font-bold text-text-primary">Pipeline agenda</h3>
            <p className="text-[10px] text-text-secondary font-mono mt-0.5">// Tasks automatically recalibrate success parameters when checked.</p>
          </div>
          <button
            onClick={() => {
              setCustomDate(goal.deadline);
              setShowAddTaskForm(!showAddTaskForm);
            }}
            className="px-2.5 py-1 text-[10px] font-mono bg-card-app hover:bg-hover-app text-text-primary border border-border-app rounded-md flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add action</span>
          </button>
        </div>

        {/* Quick Add form inline */}
        {showAddTaskForm && (
          <form onSubmit={handleAddCustomTask} className="bg-card-app border border-border-app p-4 rounded-xl space-y-4" id="quick-add-task-form">
            <div className="text-xs font-bold text-text-primary font-mono">Add manual task</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg px-3 py-2 text-xs text-text-primary outline-none"
                  required
                />
              </div>
              <div>
                <input
                  type="date"
                  value={customDate}
                  min={currentDate}
                  max={goal.deadline}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg px-3 py-2 text-xs text-text-primary outline-none font-mono"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-text-secondary font-mono">
                  <span>Hours:</span>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.5"
                    value={customHours}
                    onChange={(e) => setCustomHours(parseFloat(e.target.value) || 1)}
                    className="w-14 bg-bg-app border border-border-app rounded-lg px-1.5 py-0.5 text-xs text-text-primary outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary font-mono">
                  <span>Priority:</span>
                  <select
                    value={customPriority}
                    onChange={(e: any) => setCustomPriority(e.target.value)}
                    className="bg-bg-app border border-border-app rounded-lg px-1.5 py-0.5 text-xs text-text-primary outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs text-text-secondary font-mono select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customIsCritical}
                    onChange={(e) => setCustomIsCritical(e.target.checked)}
                    className="rounded text-text-primary focus:ring-transparent h-4 w-4"
                  />
                  <span>Critical Gate</span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-[10px] font-mono bg-text-primary text-bg-app font-bold rounded-lg cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTaskForm(false)}
                  className="px-3.5 py-1.5 text-[10px] font-mono bg-bg-app border border-border-app text-text-primary rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {sortedDates.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-secondary font-mono">// Agenda empty.</div>
        ) : (
          /* Continuous vertical timeline line thread */
          <div className="relative border-l border-border-app/40 ml-3 pl-6 space-y-8 py-3">
            {sortedDates.map((dateString) => {
              const dateTasks = groupedTasks[dateString];
              const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              });

              const dailyTotalHours = dateTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
              const isToday = dateString === currentDate;
              const isOverdue = new Date(dateString) < new Date(currentDate) && dateTasks.some(t => !t.completed);

              return (
                <div key={dateString} id={`timeline-day-${dateString}`} className="relative space-y-3">
                  
                  {/* Timeline indicator node */}
                  <div className={`absolute -left-[30px] top-1.5 w-2 h-2 rounded-full border transition-all ${
                    isToday ? 'bg-text-primary border-text-primary scale-125' :
                    isOverdue ? 'bg-[#FF5A6C] border-[#FF5A6C]' : 'bg-bg-app border-border-app/80'
                  }`} />

                  {/* Day Subhead */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-text-primary font-mono">{formattedDate}</span>
                      {isToday && <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">// active day</span>}
                      {isOverdue && <span className="text-[9px] font-mono text-[#FF5A6C] uppercase tracking-wider">// drift warning</span>}
                    </div>
                    <span className="text-[10px] text-text-secondary font-mono">{dailyTotalHours.toFixed(1)}h load</span>
                  </div>

                  {/* Tasks list */}
                  <div className="space-y-1.5 pl-1">
                    {dateTasks.map(task => (
                      <div 
                        key={task.id} 
                        id={`task-item-${task.id}`}
                        className={`group py-1.5 flex items-start justify-between hover:bg-hover-app/30 rounded px-2 -ml-2 transition-all ${
                          task.completed ? 'opacity-35' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            id={`task-toggle-btn-${task.id}`}
                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
                              task.completed
                                ? 'bg-success-app border-success-app text-black font-bold'
                                : 'border-border-app hover:border-text-primary hover:bg-hover-app text-transparent'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>

                          <div className="min-w-0 pr-2 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              {task.isCritical && (
                                <span className="text-[8px] font-mono font-bold text-[#FF5A6C]">
                                  *GATING
                                </span>
                              )}
                              {task.energyLoad === 'high' && (
                                <span className="text-[8px] font-mono font-bold text-text-secondary">
                                  [high focus]
                                </span>
                              )}
                              <span className={`text-xs font-medium ${
                                task.completed ? 'text-text-secondary line-through' : 'text-text-primary'
                              }`}>
                                {task.title}
                              </span>
                            </div>
                            {task.notes && (
                              <p className="text-[10px] text-text-secondary italic">
                                // {task.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 font-mono text-[10px]">
                          <span className={`uppercase font-semibold ${
                            task.priority === 'high' ? 'text-[#FF5A6C]' :
                            task.priority === 'medium' ? 'text-[#F6C344]' : 'text-text-secondary'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-text-secondary font-mono">{task.estimatedHours}h</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
