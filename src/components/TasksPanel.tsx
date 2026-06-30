import React, { useState } from 'react';
import { Goal, Task } from '../types';
import { CheckCircle, Search, Calendar, Tag, Inbox } from 'lucide-react';

interface TasksPanelProps {
  goals: Goal[];
  currentDate: string;
  onToggleTask: (taskId: string) => void;
}

export default function TasksPanel({ goals, currentDate, onToggleTask }: TasksPanelProps) {
  const [groupBy, setGroupBy] = useState<'date' | 'project'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all tasks and attach project title and goal information
  const allTasks = goals.flatMap(g => 
    (g.tasks || []).map(t => ({
      ...t,
      projectTitle: g.title,
      projectCategory: g.category,
      projectDeadline: g.deadline
    }))
  );

  // Filter tasks by query
  const filteredTasks = allTasks.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.projectTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Date Parsing Helpers
  const parseDate = (dStr: string) => new Date(dStr + 'T00:00:00');
  const today = parseDate(currentDate);

  // Groups
  const overdueTasks = filteredTasks.filter(t => !t.completed && parseDate(t.scheduledDate) < today);
  const todayTasks = filteredTasks.filter(t => t.scheduledDate === currentDate);
  const upcomingTasks = filteredTasks.filter(t => parseDate(t.scheduledDate) > today);
  const completedTasks = filteredTasks.filter(t => t.completed);

  return (
    <div className="bg-card-app border border-border-app rounded-xl p-6 space-y-6 font-sans" id="tasks-panel">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-app/40 pb-4">
        <div>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">Master To-Do Pipeline</h2>
          <p className="text-[10px] text-text-secondary mt-0.5 font-mono">// Aggregate agenda view across all survive targets</p>
        </div>

        {/* Group By selector */}
        <div className="flex bg-bg-app border border-border-app rounded-lg p-0.5 shrink-0 self-start sm:self-auto font-mono text-[10px]">
          <button
            onClick={() => setGroupBy('date')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-bold ${
              groupBy === 'date' ? 'bg-card-app text-text-primary shadow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            By Timeline Date
          </button>
          <button
            onClick={() => setGroupBy('project')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer font-bold ${
              groupBy === 'project' ? 'bg-card-app text-text-primary shadow' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            By Survive Project
          </button>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter actions or project tags..."
          className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-text-primary outline-none transition-all font-mono"
        />
      </div>

      {allTasks.length === 0 ? (
        <div className="p-12 text-center text-xs text-text-secondary font-mono">
          <Inbox className="w-8 h-8 text-text-secondary/50 mx-auto mb-3 stroke-1" />
          // No active projects configured. Create or parse a schedule first.
        </div>
      ) : (
        <div className="space-y-6">
          {groupBy === 'date' ? (
            <>
              {/* Group: Overdue */}
              {overdueTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-[#FF5A6C] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A6C] animate-ping" />
                    ⚠️ Drift Warnings (Overdue)
                  </div>
                  <div className="space-y-1.5">
                    {overdueTasks.map(t => (
                      <TaskRow key={t.id} task={t} onToggle={onToggleTask} showDate />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Today */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono text-accent-app font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-app" />
                  ⚡ Scheduled Today ({todayTasks.filter(t => !t.completed).length} pending)
                </div>
                {todayTasks.length === 0 ? (
                  <p className="text-[10px] text-text-secondary font-mono italic pl-2 leading-relaxed">
                    // Cognitive buffer clear. No tasks scheduled today.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {todayTasks.map(t => (
                      <TaskRow key={t.id} task={t} onToggle={onToggleTask} />
                    ))}
                  </div>
                )}
              </div>

              {/* Group: Upcoming */}
              {upcomingTasks.filter(t => !t.completed).length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-text-secondary font-bold uppercase tracking-wider">
                    📅 Upcoming Timeline Agenda
                  </div>
                  <div className="space-y-1.5">
                    {upcomingTasks.filter(t => !t.completed).map(t => (
                      <TaskRow key={t.id} task={t} onToggle={onToggleTask} showDate />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Completed */}
              {completedTasks.length > 0 && (
                <div className="space-y-2 border-t border-border-app/20 pt-4">
                  <div className="text-[10px] font-mono text-text-secondary font-bold uppercase tracking-wider">
                    ✓ Completed Actions ({completedTasks.length})
                  </div>
                  <div className="space-y-1.5 opacity-40">
                    {completedTasks.map(t => (
                      <TaskRow key={t.id} task={t} onToggle={onToggleTask} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Group by Project
            goals.map(g => {
              const projectTasks = filteredTasks.filter(t => t.goalId === g.id);
              if (projectTasks.length === 0) return null;

              return (
                <div key={g.id} className="space-y-2.5">
                  <div className="flex justify-between items-baseline border-b border-border-app/20 pb-1.5">
                    <span className="text-xs font-bold text-text-primary font-mono">{g.title}</span>
                    <span className="text-[9px] text-text-secondary font-mono">{g.deadline}</span>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    {projectTasks.map(t => (
                      <TaskRow key={t.id} task={t} onToggle={onToggleTask} showDate />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

interface TaskRowProps {
  key?: any;
  task: any;
  onToggle: (id: string) => void;
  showDate?: boolean;
}

function TaskRow({ task, onToggle, showDate = false }: TaskRowProps) {
  const isOverdue = !task.completed && new Date(task.scheduledDate) < new Date();

  return (
    <div className={`group flex items-center justify-between p-3.5 bg-bg-app border border-border-app hover:border-text-primary/60 rounded-xl transition-all ${task.completed ? 'bg-bg-app/30' : ''}`}>
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        
        {/* Sleek Microsoft To Do Style Circular Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            task.completed
              ? 'bg-success-app border-success-app text-black font-bold'
              : 'border-border-app hover:border-text-primary hover:bg-hover-app text-transparent'
          }`}
          title={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="min-w-0 pr-2 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium transition-all ${
              task.completed ? 'text-text-secondary line-through opacity-70' : 'text-text-primary'
            }`}>
              {task.title}
            </span>
            {task.isCritical && (
              <span className="text-[8px] font-mono font-bold text-[#FF5A6C] px-1 bg-[#FF5A6C]/10 border border-[#FF5A6C]/25 rounded">
                *GATING
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-text-secondary font-mono leading-none">
            <span className="text-accent-app font-semibold">@{task.projectTitle}</span>
            {showDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-[#FF5A6C] font-bold' : ''}`}>
                <Calendar className="w-3 h-3 shrink-0" /> {task.scheduledDate}
              </span>
            )}
            {task.notes && <span className="italic truncate max-w-[180px]">// {task.notes}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 font-mono text-[9px]">
        <span className={`uppercase font-semibold px-1.5 py-0.5 rounded ${
          task.priority === 'high' ? 'bg-[#FF5A6C]/10 text-[#FF5A6C] border border-[#FF5A6C]/15' :
          task.priority === 'medium' ? 'bg-[#F6C344]/10 text-[#F6C344] border border-[#F6C344]/15' : 'bg-hover-app text-text-secondary border border-border-app'
        }`}>
          {task.priority}
        </span>
        <span className="text-text-secondary">{task.estimatedHours}h</span>
      </div>
    </div>
  );
}
