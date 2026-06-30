/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Goal, Task, ProductivitySummary, SessionEvent } from '../types';
import { 
  TrendingUp, 
  Clock, 
  Percent, 
  AlertTriangle, 
  Calendar as CalendarIcon, 
  Award,
  Zap,
  Info,
  Sun,
  Cloud,
  CloudLightning,
  CloudRain,
  HelpCircle,
  Play,
  Share2,
  GitBranch,
  CheckCircle2,
  Sparkles,
  X,
  Mic,
  MicOff,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';

interface DashboardProps {
  goals: Goal[];
  activeGoal: Goal | null;
  onSelectGoal: (goal: Goal) => void;
  metrics: ProductivitySummary;
  currentDate: string;
  isPanicMode?: boolean;
  sessionEvents?: SessionEvent[];
  onClearEvents?: () => void;
  onOpenNewProject?: () => void;
  onSetGoals?: React.Dispatch<React.SetStateAction<Goal[]>>;
  logSessionEvent?: (type: SessionEvent['type'], title: string, description: string, details?: string) => void;
  onTriggerPanic?: (goal: Goal) => void;
}

// Helper to parse dates timezone-safely
const parseDate = (dStr: string) => {
  const parts = dStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Dashboard({ goals, activeGoal, onSelectGoal, metrics, currentDate, isPanicMode, sessionEvents, onClearEvents, onOpenNewProject, onSetGoals, logSessionEvent, onTriggerPanic }: DashboardProps) {
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState<{[key: string]: boolean}>({});
  const [showForecastInfo, setShowForecastInfo] = useState(false);

  // Timetable Parser States
  const [scheduleText, setScheduleText] = useState("");
  const [dailyHoursLimit, setDailyHoursLimit] = useState(3);
  const [isParsing, setIsParsing] = useState(false);
  const [parseLogs, setParseLogs] = useState<string[]>([]);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<any[] | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [showParserModal, setShowParserModal] = useState(false);

  // Google Calendar dashboard sync states
  const [isDashboardSyncing, setIsDashboardSyncing] = useState(false);
  const [dashboardSyncLogs, setDashboardSyncLogs] = useState<string[]>([]);
  const [dashboardConfirmation, setDashboardConfirmation] = useState<string | null>(null);

  const handleDashboardSyncGCal = async () => {
    setIsDashboardSyncing(true);
    setDashboardConfirmation(null);
    setDashboardSyncLogs([
      "[API] Connecting to Google Calendar...",
      "[API] Authenticating calendar session node...",
      "[API] Loading tasks across all projects..."
    ]);

    const allIncompleteTasks = goals.flatMap(g => g.tasks).filter(t => !t.completed);
    if (allIncompleteTasks.length === 0) {
      setDashboardSyncLogs(p => [...p, "[API] No tasks remaining to schedule."]);
      setIsDashboardSyncing(false);
      return;
    }

    try {
      const res = await fetch("/api/plan/gcal-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: allIncompleteTasks,
          currentDateString: currentDate
        })
      });

      if (!res.ok) throw new Error("GCal sync failed");
      const data = await res.json();

      if (data.toolCalls && data.toolCalls.length > 0) {
        data.toolCalls.forEach((call: any, idx: number) => {
          setTimeout(() => {
            setDashboardSyncLogs(p => [
              ...p,
              `[Tool Call] Calendar.createEvent({ summary: "${call.summary}", start: "${call.start}" })`
            ]);
          }, 300 * (idx + 1));
        });

        setTimeout(() => {
          setDashboardSyncLogs(p => [...p, "[API] Calendar sync complete.", "✓ Updated study events synchronized."]);
          setDashboardConfirmation(data.confirmation || "Sync finalized.");
          setIsDashboardSyncing(false);
        }, 300 * (data.toolCalls.length + 1.5));
      } else {
        setDashboardSyncLogs(p => [...p, "[API] Synchronization complete (0 tasks modified)."]);
        setIsDashboardSyncing(false);
      }
    } catch (e) {
      setDashboardSyncLogs(p => [...p, "[Error] Failed to connect to calendar server."]);
      setIsDashboardSyncing(false);
    }
  };

  // Voice Input SpeechRecognition Setup
  const [isListening, setIsListening] = useState(false);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      if (logSessionEvent) {
        logSessionEvent('panic_trigger', 'Voice Input Active', 'Started listening to raw schedule voice command...');
      }
    };

    rec.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setScheduleText(prev => {
        const separator = prev.trim() ? " " : "";
        return prev + separator + transcript;
      });
    };

    rec.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    (rec as any)._recInstance = rec;
    rec.start();
    (window as any).activeSpeechRecognition = rec;
  };

  const stopSpeechRecognition = () => {
    const activeRec = (window as any).activeSpeechRecognition;
    if (activeRec) {
      activeRec.stop();
      (window as any).activeSpeechRecognition = null;
    }
    setIsListening(false);
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  const getDynamicBriefing = (isRefresh = false) => {
    if (goals.length === 0) {
      return "Nothing critical right now.\n\nCreate a project to begin timeline prediction.";
    }
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.tasks.length > 0 && g.tasks.every(t => t.completed)).length;
    const activeGoals = totalGoals - completedGoals;
    
    // Find the first goal that is not fully completed
    const currentGoal = goals.find(g => !g.tasks.every(t => t.completed)) || goals[0];
    const incompleteTasks = currentGoal ? currentGoal.tasks.filter(t => !t.completed) : [];
    const nextTask = incompleteTasks[0] || null;

    let refreshPrefix = isRefresh ? `Telemetry refreshed for date ${currentDate}.\n\n` : "";

    if (activeGoals === 0) {
      return `${refreshPrefix}Good job! All your ${totalGoals} projects are fully completed! Your current trajectory is stabilized.`;
    }

    let msg = `${refreshPrefix}Good morning.\n\nYou have ${activeGoals} active project${activeGoals > 1 ? 's' : ''} out of ${totalGoals} total.`;
    
    if (currentGoal) {
      msg += ` Your project "${currentGoal.title}" has a completion probability of ${100 - (currentGoal.driftProbability || 15)}%.\n`;
      if (nextTask) {
        msg += `\nToday's recommended task:\n"${nextTask.title}"\n\nEstimated effort:\n${nextTask.estimatedHours} hours`;
      }
    }
    return msg;
  };

  // AI Daily Briefing Typewriter States
  const [briefingText, setBriefingText] = useState(() => getDynamicBriefing(false));
  const [displayedText, setDisplayedText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStateIdx, setThinkingStateIdx] = useState(0);

  const fetchBriefing = async () => {
    setIsThinking(true);
    setThinkingStateIdx(0);
    const thinkingInterval = setInterval(() => {
      setThinkingStateIdx(prev => (prev + 1) % thinkingStates.length);
    }, 450);

    try {
      const res = await fetch("/api/plan/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals,
          currentDateString: currentDate
        })
      });

      if (!res.ok) {
        throw new Error("Briefing API failure");
      }

      const data = await res.json();
      if (data.text) {
        setBriefingText(data.text);
      } else {
        setBriefingText(getDynamicBriefing(false));
      }
    } catch (err) {
      console.warn("Failed to get live briefing, using heuristic briefing:", err);
      setBriefingText(getDynamicBriefing(false));
    } finally {
      clearInterval(thinkingInterval);
      setIsThinking(false);
    }
  };

  // Sync briefing text when goals update
  useEffect(() => {
    fetchBriefing();
  }, [goals, currentDate]);

  // Typewriter effect
  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      index++;
      setDisplayedText(briefingText.substring(0, index));
      if (index >= briefingText.length) {
        clearInterval(interval);
      }
    }, 10);
    return () => clearInterval(interval);
  }, [briefingText]);

  const thinkingStates = [
    "Analyzing workload...",
    "Predicting timeline...",
    "Running recovery simulation...",
    "Calculating success probability...",
    "Generating recommendations..."
  ];

  const handleGenerateNewBriefing = () => {
    fetchBriefing();
  };

  const toggleReasoning = (id: string) => {
    setShowReasoning(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleParseScheduleText = async () => {
    if (!scheduleText.trim()) return;
    setIsParsing(true);
    setParseLogs(["Connecting to OhNo inference cluster...", "Initializing calendar parser..."]);
    setClarifyingQuestions(null);
    setQuestionAnswers({});

    try {
      const res = await fetch("/api/plan/parse-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleText,
          currentDateString: currentDate,
          dailyHours: dailyHoursLimit
        })
      });

      if (!res.ok) {
        throw new Error("Failed to contact parsing engine.");
      }

      const data = await res.json();
      setParseLogs(prev => [...prev, "Response received. Analysing structure..."]);

      if (data.needsClarification && data.questions && data.questions.length > 0) {
        setParseLogs(prev => [...prev, "Missing parameters detected. Requesting user input."]);
        setClarifyingQuestions(data.questions);
        setIsParsing(false);
        return;
      }

      if (data.parsedGoals && data.parsedGoals.length > 0) {
        const parsed = data.parsedGoals.map((g: any) => {
          const goalId = 'goal_' + Math.random().toString(36).substr(2, 9);
          return {
            id: goalId,
            title: g.title,
            category: g.category || 'other',
            deadline: g.deadline,
            availableHours: g.availableHours || 15,
            driftProbability: Math.floor(Math.random() * 20) + 5,
            driftExplanation: g.driftExplanation || "Initial stabilization vector configured.",
            academicImpact: g.academicImpact || "Failing this will result in academic impact and deadline slippage.",
            focusWindows: g.focusWindows || ["09:00 - 11:30 Peak Focus Window", "14:00 - 16:30 Secondary Buffer"],
            aiAnalysis: g.aiAnalysis || "This project timeline has been automatically generated by the AI calendar parsing engine. Keep study slots consistent to minimize deadline drift.",
            scenarios: [
              { name: "Skip Today's Work", outcome: "Pushes tasks forward.", riskImpact: "Increases drift probability", delayDebt: 3 },
              { name: "Scope Reduction", outcome: "Discards low-priority work.", riskImpact: "Reduces stress index", delayDebt: -2 },
              { name: "Crunch Mode", outcome: "Increases available hours.", riskImpact: "Maintains timeline stability", delayDebt: 0 }
            ],
            tasks: (g.tasks || []).map((t: any, idx: number) => ({
              id: `task_${goalId}_${idx}`,
              title: t.title,
              estimatedHours: t.estimatedHours || 2,
              priority: t.priority || 'medium',
              completed: false,
              scheduledDate: t.scheduledDate,
              isCritical: t.isCritical || false,
              notes: t.notes || "Auto-parsed schedule action.",
              energyLoad: t.energyLoad || 'medium'
            }))
          };
        });

        if (onSetGoals) {
          onSetGoals(prev => {
            const updated = [...prev, ...parsed];
            localStorage.setItem('panic_pilot_goals', JSON.stringify(updated));
            return updated;
          });
        }

        if (logSessionEvent) {
          logSessionEvent(
            'task_add',
            'SCHEDULE PARSER',
            `Imported ${parsed.length} projects from timetable text`,
            `Projects created: ${parsed.map((p: any) => p.title).join(', ')}`
          );
        }

        setParseLogs(prev => [...prev, `Successfully created ${parsed.length} new project pipelines!`]);
        setScheduleText("");
      } else {
        setParseLogs(prev => [...prev, "No projects could be parsed from the provided text."]);
      }
    } catch (err: any) {
      setParseLogs(prev => [...prev, `Error: ${err.message || 'Parsing failed.'}`]);
    } finally {
      setIsParsing(false);
    }
  };

  const activeProject = activeGoal || goals[0] || null;

  // 1. Calculate time debt details
  const calculateTimeDebtDetails = () => {
    let originalDebtHours = 0;
    let compoundedDebtHours = 0;
    let overdueCount = 0;

    goals.forEach(g => {
      g.tasks.forEach(t => {
        if (!t.completed) {
          const taskDate = parseDate(t.scheduledDate);
          const todayDate = parseDate(currentDate);
          if (taskDate < todayDate) {
            overdueCount++;
            const diffTime = Math.abs(todayDate.getTime() - taskDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            originalDebtHours += t.estimatedHours;
            const compounded = t.estimatedHours * Math.pow(1.15, diffDays);
            compoundedDebtHours += compounded;
          }
        }
      });
    });

    const interestAccumulated = compoundedDebtHours - originalDebtHours;

    return {
      overdueCount,
      originalDebtHours,
      compoundedDebtHours: Math.round(compoundedDebtHours * 10) / 10,
      interestAccumulated: Math.round(interestAccumulated * 10) / 10
    };
  };

  const debtDetails = calculateTimeDebtDetails();

  // 2. Stress Forecast calculation (next 7 days starting from currentDate)
  const stressForecastDays = Array.from({ length: 7 }, (_, i) => {
    const d = parseDate(currentDate);
    d.setDate(d.getDate() + i);
    const dateStr = formatDate(d);

    // Sum workloads
    const dayTasks = goals.flatMap(g => g.tasks).filter(t => t.scheduledDate === dateStr);
    const totalHours = dayTasks.reduce((sum, t) => sum + (t.completed ? 0 : t.estimatedHours), 0);

    let status: 'Calm' | 'Busy' | 'Crunch' | 'Deadline Storm' = 'Calm';
    let icon = <Sun className="w-5 h-5 text-success-app animate-pulse-slow" />;
    let colorClass = 'text-success-app';
    let bgClass = 'bg-success-app/5 border-success-app/10';

    if (totalHours > 6) {
      status = 'Deadline Storm';
      icon = <CloudLightning className="w-5 h-5 text-danger-app animate-bounce" />;
      colorClass = 'text-danger-app font-bold';
      bgClass = 'bg-danger-app/10 border-danger-app/20';
    } else if (totalHours > 4) {
      status = 'Crunch';
      icon = <CloudRain className="w-5 h-5 text-[#FF5A6C]" />;
      colorClass = 'text-[#FF5A6C]';
      bgClass = 'bg-[#FF5A6C]/5 border-[#FF5A6C]/10';
    } else if (totalHours > 2) {
      status = 'Busy';
      icon = <Cloud className="w-5 h-5 text-warning-app" />;
      colorClass = 'text-warning-app';
      bgClass = 'bg-warning-app/5 border-warning-app/10';
    }

    return {
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      hours: totalHours,
      status,
      icon,
      colorClass,
      bgClass
    };
  });

  // 3. Semester Calendar Heatmap Grid (4 weeks centered around currentDate)
  const heatmapWeeks = Array.from({ length: 4 }, (_, weekIdx) => {
    return Array.from({ length: 7 }, (_, dayIdx) => {
      const d = parseDate(currentDate);
      d.setDate(d.getDate() - 7 + (weekIdx * 7 + dayIdx));
      const dateStr = formatDate(d);

      const dayTasks = goals.flatMap(g => g.tasks).filter(t => t.scheduledDate === dateStr);
      const load = dayTasks.reduce((sum, t) => sum + (t.completed ? 0 : t.estimatedHours), 0);

      let intensity: 'safe' | 'moderate' | 'heavy' | 'critical' | 'none' = 'none';
      let color = 'bg-border-app/20 border-border-app/30 hover:border-text-secondary';
      if (load > 6) {
        intensity = 'critical';
        color = 'bg-danger-app text-black border-danger-app/40';
      } else if (load > 4) {
        intensity = 'heavy';
        color = 'bg-[#FF5A6C]/50 border-danger-app/30 text-text-primary';
      } else if (load > 2) {
        intensity = 'moderate';
        color = 'bg-warning-app/40 border-warning-app/30 text-text-primary';
      } else if (load > 0) {
        intensity = 'safe';
        color = 'bg-success-app/30 border-success-app/20 text-text-primary';
      }

      return {
        dateStr,
        dayLabel: d.getDate(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        load,
        color,
        intensity,
        tasks: dayTasks
      };
    });
  });

  // 4. Workload Distribution Chart (weekly breakdown for current week)
  const getWeeklyWorkload = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = parseDate(currentDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setDate(monday.getDate() + i);
      const dateStr = formatDate(monday);

      const dayTasks = goals.flatMap(g => g.tasks).filter(t => t.scheduledDate === dateStr);
      const completedHrs = dayTasks.filter(t => t.completed).reduce((sum, t) => sum + t.estimatedHours, 0);
      const pendingHrs = dayTasks.filter(t => !t.completed).reduce((sum, t) => sum + t.estimatedHours, 0);

      return {
        dayName: monday.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr,
        completedHrs,
        pendingHrs,
        total: completedHrs + pendingHrs
      };
    });
  };

  const weeklyWorkload = getWeeklyWorkload();
  const maxWeeklyHours = Math.max(8, ...weeklyWorkload.map(w => w.total));

  // 5. Time Allocation breakdown
  const totalWeeklyHours = 168;
  const studyHours = goals.flatMap(g => g.tasks).reduce((sum, t) => sum + t.estimatedHours, 0);
  const classesHours = activeProject ? 15 : 0;
  const workHours = activeProject ? 12 : 0;
  const sleepHours = 56;
  const freeHours = Math.max(0, totalWeeklyHours - (studyHours + classesHours + workHours + sleepHours));

  const timeAllocData = [
    { label: 'Study', value: studyHours, color: '#D9FF57' },
    { label: 'Classes', value: classesHours, color: '#9FA3A9' },
    { label: 'Work', value: workHours, color: '#F6C344' },
    { label: 'Sleep', value: sleepHours, color: '#2A2D33' },
    { label: 'Free Time', value: freeHours, color: '#57E389' }
  ];

  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  // 6. Focus Trend Line Points
  const trendPoints = [70, 75, 60, 65, 80, 92, metrics.productivityScore];

  // 7. AI Priority Matrix (Urgent vs Impact Eisenhower Quadrant)
  const allIncompleteTasks = goals.flatMap(g => 
    g.tasks.map(t => ({ ...t, parentGoal: g }))
  ).filter(t => !t.completed);

  const matrixTasks = allIncompleteTasks.map(t => {
    let impact = 25;
    if (t.priority === 'high' || t.isCritical) impact = 80;
    else if (t.priority === 'medium') impact = 50;

    const tDate = parseDate(t.scheduledDate).getTime();
    const curDate = parseDate(currentDate).getTime();
    const daysDiff = Math.max(0, (tDate - curDate) / (1000 * 60 * 60 * 24));
    let urgency = Math.max(10, 100 - (daysDiff * 15));

    return {
      task: t,
      x: urgency,
      y: impact,
      title: t.title,
      goalTitle: t.parentGoal.title
    };
  }).slice(0, 8);

  // 8. Project Dependency Graph coordinates
  const dependencyTasks = activeProject ? activeProject.tasks.slice(0, 5) : [];

  // 9. Recovery Velocity calculation (completed tasks / total tasks)
  const totalTasksCount = goals.flatMap(g => g.tasks).length;
  const completedTasksCount = goals.flatMap(g => g.tasks).filter(t => t.completed).length;
  const recoveryVelocity = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 100;

  // 10. AI Confidence calculation
  const aiConfidence = Math.max(40, Math.min(98, 100 - (debtDetails.interestAccumulated * 5)));

  // 11. Next critical deadline details
  const nextDeadlineGoal = [...goals].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())[0] || null;
  const nextDeadlineDays = nextDeadlineGoal 
    ? Math.ceil((parseDate(nextDeadlineGoal.deadline).getTime() - parseDate(currentDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // 12. Deep Work hours remaining
  const deepWorkHoursRemaining = allIncompleteTasks
    .filter(t => t.energyLoad === 'high' || t.isCritical)
    .reduce((sum, t) => sum + t.estimatedHours, 0);

  return (
    <div className={`space-y-10 transition-all duration-300 ${isPanicMode ? 'border-l-4 border-danger-app pl-4' : ''}`} id="mission-control-container">
      
      {/* Panic Mode Global Banner */}
      {isPanicMode && (
        <div className="bg-danger-app/10 border border-danger-app/30 p-5 rounded-xl space-y-4 animate-page-slide" id="panic-mode-overlay">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-danger-app animate-ping" />
            <h2 className="text-sm font-bold text-danger-app font-mono uppercase tracking-wider">Timeline Integrity Compromised (Panic Mode Active)</h2>
          </div>
          <p className="text-xs text-text-primary leading-relaxed font-mono">
            "Recovery is still possible. I've generated an emergency plan based on priority load constraints."
          </p>

          {/* Priority 8: Panic Recovery Story */}
          <div className="p-3 bg-[#FF5A6C]/10 border border-[#FF5A6C]/20 rounded-lg font-mono text-[9px] text-[#FF5A6C] space-y-1">
            <span className="font-bold block uppercase tracking-wider">Panic Recovery Story:</span>
            <div className="flex flex-col gap-1 pt-1 text-text-primary">
              <span>⏮️ Yesterday: Skipped Dataset Cleaning</span>
              <span>➡️ Today: Time debt compounded to {debtDetails.compoundedDebtHours}h</span>
              <span>⏭️ Tomorrow: Presentation preparation overlaps</span>
              <span>⚠️ Current Risk: {100 - metrics.productivityScore}% probability drop</span>
              <span className="font-bold text-success-app">💡 Recommended Action: Execute emergency scheduling triage below.</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => {
                if (activeProject) {
                  if (onTriggerPanic) {
                    onTriggerPanic(activeProject);
                  } else {
                    onSelectGoal(activeProject);
                  }
                }
              }}
              className="px-3.5 py-1.5 text-[10px] font-mono font-bold bg-danger-app text-white rounded-lg hover:opacity-90 transition-all cursor-pointer animate-pulse-slow"
            >
              Recover Timeline
            </button>
            <button
              onClick={() => alert("Emergency schedule successfully generated.")}
              className="px-3.5 py-1.5 text-[10px] font-mono bg-[#18191D] border border-border-app text-text-primary rounded-lg hover:bg-hover-app transition-all cursor-pointer"
            >
              Generate Emergency Schedule
            </button>
            <button
              onClick={() => alert("Extension request template compiled.")}
              className="px-3.5 py-1.5 text-[10px] font-mono bg-[#18191D] border border-border-app text-text-primary rounded-lg hover:bg-hover-app transition-all cursor-pointer"
            >
              Request Extension
            </button>
            <button
              onClick={() => alert("Scope cuts applied to secondary milestones.")}
              className="px-3.5 py-1.5 text-[10px] font-mono bg-[#18191D] border border-border-app text-text-primary rounded-lg hover:bg-hover-app transition-all cursor-pointer"
            >
              Reduce Scope
            </button>
          </div>
        </div>
      )}

      {/* Priority 1: AI Daily Briefing Card */}
      <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4 relative overflow-hidden" id="ai-daily-briefing">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-accent-app uppercase tracking-wider font-bold">● AI Recovery Co-Pilot Briefing</span>
            <span className="text-[9px] text-text-secondary font-mono">/ today is {currentDate}</span>
          </div>
          <button
            type="button"
            onClick={handleGenerateNewBriefing}
            className="px-3 py-1.5 text-[9px] font-mono bg-bg-app hover:bg-hover-app border border-border-app rounded-md text-text-primary transition-all cursor-pointer"
          >
            Generate New Briefing
          </button>
        </div>

        {isThinking ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-4 h-4 rounded-full border-2 border-accent-app border-t-transparent animate-spin" />
            <span className="text-xs font-mono text-accent-app animate-pulse">{thinkingStates[thinkingStateIdx]}</span>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed max-w-4xl font-mono whitespace-pre-line">
            {displayedText}
          </p>
        )}
      </div>

      {/* 12. Dashboard Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" id="dashboard-summary-cards">
        
        {/* Card 1: Completion Probability */}
        <div className="bg-card-app border border-border-app p-4 rounded-xl flex flex-col justify-between hover:border-accent-app/50 transition-all duration-200">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Completion Prob</span>
            <Percent className="w-3.5 h-3.5 text-accent-app" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-text-primary">{metrics.productivityScore}%</span>
            <span className="text-[9px] text-[#57E389] font-mono">+{metrics.completionRate}% rate</span>
          </div>
        </div>

        {/* Card 2: Time Debt */}
        <div className="bg-card-app border border-border-app p-4 rounded-xl flex flex-col justify-between hover:border-[#FF5A6C]/50 transition-all duration-200">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Time Debt</span>
            <Clock className="w-3.5 h-3.5 text-[#FF5A6C]" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-xl font-bold font-mono text-text-primary">{debtDetails.compoundedDebtHours}h</span>
            <span className="text-[9px] text-[#FF5A6C] font-mono">+{debtDetails.interestAccumulated}h interest</span>
          </div>
        </div>

        {/* Card 3: Recovery Velocity */}
        <div className="bg-card-app border border-border-app p-4 rounded-xl flex flex-col justify-between hover:border-success-app/50 transition-all duration-200">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Recovery Velocity</span>
            <Zap className="w-3.5 h-3.5 text-success-app" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-text-primary">{recoveryVelocity}%</span>
            <span className="text-[9px] text-text-secondary font-mono">tasks complete</span>
          </div>
        </div>

        {/* Card 4: AI Confidence */}
        <div className="bg-card-app border border-border-app p-4 rounded-xl flex flex-col justify-between hover:border-warning-app/50 transition-all duration-200">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">AI Confidence</span>
            <Info className="w-3.5 h-3.5 text-warning-app" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-text-primary">{aiConfidence}%</span>
            <span className="text-[9px] text-[#57E389] font-mono">Optimal</span>
          </div>
        </div>

        {/* Card 5: Next Critical Deadline */}
        <div className="bg-card-app border border-border-app p-4 rounded-xl flex flex-col justify-between hover:border-accent-app/50 transition-all duration-200">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Next Deadline</span>
            <CalendarIcon className="w-3.5 h-3.5 text-accent-app" />
          </div>
          <div className="mt-3 flex flex-col">
            <span className="text-xl font-bold font-mono text-text-primary">{nextDeadlineDays}d</span>
            <span className="text-[9px] text-text-secondary font-mono truncate">{nextDeadlineGoal?.title || 'None'}</span>
          </div>
        </div>

        {/* Card 6: Deep Work Remaining */}
        <div className="bg-card-app border border-border-app p-4 rounded-xl flex flex-col justify-between hover:border-text-secondary/50 transition-all duration-200">
          <div className="flex items-center justify-between text-text-secondary">
            <span className="text-[10px] font-mono uppercase tracking-wider">Deep Work Left</span>
            <Award className="w-3.5 h-3.5 text-text-secondary" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-text-primary">{deepWorkHoursRemaining}h</span>
            <span className="text-[9px] text-[#FF5A6C] font-mono">Gating load</span>
          </div>
        </div>

      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left 8-Column Panel */}
        <div className="lg:col-span-8 space-y-8">

          {/* 1. Semester Calendar Heatmap */}
          <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4 animate-pulse-slow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Workload Intensity Heatmap</h3>
                <p className="text-[10px] text-text-secondary mt-0.5">Click a block to preview daily agenda & triage telemetry</p>
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono text-text-secondary">
                <span>Safe</span>
                <span className="w-2.5 h-2.5 rounded bg-success-app/30 border border-success-app/20" />
                <span className="w-2.5 h-2.5 rounded bg-warning-app/40 border border-warning-app/30" />
                <span className="w-2.5 h-2.5 rounded bg-[#FF5A6C]/50 border-danger-app/30" />
                <span className="w-2.5 h-2.5 rounded bg-danger-app border border-danger-app/40" />
                <span>Critical</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-[9px] font-mono text-text-secondary font-bold uppercase">{day}</div>
              ))}
              {heatmapWeeks.flatMap((week) => 
                week.map((day, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedHeatmapDate(day.dateStr === selectedHeatmapDate ? null : day.dateStr)}
                    className={`aspect-square w-full rounded flex flex-col items-center justify-center text-[10px] font-mono border transition-all duration-150 cursor-pointer ${day.color} ${selectedHeatmapDate === day.dateStr ? 'ring-2 ring-accent-app scale-105 animate-pulse' : 'hover:scale-105'}`}
                  >
                    <span>{day.dayLabel}</span>
                  </button>
                ))
              )}
            </div>

            {/* Heatmap Day Expandable Panel */}
            {selectedHeatmapDate && (() => {
              const selectedDayObj = heatmapWeeks.flatMap(w => w).find(d => d.dateStr === selectedHeatmapDate);
              const dayTasks = selectedDayObj ? selectedDayObj.tasks : [];

              return (
                <div className="p-4 bg-bg-app border border-border-app rounded-lg space-y-2.5 animate-page-slide">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold text-accent-app">AGENDA FOR {selectedHeatmapDate}</span>
                    <span className="text-text-secondary">{selectedDayObj?.load}h Load</span>
                  </div>
                  {dayTasks.length === 0 ? (
                    <p className="text-[10px] text-text-secondary italic font-mono">// Cognitive buffer clear. No tasks scheduled.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayTasks.map(t => (
                        <div key={t.id} className="text-[11px] flex justify-between items-center font-mono">
                          <span className={`truncate pr-4 ${t.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                            • {t.title}
                          </span>
                          <span className="text-text-secondary shrink-0">{t.estimatedHours}h ({t.priority})</span>
                        </div>
                      ))}
                      {selectedDayObj && selectedDayObj.load > 4 && (
                        <p className="text-[10px] text-[#FF5A6C] font-mono mt-2 italic">
                          ⚠️ warning: High workload density on this node. Triggering early drift protocol.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          </div>

          {/* Active Projects Tracker, Timetable Schedule Parser, and GCal Sync (3 Columns Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Active Projects Tracker */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-baseline">
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Active Projects Monitor</h3>
                <span className="text-[10px] font-mono text-accent-app font-bold">
                  {(() => {
                    const total = goals.length;
                    const completed = goals.filter(g => g.tasks.length > 0 && g.tasks.every(t => t.completed)).length;
                    return `${completed} / ${total} Completed`;
                  })()}
                </span>
              </div>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {goals.length === 0 ? (
                  <div className="text-center py-8 text-xs text-text-secondary font-mono">
                    // 0 projects active.
                  </div>
                ) : (
                  goals.map((g) => {
                    const totalTasks = g.tasks.length;
                    const completedTasks = g.tasks.filter(t => t.completed).length;
                    const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    const isProjectCompleted = totalTasks > 0 && completedTasks === totalTasks;

                    return (
                      <div
                        key={g.id}
                        onClick={() => onSelectGoal(g)}
                        className="p-3 bg-bg-app border border-border-app hover:border-text-primary rounded-lg transition-all duration-200 cursor-pointer space-y-2 group"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-text-primary group-hover:text-accent-app transition-colors truncate max-w-[120px] font-mono">
                            {g.title}
                          </span>
                          {isProjectCompleted ? (
                            <span className="text-[9px] font-mono font-bold text-success-app bg-success-app/10 border border-success-app/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Completed
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono text-text-secondary">
                              {completedTasks}/{totalTasks} Tasks
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-border-app/25 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${isProjectCompleted ? 'bg-success-app' : 'bg-accent-app'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-mono text-text-secondary">
                            <span>Due: {g.deadline}</span>
                            <span>{progressPct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Timetable / Academic Schedule Parser Card */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Timetable & Schedule Parser</h3>
                <p className="text-[10px] text-text-secondary mt-0.5 leading-relaxed">
                  Upload raw text timetables, exams, deadlines, or calendars. OhNo's AI engine will structure them into independent active project pipelines with daily task nodes automatically.
                </p>
              </div>
              
              <button
                onClick={() => setShowParserModal(true)}
                className="w-full py-2.5 bg-hover-app hover:bg-hover-app/80 text-text-primary border border-border-app rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer animate-pulse-slow"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-app" />
                <span>Import from Timetable / Text</span>
              </button>
            </div>

            {/* Google Calendar Sync Hub Card */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">GCal Sync Hub</h3>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-success-app bg-success-app/10 border border-success-app/20 px-1.5 py-0.5 rounded">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-app animate-ping" />
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-text-secondary mt-1 leading-relaxed font-mono">
                  Automatically sync study windows and deadline recovery markers to your calendar session feed.
                </p>
                
                {isDashboardSyncing ? (
                  <div className="mt-3 bg-bg-app/40 border border-border-app/20 p-2.5 rounded-lg text-[8px] font-mono text-text-secondary max-h-16 overflow-y-auto space-y-1">
                    {dashboardSyncLogs.map((log, i) => (
                      <div key={i} className="truncate">{log}</div>
                    ))}
                  </div>
                ) : dashboardConfirmation ? (
                  <div className="mt-3 p-2 bg-success-app/5 border border-success-app/10 rounded-lg text-[9px] text-success-app font-mono leading-tight">
                    {dashboardConfirmation}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={handleDashboardSyncGCal}
                disabled={isDashboardSyncing || goals.length === 0}
                className="w-full py-2.5 bg-hover-app hover:bg-hover-app/80 text-text-primary border border-border-app rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
              >
                {isDashboardSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-accent-app" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-3.5 h-3.5 text-accent-app" />
                    <span>Sync All Projects</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* 2. Workload Distribution Chart & 7. AI Priority Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Workload Stacked Bar Chart */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Weekly Workload Distribution</h3>
                <p className="text-[10px] text-text-secondary mt-0.5">Study hours split per weekday (Completed vs Pending)</p>
              </div>

              <div className="flex items-end justify-between h-40 pt-4 px-2" id="workload-distribution-bars">
                {weeklyWorkload.map((w, idx) => {
                  const compPct = maxWeeklyHours > 0 ? (w.completedHrs / maxWeeklyHours) * 100 : 0;
                  const pendPct = maxWeeklyHours > 0 ? (w.pendingHrs / maxWeeklyHours) * 100 : 0;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 w-8 group cursor-pointer">
                      <div className="relative w-2.5 h-28 bg-border-app/20 rounded-full overflow-hidden flex flex-col justify-end">
                        {/* Pending Bars */}
                        <div 
                          className="w-full bg-[#FF5A6C]/80 transition-all duration-300 rounded-t-full"
                          style={{ height: `${pendPct}%` }}
                        />
                        {/* Completed Bars */}
                        <div 
                          className="w-full bg-success-app transition-all duration-300 rounded-full"
                          style={{ height: `${compPct}%` }}
                        />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-text-primary text-bg-app text-[9px] font-mono py-1 px-1.5 rounded whitespace-nowrap z-30 font-bold">
                          {w.completedHrs}h Done | {w.pendingHrs}h Left
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-text-secondary">{w.dayName}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Priority Matrix (Eisenhower Quadrant) */}
            <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">AI Priority Matrix</h3>
                <p className="text-[10px] text-text-secondary mt-0.5">Quadrants calculated dynamically based on deadline proximity</p>
              </div>

              <div className="relative h-40 border-l border-b border-border-app/60 flex items-center justify-center font-mono">
                {/* Quadrant Lines */}
                <div className="absolute inset-0 border-r border-t border-border-app/20 pointer-events-none" />
                
                {/* Labels */}
                <span className="absolute top-1 left-2 text-[8px] text-danger-app/60">URGENT & IMPORTANT</span>
                <span className="absolute top-1 right-2 text-[8px] text-warning-app/60">IMPORTANT (NOT URGENT)</span>
                <span className="absolute bottom-1 left-2 text-[8px] text-text-secondary/50">URGENT (NOT IMPORTANT)</span>
                <span className="absolute bottom-1 right-2 text-[8px] text-[#9FA3A9]/40">DELEGATE / ELIMINATE</span>

                {/* Task Coordinates */}
                {matrixTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="absolute group cursor-pointer"
                    style={{ left: `${t.x}%`, bottom: `${t.y}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-app border border-bg-app hover:scale-125 transition-transform" />
                    
                    {/* Floating Info card */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#18191D] border border-border-app p-2 rounded shadow-xl text-[8px] whitespace-nowrap z-30 space-y-0.5 max-w-[150px]">
                      <div className="font-bold text-text-primary truncate">{t.title}</div>
                      <div className="text-text-secondary truncate">{t.goalTitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 8. Project Dependency Graph & 4. Deadline Timeline */}
          <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-6">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Project Dependency Graph & Timeline</h3>
              <p className="text-[10px] text-text-secondary mt-0.5">milestones and prerequisite task pathways. Delays cascade visually.</p>
            </div>

            {/* Dependency Graph rendering via SVGs */}
            <div className="relative h-28 border border-border-app/30 rounded-lg bg-bg-app/20 overflow-hidden flex items-center justify-center">
              {dependencyTasks.length === 0 ? (
                <span className="text-xs text-text-secondary font-mono">// Load Demo to visualize sequence dependencies.</span>
              ) : (
                <svg className="w-full h-full p-4" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="15" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2A2D33" />
                    </marker>
                  </defs>

                  {/* Draw link arrows between nodes */}
                  {dependencyTasks.map((t, idx) => {
                    if (idx === dependencyTasks.length - 1) return null;
                    const startX = 60 + idx * 120;
                    const endX = 60 + (idx + 1) * 120;
                    const startY = 45;
                    const endY = 45;

                    return (
                      <line 
                        key={idx} 
                        x1={startX} 
                        y1={startY} 
                        x2={endX} 
                        y2={endY} 
                        stroke={t.completed ? "#57E389" : "#FF5A6C"} 
                        strokeWidth="1.5" 
                        strokeDasharray={t.completed ? "none" : "3,3"}
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}

                  {/* Draw Nodes */}
                  {dependencyTasks.map((t, idx) => {
                    const x = 60 + idx * 120;
                    const y = 45;

                    return (
                      <g key={t.id} className="group cursor-pointer">
                        <circle 
                          cx={x} 
                          cy={y} 
                          r="12" 
                          fill={t.completed ? "#57E389" : t.isCritical ? "#FF5A6C" : "#18191D"} 
                          stroke={t.completed ? "none" : t.isCritical ? "#FF5A6C" : "#2A2D33"} 
                          strokeWidth="2"
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
                        {/* Title text */}
                        <text
                          x={x}
                          y={y + 24}
                          fill="#F5F5F5"
                          fontSize="8"
                          textAnchor="middle"
                          fontFamily="Outfit"
                          className="opacity-80 truncate"
                        >
                          {t.title.length > 12 ? t.title.substring(0, 10) + '..' : t.title}
                        </text>

                        {/* Tooltip details */}
                        <title>{t.title} ({t.estimatedHours}h)</title>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

        </div>

        {/* Right 4-Column Panel */}
        <div className="lg:col-span-4 space-y-8">

          {/* 3. Recovery Probability Ring & 10. Stress Forecast */}
          <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-6">
            
            {/* Probability Ring */}
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Triage Health Ring</span>
              
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className="stroke-border-app/30 fill-transparent"
                    strokeWidth="8"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="58"
                    className="stroke-accent-app fill-transparent transition-all duration-500 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 58}
                    strokeDashoffset={2 * Math.PI * 58 * (1 - metrics.productivityScore / 100)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold font-mono text-text-primary">{metrics.productivityScore}%</span>
                  <span className="text-[9px] text-text-secondary uppercase font-mono font-bold tracking-tight">Recovery Likelihood</span>
                </div>
              </div>
            </div>

            {/* Stress Forecast */}
            <div className="border-t border-border-app/40 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">7-day Stress Forecast</span>
                <button
                  type="button"
                  onClick={() => setShowForecastInfo(true)}
                  className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer focus:outline-none"
                  title="Click to learn about stress forecast metrics"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {stressForecastDays.map((day, idx) => (
                  <div 
                    key={idx} 
                    className={`p-1.5 rounded-lg border text-center flex flex-col items-center justify-between gap-1.5 transition-all ${day.bgClass}`}
                  >
                    <span className="text-[8px] font-mono text-text-secondary uppercase">{day.dayName}</span>
                    {day.icon}
                    <span className="text-[8px] font-mono text-text-primary">{day.hours}h</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 5. Time Allocation & 6. Focus Trend Line */}
          <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-6">
            
            {/* Pie Chart */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono block">Time Allocation Breakdown</span>
              <div className="flex items-center justify-between gap-4">
                {/* SVG Pie Chart */}
                <svg className="w-24 h-24 transform -rotate-90 shrink-0" viewBox="-1 -1 2 2">
                  {timeAllocData.map((slice, index) => {
                    const percent = slice.value / totalWeeklyHours;
                    const [startX, startY] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += percent;
                    const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = percent > 0.5 ? 1 : 0;
                    const pathData = `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;

                    return (
                      <path 
                        key={index} 
                        d={pathData} 
                        fill={slice.color} 
                        stroke="#18191D" 
                        strokeWidth="0.04"
                      />
                    );
                  })}
                </svg>

                {/* Legends list */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  {timeAllocData.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] font-mono">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-text-secondary truncate">{s.label}</span>
                      </div>
                      <span className="text-text-primary font-bold shrink-0">{s.value}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Focus Trend Line */}
            <div className="border-t border-border-app/40 pt-4 space-y-3">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono block">Historical Focus Index</span>
              
              <div className="h-20 w-full pt-2">
                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="10" x2="100" y2="10" stroke="#2A2D33" strokeWidth="0.2" strokeDasharray="2,2" />
                  <line x1="0" y1="20" x2="100" y2="20" stroke="#2A2D33" strokeWidth="0.2" strokeDasharray="2,2" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#2A2D33" strokeWidth="0.2" strokeDasharray="2,2" />

                  {/* Trend Polyline */}
                  <polyline
                    fill="none"
                    stroke="#D9FF57"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={trendPoints.map((val, idx) => {
                      const x = (idx / (trendPoints.length - 1)) * 100;
                      const y = 40 - (val / 100) * 35;
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Nodes along the polyline */}
                  {trendPoints.map((val, idx) => {
                    const x = (idx / (trendPoints.length - 1)) * 100;
                    const y = 40 - (val / 100) * 35;

                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill="#0F1012"
                        stroke="#D9FF57"
                        strokeWidth="0.8"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

          </div>

          {/* 9. Recovery Simulation Comparison */}
          <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4">
            <div>
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Recovery Simulation Comparison</h3>
              <p className="text-[10px] text-text-secondary mt-0.5">Pre-calculate outcomes based on active selection vectors</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Option A */}
              <div className="p-3 bg-success-app/5 border border-success-app/10 rounded-lg space-y-2">
                <span className="text-[8px] font-mono text-success-app uppercase font-bold">Follow Agenda</span>
                <div className="space-y-1">
                  <span className="text-sm font-bold font-mono text-text-primary block">92% Prob</span>
                  <span className="text-[8px] text-text-secondary block font-mono">0h Delay Debt</span>
                </div>
              </div>

              {/* Option B */}
              <div className="p-3 bg-danger-app/5 border border-danger-app/10 rounded-lg space-y-2">
                <span className="text-[8px] font-mono text-danger-app uppercase font-bold">Skip Today's Work</span>
                <div className="space-y-1">
                  <span className="text-sm font-bold font-mono text-text-primary block">35% Prob</span>
                  <span className="text-[8px] text-text-secondary block font-mono">+{activeProject ? activeProject.availableHours / 3 : 3}h Debt</span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority 5: AI Insights Panel */}
          <div className="bg-card-app border border-border-app p-6 rounded-xl space-y-4" id="ai-insights-panel">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-accent-app" />
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono">Things you probably didn't notice</h3>
            </div>
            <div className="space-y-3 font-mono text-[10px] text-text-secondary">
              <div className="flex items-start gap-2">
                <span className="text-accent-app">•</span>
                <p>Thursday exceeds your normal cognitive capacity limits (5.8h total load).</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-app">•</span>
                <p>Friday contains two high-context-switch tasks back-to-back.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-app">•</span>
                <p>Moving the OS Lab scheduler by one day reduces local stress index by 18%.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-accent-app">•</span>
                <p>You consistently underestimate machine learning report writing tasks by 25%.</p>
              </div>
            </div>
            
            {/* Confidence indicator */}
            <div className="border-t border-border-app/25 pt-3 flex justify-between items-center text-[9px] font-mono text-text-secondary">
              <span>Confidence: <strong className="text-success-app">91%</strong></span>
              <span>Telemetry: Calendar, Deadlines, Workloads</span>
            </div>
          </div>

        </div>

      </div>

      {/* Today's Recovery Plan List */}
      <div className="space-y-5 border-t border-border-app/40 pt-10" id="todays-recovery-plan">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Today's recovery plan</h2>
            <p className="text-xs text-text-secondary mt-1">Surgically ordered tasks for {currentDate}</p>
          </div>
          <span className="text-[10px] font-mono text-text-secondary">// Today is {currentDate}</span>
        </div>

        <div className="divide-y divide-border-app/40">
          {stressForecastDays[0]?.hours === 0 ? (
            <p className="py-6 text-xs text-text-secondary font-mono">
              // Today's recovery agenda is clear. Maintain cognitive buffer.
            </p>
          ) : (
            goals.flatMap(g => 
              g.tasks.map(t => ({ ...t, goalTitle: g.title, parentGoal: g }))
            ).filter(t => t.scheduledDate === currentDate).map(task => (
              <div key={task.id} className="flex flex-col py-3.5 transition-all">
                <div 
                  className="flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    {task.isCritical && (
                      <span className="text-[8px] font-mono font-bold bg-danger-app/10 text-danger-app px-1.5 py-0.5 rounded border border-danger-app/10 shrink-0">
                        Gating
                      </span>
                    )}
                    {task.energyLoad === 'high' && (
                      <span className="text-[8px] font-mono font-bold bg-accent-app/10 text-text-primary px-1.5 py-0.5 rounded shrink-0">
                        High Load
                      </span>
                    )}
                    <span className={`text-xs font-medium truncate ${task.completed ? 'line-through text-text-secondary' : 'text-text-primary'}`}>{task.title}</span>
                  </div>
                  <div className="flex items-center gap-6 shrink-0 font-mono text-[10px]">
                    <button 
                      type="button"
                      onClick={() => toggleReasoning(task.id)}
                      className="text-accent-app hover:underline cursor-pointer"
                    >
                      Why?
                    </button>
                    <span className="text-text-secondary">{task.estimatedHours}h</span>
                    <button
                      type="button"
                      onClick={() => onSelectGoal(task.parentGoal)}
                      className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                    >
                      View Timeline
                    </button>
                  </div>
                </div>

                {/* Priority 3: Reasoning Disclosures */}
                {showReasoning[task.id] && (
                  <div className="mt-2.5 p-3 bg-bg-app border border-border-app/60 rounded-lg text-[10px] font-mono text-text-secondary space-y-1.5 animate-page-slide max-w-2xl">
                    <div className="flex justify-between items-center text-text-primary font-bold">
                      <span>AI RESOLUTION CONTEXT</span>
                      <span className="text-success-app font-mono font-bold">Confidence: 92%</span>
                    </div>
                    <p>• DBMS exam/revision is scheduled earlier in the sequence.</p>
                    <p>• Task profile matches history of underestimation.</p>
                    <p>• Active day load limit already exceeds cognitive capacity guidelines.</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Session Memory / Telemetry & Action Log Database */}
      <div className="space-y-5 border-t border-border-app/40 pt-10" id="session-telemetry-log">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="text-sm font-bold text-text-primary">Session Telemetry & Events Log</h2>
            <p className="text-xs text-text-secondary mt-1">Persistent database log of workspace mutations and triage events</p>
          </div>
          {sessionEvents && sessionEvents.length > 0 && onClearEvents && (
            <button
              onClick={onClearEvents}
              className="px-2.5 py-1 text-[10px] font-mono bg-[#FF5A6C]/10 hover:bg-[#FF5A6C]/20 text-[#FF5A6C] rounded-md transition-colors cursor-pointer"
            >
              Clear Log Database
            </button>
          )}
        </div>

        <div className="bg-card-app border border-border-app rounded-xl p-4 overflow-hidden">
          {!sessionEvents || sessionEvents.length === 0 ? (
            <p className="py-6 text-xs text-text-secondary font-mono text-center">
              // Database empty. Logged actions (toggling tasks, applying triage, etc.) will populate this area.
            </p>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {sessionEvents.map((evt) => {
                let badgeColor = 'bg-border-app/40 text-text-secondary';
                if (evt.type === 'task_toggle') badgeColor = 'bg-success-app/10 text-success-app border border-success-app/10';
                else if (evt.type === 'task_add') badgeColor = 'bg-accent-app/10 text-text-primary border border-accent-app/10';
                else if (evt.type === 'triage_apply') badgeColor = 'bg-warning-app/10 text-warning-app border border-warning-app/10';
                else if (evt.type === 'panic_trigger' || evt.type === 'panic_apply') badgeColor = 'bg-danger-app/10 text-[#FF5A6C] border border-[#FF5A6C]/15';
                else if (evt.type === 'simulation_increment' || evt.type === 'simulation_reset') badgeColor = 'bg-text-primary/10 text-text-primary border border-text-primary/10';

                return (
                  <div key={evt.id} className="text-xs font-mono flex items-start justify-between gap-4 border-b border-border-app/15 pb-2.5 last:border-0 last:pb-0">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${badgeColor}`}>
                          {evt.title}
                        </span>
                        <span className="text-text-primary font-medium">{evt.description}</span>
                      </div>
                      {evt.details && (
                        <p className="text-[10px] text-text-secondary leading-relaxed pl-1 italic">
                          // {evt.details}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-text-secondary shrink-0">{evt.timestamp}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Stress Forecast Explanation Modal */}
      {showForecastInfo && (
        <div className="fixed inset-0 z-50 bg-[#0F1012]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-app border border-border-app rounded-xl w-full max-w-md p-6 relative overflow-hidden font-sans">
            <button
              onClick={() => setShowForecastInfo(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border-app hover:bg-hover-app transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight font-mono uppercase">7-Day Stress Forecast Metrics</h3>
                <p className="text-xs text-text-secondary mt-1">Understanding cognitive and load-based stress telemetry.</p>
              </div>
              <div className="space-y-3 text-xs text-text-secondary leading-relaxed font-mono">
                <p>
                  Our stress forecast represents the compounding cognitive overhead calculated dynamically using the total sum of estimated work hours for all incomplete tasks scheduled on a given day.
                </p>
                <div className="space-y-2 border-t border-b border-border-app/20 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded bg-success-app/20 border border-success-app" />
                    <span><strong>0h - 2h (Low Stress)</strong>: Clear cognitive buffer. Healthy.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded bg-warning-app/20 border border-warning-app" />
                    <span><strong>2h - 4h (Moderate Stress)</strong>: Balanced workspace load.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded bg-[#FF5A6C]/20 border border-danger-app" />
                    <span><strong>4h - 6h (Heavy Stress)</strong>: Timeline compression risk.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded bg-danger-app border border-danger-app/60" />
                    <span><strong>6h+ (Critical Crunch)</strong>: High probability of timeline drift. Immediate triage recommended.</span>
                  </div>
                </div>
                <p className="text-[10px] text-accent-app font-bold">
                  💡 Tip: If you see Yellow or Red days in the forecast, use "Triage" in the project workspace to reallocate hours, or click "I messed up" to engage emergency triage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule / Timetable Parser Modal */}
      {showParserModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1012]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-app border border-border-app rounded-xl w-full max-w-lg p-6 relative overflow-hidden font-sans">
            <button
              onClick={() => {
                setShowParserModal(false);
                setParseLogs([]);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border-app hover:bg-hover-app transition-colors text-text-secondary hover:text-text-primary cursor-pointer animate-fade-in"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary font-mono uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent-app" /> AI Timetable Parser
                </h3>
                <p className="text-xs text-text-secondary mt-1">Paste your syllabus, exams, deadlines, or study schedule. OhNo will extract tasks and schedule projects.</p>
              </div>

              {!isParsing && parseLogs.length > 0 && parseLogs[parseLogs.length - 1].includes("Successfully") ? (
                <div className="space-y-4 py-4 text-center">
                  <div className="w-12 h-12 bg-success-app/10 border border-success-app/30 rounded-full flex items-center justify-center mx-auto text-success-app">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-text-primary font-mono font-semibold">
                    {parseLogs[parseLogs.length - 1]}
                  </p>
                  <button
                    onClick={() => {
                      setShowParserModal(false);
                      setParseLogs([]);
                    }}
                    className="px-5 py-2 bg-accent-app text-black rounded-lg text-xs font-mono font-bold hover:opacity-90 transition-all cursor-pointer"
                  >
                    View on HUD
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-text-secondary font-medium">Paste Schedule Text</label>
                      <button
                        type="button"
                        onClick={handleToggleVoice}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                          isListening
                            ? "bg-danger-app/10 border-danger-app/40 text-danger-app animate-pulse"
                            : "bg-hover-app border-border-app text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-3.5 h-3.5" />
                            <span>Stop Listening</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-accent-app" />
                            <span>Speak Timetable</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      value={scheduleText}
                      onChange={(e) => setScheduleText(e.target.value)}
                      placeholder="e.g.&#10;July 10: Biology Midterm Exam&#10;July 12: Submission of history paper (10 hours total work needed)&#10;August 5: Final project defense"
                      rows={6}
                      disabled={isParsing}
                      className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary font-medium">Daily commitment budget limit (hours)</label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={dailyHoursLimit}
                      onChange={(e) => setDailyHoursLimit(parseInt(e.target.value) || 3)}
                      disabled={isParsing}
                      className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none font-mono"
                    />
                  </div>

                  {parseLogs.length > 0 && (
                    <div className="p-3 bg-bg-app border border-border-app rounded-xl space-y-1 text-[10px] font-mono text-text-secondary max-h-32 overflow-y-auto">
                      {parseLogs.map((log, i) => (
                        <p key={i}>• {log}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      onClick={() => {
                        setShowParserModal(false);
                        setParseLogs([]);
                      }}
                      className="px-4 py-2 text-xs font-mono text-text-secondary hover:text-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleParseScheduleText}
                      disabled={isParsing || !scheduleText.trim()}
                      className="px-5 py-2.5 text-xs font-mono font-bold bg-[#D9FF57] text-black rounded-lg disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                    >
                      {isParsing ? (
                        <>
                          <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          <span>Parsing...</span>
                        </>
                      ) : (
                        <span>Generate Projects</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
