/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Clock, AlertTriangle, Play, Brain, RefreshCw, X, ArrowLeft, Layers, GitBranch, Heart, CheckCircle } from 'lucide-react';
import { Goal, Task, Scenario } from '../types';

interface ProjectWorkspaceProps {
  goal: Goal;
  currentDate: string;
  onToggleTask: (taskId: string) => void;
  onPlanRecover: (goal: Goal, availableHoursRemaining: number) => Promise<void>;
  onTriggerPanic: () => void;
  onClose: () => void;
  isPanicMode?: boolean;
}

export default function ProjectWorkspace({
  goal,
  currentDate,
  onToggleTask,
  onPlanRecover,
  onTriggerPanic,
  onClose,
  isPanicMode
}: ProjectWorkspaceProps) {
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'timeline' | 'dependencies' | 'risk'>('overview');
  const [revisedHours, setRevisedHours] = useState(goal.availableHours);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Group tasks by scheduled date
  const groupedTasks: { [date: string]: Task[] } = {};
  goal.tasks.forEach(t => {
    if (!groupedTasks[t.scheduledDate]) {
      groupedTasks[t.scheduledDate] = [];
    }
    groupedTasks[t.scheduledDate].push(t);
  });

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // What-if simulator
  const defaultScenarios: Scenario[] = [
    { name: "Skip Today's Work", outcome: "Pushes training to tomorrow, forcing a 7h crunch block.", riskImpact: "Critical Drift (+40% Risk)", delayDebt: 3.5 },
    { name: "Scope Reduction", outcome: "Skips advanced plots. Cuts 3 hours of effort, but drops maximum grade potential by 15%.", riskImpact: "Stable (-10% Risk)", delayDebt: -3 },
    { name: "Crunch Mode", outcome: "Consolidates sleep intervals to execute double-load tomorrow. Retains full features.", riskImpact: "High Stress (+5% Risk)", delayDebt: 0 }
  ];

  const activeScenarios = goal.scenarios && goal.scenarios.length > 0 ? goal.scenarios : defaultScenarios;
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const activeScenario = activeScenarios[selectedScenarioIdx];

  // Tasks counts
  const incompleteTasks = goal.tasks.filter(t => !t.completed);
  const successProbability = 100 - (goal.driftProbability || 15);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRescheduling(true);
    try {
      await onPlanRecover(goal, revisedHours);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className={`space-y-8 animate-page-slide ${isPanicMode ? 'border-l-4 border-danger-app pl-4' : ''}`} id="project-workspace-container">
      
      {/* Top Header Back Bar */}
      <div className="flex items-center justify-between border-b border-border-app pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-border-app hover:bg-hover-app text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[9px] font-mono text-text-secondary uppercase">Project IMMERSIVE Workspace</span>
            <h2 className="text-sm font-bold text-text-primary mt-0.5">{goal.title}</h2>
          </div>
        </div>

        {/* Workspace Tab Selectors */}
        <div className="flex gap-1.5 bg-card-app/60 border border-border-app p-1 rounded-lg font-mono text-[9px]">
          {(['overview', 'timeline', 'dependencies', 'risk'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setWorkspaceTab(tab)}
              className={`px-3 py-1.5 uppercase rounded-md transition-all cursor-pointer ${
                workspaceTab === tab ? 'bg-text-primary text-bg-app font-bold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Panic Overlay Alert */}
      {isPanicMode && (
        <div className="bg-danger-app/10 border border-danger-app/30 p-4 rounded-xl text-xs font-mono text-danger-app animate-pulse-slow">
          ⚠️ Gating deadlines compromise alert: Triage recoveries immediately in the Risk & Triage tab.
        </div>
      )}

      {/* Tab Contents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Tab 1: Project Overview */}
        {workspaceTab === 'overview' && (
          <div className="lg:col-span-12 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Recovery Coefficient Card */}
              <div className="bg-card-app border border-border-app p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-baseline text-xs font-mono">
                  <span className="text-text-secondary uppercase">Recovery Coefficient</span>
                  <span className="text-text-primary font-bold">{successProbability}%</span>
                </div>
                <div className="w-full bg-border-app/40 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      successProbability >= 70 ? 'bg-[#57E389]' :
                      successProbability >= 45 ? 'bg-[#F6C344]' : 'bg-[#FF5A6C]'
                    }`}
                    style={{ width: `${successProbability}%` }}
                  />
                </div>
                <p className="text-[10px] text-text-secondary font-mono leading-relaxed mt-2">
                  {goal.driftExplanation || "Timeline parameters stabilized under current scheduling limits."}
                </p>
              </div>

              {/* Peak periods */}
              <div className="bg-card-app border border-border-app p-5 rounded-xl space-y-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono block">Peak Focus Windows</span>
                <div className="flex flex-col gap-1.5">
                  {goal.focusWindows && goal.focusWindows.map((win, idx) => (
                    <span key={idx} className="text-[10px] font-mono bg-bg-app border border-border-app px-2.5 py-1 rounded text-text-primary">
                      ⚡ {win}
                    </span>
                  ))}
                </div>
              </div>

              {/* Consequence Index */}
              <div className="bg-card-app border border-border-app p-5 rounded-xl space-y-3">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono block">Academic Impact Index</span>
                <p className="text-xs text-text-secondary leading-relaxed italic">
                  "{goal.academicImpact || "Timeline deficits endanger course rubrics."}"
                </p>
              </div>

            </div>

            {/* AI Notes Details */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-accent-app" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary font-mono">AI Action Plan Brief</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed font-mono">
                {goal.aiAnalysis}
              </p>
            </div>

          </div>
        )}

        {/* Tab 2: Dependency Graph */}
        {workspaceTab === 'dependencies' && (
          <div className="lg:col-span-12 bg-card-app border border-border-app p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Sequence Dependency Node Graph</h3>
              <p className="text-[10px] text-text-secondary mt-0.5">Cascade pathways linking tasks. Dotted connections indicate warning drift nodes.</p>
            </div>

            <div className="relative h-48 border border-border-app/30 rounded-lg bg-bg-app/20 overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full p-4" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <marker id="arrow-ws" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#2A2D33" />
                  </marker>
                </defs>

                {/* Lines */}
                {goal.tasks.slice(0, 5).map((t, idx) => {
                  if (idx === goal.tasks.slice(0, 5).length - 1) return null;
                  const startX = 80 + idx * 140;
                  const endX = 80 + (idx + 1) * 140;
                  const startY = 60;
                  const endY = 60;

                  return (
                    <line 
                      key={idx} 
                      x1={startX} 
                      y1={startY} 
                      x2={endX} 
                      y2={endY} 
                      stroke={t.completed ? "#57E389" : "#FF5A6C"} 
                      strokeWidth="2" 
                      strokeDasharray={t.completed ? "none" : "3,3"}
                      markerEnd="url(#arrow-ws)"
                    />
                  );
                })}

                {/* Nodes */}
                {goal.tasks.slice(0, 5).map((t, idx) => {
                  const x = 80 + idx * 140;
                  const y = 60;

                  return (
                    <g key={t.id} className="group cursor-pointer">
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="14" 
                        fill={t.completed ? "#57E389" : t.isCritical ? "#FF5A6C" : "#18191D"} 
                        stroke={t.completed ? "none" : t.isCritical ? "#FF5A6C" : "#2A2D33"} 
                        strokeWidth="2.5"
                      />
                      <text 
                        x={x} 
                        y={y + 3} 
                        fill={t.completed ? "#0F1012" : "#9FA3A9"} 
                        fontSize="9" 
                        fontWeight="bold" 
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {idx + 1}
                      </text>
                      <text
                        x={x}
                        y={y + 28}
                        fill="#F5F5F5"
                        fontSize="8"
                        textAnchor="middle"
                        fontFamily="Outfit"
                        className="opacity-90 font-bold"
                      >
                        {t.title.length > 15 ? t.title.substring(0, 13) + '..' : t.title}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        {/* Tab 3: Timeline Execution */}
        {workspaceTab === 'timeline' && (
          <div className="lg:col-span-12 bg-card-app border border-border-app p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-app/40 pb-3">
              <h3 className="text-xs font-bold text-text-primary font-mono uppercase">Execution Schedule</h3>
              <span className="text-[10px] font-mono text-text-secondary">{incompleteTasks.length} incomplete tasks left</span>
            </div>

            <div className="relative border-l border-border-app/40 ml-3 pl-6 space-y-6 py-2">
              {sortedDates.map(dateString => {
                const dateTasks = groupedTasks[dateString];
                const isToday = dateString === currentDate;
                const formattedDate = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                });

                return (
                  <div key={dateString} className="relative space-y-2.5 animate-page-slide">
                    <div className={`absolute -left-[30px] top-1.5 w-2 h-2 rounded-full border transition-all ${
                      isToday ? 'bg-text-primary border-text-primary' : 'bg-bg-app border-border-app/80'
                    }`} />
                    
                    <div className="flex justify-between items-baseline text-xs font-mono">
                      <span className="font-bold text-text-primary">{formattedDate}</span>
                      {isToday && <span className="text-[9px] text-text-secondary uppercase">// active day</span>}
                    </div>

                    <div className="space-y-1.5 pl-1">
                      {dateTasks.map(task => (
                        <div 
                          key={task.id}
                          className={`py-2 flex items-start justify-between hover:bg-hover-app/30 rounded px-2 -ml-2 transition-all ${
                            task.completed ? 'opacity-35' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onToggleTask(task.id)}
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer mt-0.5 shrink-0 ${
                                task.completed
                                  ? 'bg-success-app border-success-app text-black'
                                  : 'border-border-app hover:border-text-primary hover:bg-hover-app text-transparent'
                              }`}
                              title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                            >
                              <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                {task.isCritical && (
                                  <span className="text-[8px] font-mono font-bold text-[#FF5A6C]">*GATING</span>
                                )}
                                <span className={`text-xs font-medium transition-all ${task.completed ? 'text-text-secondary line-through opacity-70' : 'text-text-primary'}`}>{task.title}</span>
                              </div>
                              {task.notes && <p className="text-[10px] text-text-secondary italic mt-0.5">// {task.notes}</p>}
                            </div>
                          </div>
                          <span className="text-[10px] text-text-secondary font-mono shrink-0">{task.estimatedHours}h</span>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Risk & Triage */}
        {workspaceTab === 'risk' && (
          <div className="lg:col-span-12 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* What-if Simulator */}
              <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">What-if Outcome Calculator</h3>
                <div className="space-y-4">
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {activeScenarios.map((sc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedScenarioIdx(i)}
                        className={`px-3 py-1.5 text-[10px] font-mono rounded-md border shrink-0 transition-all cursor-pointer ${
                          selectedScenarioIdx === i
                            ? 'bg-text-primary text-bg-app border-none font-bold'
                            : 'bg-bg-app text-text-secondary border-border-app hover:text-text-primary'
                        }`}
                      >
                        {sc.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed font-mono">
                    {activeScenario?.outcome}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-t border-border-app/25 pt-3">
                    <div>
                      <span className="text-text-secondary block">RISK LEVEL</span>
                      <span className="text-text-primary font-bold">{activeScenario?.riskImpact}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary block">DELAY DEBT</span>
                      <span className="text-text-primary font-bold">+{activeScenario?.delayDebt}h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Triage Bandwidth Control */}
              <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Recovery Actions & Triage</h3>
                <form onSubmit={handleRecover} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-text-secondary font-semibold">Remaining available bandwidth</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={revisedHours}
                        onChange={(e) => setRevisedHours(parseInt(e.target.value) || revisedHours)}
                        className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg pl-3 pr-8 py-2 text-xs text-text-primary outline-none transition-all font-mono"
                      />
                      <span className="absolute right-3 top-2 text-[10px] text-text-secondary font-mono">h</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isRescheduling}
                      className="flex-1 bg-text-primary text-bg-app py-2 text-xs font-mono font-bold rounded-lg cursor-pointer transition-all disabled:opacity-40"
                    >
                      {isRescheduling ? "Mutating..." : "Apply triage"}
                    </button>
                    <button
                      type="button"
                      onClick={onTriggerPanic}
                      className="px-4 py-2 text-xs font-mono bg-danger-app/10 hover:bg-danger-app/20 text-danger-app rounded-lg cursor-pointer transition-all"
                    >
                      Trigger Emergency Triage
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Priority 7: AI Timeline Explanation */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">AI Timeline Rescheduling Logic</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
                {/* Horizontal progress bar */}
                <div className="absolute top-4 left-10 right-10 h-0.5 bg-border-app/40 hidden md:block z-0" />
                
                <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 font-mono">
                  <div className="w-8 h-8 rounded-full bg-border-app/60 text-text-secondary flex items-center justify-center text-[10px] font-bold">1</div>
                  <span className="text-[10px] text-text-primary font-bold">Original</span>
                  <span className="text-[8px] text-text-secondary">Standard task load mapping</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 font-mono">
                  <div className="w-8 h-8 rounded-full bg-danger-app/30 border border-danger-app/40 text-danger-app flex items-center justify-center text-[10px] font-bold">2</div>
                  <span className="text-[10px] text-[#FF5A6C] font-bold">Conflict</span>
                  <span className="text-[8px] text-text-secondary">Overlapping exams and prep slots</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 font-mono">
                  <div className="w-8 h-8 rounded-full bg-warning-app/30 border border-warning-app/40 text-warning-app flex items-center justify-center text-[10px] font-bold">3</div>
                  <span className="text-[10px] text-warning-app font-bold">Simulation</span>
                  <span className="text-[8px] text-text-secondary">Running time debt scenarios</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 font-mono">
                  <div className="w-8 h-8 rounded-full bg-accent-app/30 border border-accent-app/40 text-accent-app flex items-center justify-center text-[10px] font-bold">4</div>
                  <span className="text-[10px] text-accent-app font-bold">Proposal</span>
                  <span className="text-[8px] text-text-secondary">Prune ML network parameters</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-1.5 font-mono">
                  <div className="w-8 h-8 rounded-full bg-success-app/30 border border-success-app/40 text-success-app flex items-center justify-center text-[10px] font-bold">5</div>
                  <span className="text-[10px] text-success-app font-bold">Outcome</span>
                  <span className="text-[8px] text-text-secondary">+18% stress relief & stabilized timeline</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
