/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Target,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  CalendarCheck,
  ChevronRight,
  Info,
  Sun,
  Moon,
  ShieldAlert,
  Flame,
  CheckCircle,
  HelpCircle,
  Search,
  Settings,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import GoalCreator from './components/GoalCreator';
import SchedulePanel from './components/SchedulePanel';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Spotlight from './components/Spotlight';
import ProjectWorkspace from './components/ProjectWorkspace';
import TasksPanel from './components/TasksPanel';
import { Goal, Task, PlanGenerationRequest, ProductivitySummary } from './types';

// Mock/Initial demo goal so the application is immediately visual & interactive
const ALEX_DEMO_GOALS: Goal[] = [
  {
    id: "alex-ml",
    title: "Machine Learning Research Paper",
    category: "project",
    deadline: "2026-06-30",
    estimatedHours: 24,
    availableHours: 12,
    urgency: "high",
    complexity: "high",
    createdAt: "2026-06-20",
    aiAnalysis: "Timeline begins to drift. Focus on Dataset Cleaning to increase completion probability.",
    driftProbability: 35,
    driftExplanation: "Dataset preparation takes high effort. Recommended window is morning deep work.",
    academicImpact: "Missing this deadline caps the module grade at 40%.",
    focusWindows: ["08:00 - 11:30 Peak Focus Window", "16:00 - 18:00 Review Window"],
    dailyBriefing: {
      biggestRisk: "Dataset Cleaning delay.",
      objective: "Clean model datasets.",
      recoveryProgress: 60,
      successProbability: 74
    },
    scenarios: [
      { name: "Skip Today's Work", outcome: "Pushes training to tomorrow, forcing a 7h crunch block.", riskImpact: "Critical Drift (+40% Risk)", delayDebt: 3.5 },
      { name: "Scope Reduction", outcome: "Skips advanced plots. Cuts 3 hours of effort, but drops maximum paper grade potential by 15%.", riskImpact: "Stable (-10% Risk)", delayDebt: -3 },
      { name: "Crunch Mode", outcome: "Consolidates sleep intervals to execute double-load tomorrow. Retains full features.", riskImpact: "High Stress (+5% Risk)", delayDebt: 0 }
    ],
    tasks: [
      { id: "ml-t1", goalId: "alex-ml", title: "Submit abstract and literature review", estimatedHours: 2.0, priority: "medium", completed: true, scheduledDate: "2026-06-21", isCritical: false, notes: "Prerequisite completed.", energyLoad: "medium" },
      { id: "ml-t2", goalId: "alex-ml", title: "Clean model datasets and draft basic neural network code", estimatedHours: 1.8, priority: "high", completed: false, scheduledDate: "2026-06-23", isCritical: true, notes: "Clean shapes first.", energyLoad: "high" },
      { id: "ml-t3", goalId: "alex-ml", title: "Train parameters, plot loss metrics, and record weights", estimatedHours: 3.5, priority: "high", completed: false, scheduledDate: "2026-06-25", isCritical: true, notes: "Verify dimensions.", energyLoad: "high" },
      { id: "ml-t4", goalId: "alex-ml", title: "Draft concluding discussion headings", estimatedHours: 2.5, priority: "medium", completed: false, scheduledDate: "2026-06-27", isCritical: false, notes: "Outline draft.", energyLoad: "medium" },
      { id: "ml-t5", goalId: "alex-ml", title: "Proofread document and run slides dry-run", estimatedHours: 3.0, priority: "high", completed: false, scheduledDate: "2026-06-29", isCritical: true, notes: "Check formatting.", energyLoad: "low" }
    ]
  },
  {
    id: "alex-os",
    title: "Operating Systems Lab",
    category: "assignment",
    deadline: "2026-07-02",
    estimatedHours: 16,
    availableHours: 10,
    urgency: "medium",
    complexity: "high",
    createdAt: "2026-06-22",
    aiAnalysis: "Thread scheduler code requires validation of concurrency deadlocks.",
    driftProbability: 25,
    driftExplanation: "Concurrency bugs might consume additional debugging hours.",
    academicImpact: "OS Lab grade weighs 20% of the overall course mark.",
    focusWindows: ["10:00 - 12:30 Concurrency Lab Session"],
    dailyBriefing: {
      biggestRisk: "Deadlock testing overhead.",
      objective: "Implement thread scheduler in C.",
      recoveryProgress: 100,
      successProbability: 80
    },
    scenarios: [
      { name: "Skip Today's Work", outcome: "Forces overlapping with hackathon prototype development.", riskImpact: "High Risk (+25%)", delayDebt: 4.0 },
      { name: "Scope Cut", outcome: "Discard bonus scheduling algorithm, sacrificing 5% grades.", riskImpact: "Safe (-5%)", delayDebt: -2.0 }
    ],
    tasks: [
      { id: "os-t1", goalId: "alex-os", title: "Implement thread scheduler in C", estimatedHours: 4.0, priority: "high", completed: false, scheduledDate: "2026-06-24", isCritical: true, notes: "Handle race conditions.", energyLoad: "high" },
      { id: "os-t2", goalId: "alex-os", title: "Test semaphores and mutex locks", estimatedHours: 3.0, priority: "medium", completed: false, scheduledDate: "2026-06-26", isCritical: true, notes: "Validate deadlocks.", energyLoad: "medium" },
      { id: "os-t3", goalId: "alex-os", title: "Write OS lab analysis report", estimatedHours: 3.0, priority: "low", completed: false, scheduledDate: "2026-06-28", isCritical: false, notes: "Document results.", energyLoad: "low" }
    ]
  },
  {
    id: "alex-hack",
    title: "Hackathon Prototype",
    category: "project",
    deadline: "2026-07-04",
    estimatedHours: 20,
    availableHours: 12,
    urgency: "high",
    complexity: "medium",
    createdAt: "2026-06-20",
    aiAnalysis: "High ROI project. Solid backend API structures established.",
    driftProbability: 15,
    driftExplanation: "Backend boilerplate is already in place. Focus on responsive frontend panel.",
    academicImpact: "Winner presentation unlocks internship paths.",
    focusWindows: ["14:00 - 17:00 UI Sprints"],
    dailyBriefing: {
      biggestRisk: "AI models integration delays.",
      objective: "Develop responsive panels.",
      recoveryProgress: 50,
      successProbability: 90
    },
    scenarios: [
      { name: "Skip Today's Work", outcome: "Timeline compresses. Front-end fidelity drops.", riskImpact: "Moderate (+15%)", delayDebt: 3.0 }
    ],
    tasks: [
      { id: "hack-t1", goalId: "alex-hack", title: "Establish system architecture and API endpoints", estimatedHours: 3.0, priority: "high", completed: true, scheduledDate: "2026-06-23", isCritical: true, notes: "API boilerplate.", energyLoad: "high" },
      { id: "hack-t2", goalId: "alex-hack", title: "Develop interactive responsive frontend panels", estimatedHours: 5.0, priority: "high", completed: false, scheduledDate: "2026-06-25", isCritical: true, notes: "Use theme colors.", energyLoad: "medium" },
      { id: "hack-t3", goalId: "alex-hack", title: "Integrate AI model suggestions", estimatedHours: 4.0, priority: "medium", completed: false, scheduledDate: "2026-06-28", isCritical: false, notes: "Ensure low latency.", energyLoad: "high" }
    ]
  },
  {
    id: "alex-prep",
    title: "Placement Preparation",
    category: "interview",
    deadline: "2026-07-06",
    estimatedHours: 12,
    availableHours: 8,
    urgency: "critical",
    complexity: "high",
    createdAt: "2026-06-22",
    aiAnalysis: "System design revision is critical. Pre-solve DP matrices.",
    driftProbability: 20,
    driftExplanation: "High-stress window. Keep mock interviews short.",
    academicImpact: "Crucial for securing summer job offers.",
    focusWindows: ["09:00 - 11:00 Algorithms Practice"],
    dailyBriefing: {
      biggestRisk: "Mock interview timing overlaps.",
      objective: "Review system design fundamentals.",
      recoveryProgress: 100,
      successProbability: 85
    },
    scenarios: [
      { name: "Skip Today's Work", outcome: "Cuts down essential design study blocks.", riskImpact: "High Risk (+20%)", delayDebt: 2.5 }
    ],
    tasks: [
      { id: "prep-t1", goalId: "alex-prep", title: "Practice advanced dynamic programming questions", estimatedHours: 4.0, priority: "high", completed: true, scheduledDate: "2026-06-24", isCritical: true, notes: "Focus on matrices.", energyLoad: "high" },
      { id: "prep-t2", goalId: "alex-prep", title: "Review system design fundamentals", estimatedHours: 3.0, priority: "medium", completed: false, scheduledDate: "2026-06-26", isCritical: true, notes: "Study caching.", energyLoad: "medium" },
      { id: "prep-t3", goalId: "alex-prep", title: "Conduct mock behavioral interview", estimatedHours: 2.0, priority: "low", completed: false, scheduledDate: "2026-06-29", isCritical: false, notes: "Refine STAR replies.", energyLoad: "low" }
    ]
  },
  {
    id: "alex-rev",
    title: "Midterm Revision",
    category: "exam",
    deadline: "2026-07-08",
    estimatedHours: 18,
    availableHours: 12,
    urgency: "medium",
    complexity: "medium",
    createdAt: "2026-06-22",
    aiAnalysis: "Summarize DBMS slides and complete linear algebra practice sheets.",
    driftProbability: 10,
    driftExplanation: "Strong initial comprehension. Keep revising protocols.",
    academicImpact: "Midterms weigh 30% of course grade.",
    focusWindows: ["15:00 - 17:00 Revision Session"],
    dailyBriefing: {
      biggestRisk: "Algebra calculation errors.",
      objective: "Summarize DBMS lecture slides.",
      recoveryProgress: 100,
      successProbability: 95
    },
    scenarios: [
      { name: "Skip Today's Work", outcome: "Delays algebra review sessions.", riskImpact: "Moderate (+10%)", delayDebt: 3.0 }
    ],
    tasks: [
      { id: "rev-t1", goalId: "alex-rev", title: "Summarize DBMS lecture slides", estimatedHours: 3.0, priority: "medium", completed: false, scheduledDate: "2026-06-25", isCritical: false, notes: "Review normalization.", energyLoad: "low" },
      { id: "rev-t2", goalId: "alex-rev", title: "Solve past algebra papers", estimatedHours: 4.0, priority: "high", completed: false, scheduledDate: "2026-06-27", isCritical: true, notes: "Practice matrices.", energyLoad: "high" },
      { id: "rev-t3", goalId: "alex-rev", title: "Review computer networks protocols", estimatedHours: 3.0, priority: "low", completed: false, scheduledDate: "2026-07-01", isCritical: false, notes: "Review TCP layers.", energyLoad: "medium" }
    ]
  }
];

const getShiftedDemoGoals = (): Goal[] => {
  const originalRef = new Date('2026-06-23T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - originalRef.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const shiftDate = (dateStr: string): string => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + diffDays);
    return d.toISOString().split('T')[0];
  };

  return ALEX_DEMO_GOALS.map(g => ({
    ...g,
    deadline: shiftDate(g.deadline),
    createdAt: shiftDate(g.createdAt),
    lastRecoveredAt: g.lastRecoveredAt ? shiftDate(g.lastRecoveredAt) : undefined,
    tasks: g.tasks.map(t => ({
      ...t,
      scheduledDate: shiftDate(t.scheduledDate)
    }))
  }));
};

const INITIAL_DEMO_GOALS = getShiftedDemoGoals();
const HARSH_DEMO_GOALS = INITIAL_DEMO_GOALS;

import { SessionEvent } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('oh_no_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    const savedUser = localStorage.getItem('oh_no_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.username === 'alex') {
          const saved = localStorage.getItem('panic_pilot_goals');
          return saved ? JSON.parse(saved) : HARSH_DEMO_GOALS;
        } else {
          const saved = localStorage.getItem(`panic_pilot_goals_${user.username}`);
          return saved ? JSON.parse(saved) : [];
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeGoalId, setActiveGoalId] = useState<string | null>(() => {
    const savedUser = localStorage.getItem('oh_no_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user.username === 'alex') {
          const saved = localStorage.getItem('panic_pilot_active_id');
          if (saved && saved !== 'null') return saved;
          return HARSH_DEMO_GOALS[0]?.id || null;
        } else {
          const saved = localStorage.getItem(`panic_pilot_active_id_${user.username}`);
          return saved && saved !== 'null' ? saved : null;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [viewState, setViewState] = useState<'landing' | 'onboarding' | 'app'>(() => {
    const savedUser = localStorage.getItem('oh_no_current_user');
    return savedUser ? 'app' : 'landing';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timeline' | 'workspace' | 'settings' | 'tasks'>('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]); // Synced current date

  // Session Event Log Database State
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>(() => {
    const saved = localStorage.getItem('oh_no_session_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('oh_no_session_events', JSON.stringify(sessionEvents));
  }, [sessionEvents]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.username === 'alex') {
        localStorage.setItem('panic_pilot_goals', JSON.stringify(goals));
        localStorage.setItem('panic_pilot_active_id', String(activeGoalId));
      } else {
        localStorage.setItem(`panic_pilot_goals_${currentUser.username}`, JSON.stringify(goals));
        localStorage.setItem(`panic_pilot_active_id_${currentUser.username}`, String(activeGoalId));
      }
    }
  }, [goals, activeGoalId, currentUser]);

  const logSessionEvent = (type: SessionEvent['type'], title: string, description: string, details?: string) => {
    const todayLabel = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0];
    const newEvent: SessionEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: todayLabel,
      type,
      title,
      description,
      details
    };
    setSessionEvents(prev => [newEvent, ...prev]);
  };
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('oh_no_theme') === 'light';
  });

  // Spotlight search states
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);

  // Floating Tour State
  const [tourStep, setTourStep] = useState(0);

  // Celebration toast state
  const [celebration, setCelebration] = useState<{ message: string; diff?: string } | null>(null);

  // Guided Walkthrough Demo mode
  const [demoStep, setDemoStep] = useState(0);

  // Global Panic states
  const [showPanicModal, setShowPanicModal] = useState(false);
  const [panicGoal, setPanicGoal] = useState<Goal | null>(null);
  const [panicReason, setPanicReason] = useState('');
  const [panicStep, setPanicStep] = useState<'input' | 'simulating' | 'result'>('input');
  const [panicError, setPanicError] = useState<string | null>(null);
  const [panicTriageResult, setPanicTriageResult] = useState<any>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);

  const handlePanicSubmit = async (reasonText: string) => {
    if (!panicGoal || !reasonText.trim()) return;
    setPanicError(null);
    setPanicStep('simulating');
    setSimulationLogs(["Initializing triage...", "Analyzing capacity metrics..."]);

    const logIntervals = [
      setTimeout(() => setSimulationLogs(p => [...p, "Simulating failure drift..."]), 400),
      setTimeout(() => setSimulationLogs(p => [...p, "Compressing lower priority blocks..."]), 800),
      setTimeout(() => setSimulationLogs(p => [...p, "Calculating risk mitigations..."]), 1200),
      setTimeout(() => setSimulationLogs(p => [...p, "Rescheduling timelines..."]), 1600)
    ];

    try {
      const data = await handlePanicRecover(panicGoal, reasonText);
      logIntervals.forEach(clearTimeout);
      setPanicTriageResult(data);
      setPanicStep('result');
    } catch (err: any) {
      logIntervals.forEach(clearTimeout);
      setPanicError(err.message || "Triage calculation failed.");
      setPanicStep('input');
    }
  };

  const handleApplyPanic = () => {
    if (!panicGoal || !panicTriageResult || !panicTriageResult.updatedTasks) return;
    handleApplyPanicRecovery(
      panicGoal.id,
      panicTriageResult.updatedTasks,
      panicTriageResult.recoveryMessage,
      panicTriageResult.recoveryProbability
    );
    setShowPanicModal(false);
    setPanicReason('');
    setPanicTriageResult(null);
    setPanicStep('input');
  };

  const triggerCelebration = (msg: string, diff?: string) => {
    setCelebration({ message: msg, diff });
    setTimeout(() => setCelebration(null), 3000);
  };

  // Theme synchronization
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
      localStorage.setItem('oh_no_theme', 'light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('oh_no_theme', 'dark');
    }
  }, [isLightMode]);

  // Spotlight keyboard hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/') {
        // Prevent default input "/" trigger
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setIsSpotlightOpen(true);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Spotlight mouse spotlight tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('panic_pilot_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('panic_pilot_active_id', activeGoalId || 'null');
  }, [activeGoalId]);

  // Handle active goal reference
  const activeGoal = goals.find(g => g.id === activeGoalId) || null;

  // Global Stat Metrics Engine
  const calculateMetrics = (): ProductivitySummary => {
    const allTasks = goals.flatMap(g => g.tasks);
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;

    const remainingHours = allTasks
      .filter(t => !t.completed)
      .reduce((sum, t) => sum + t.estimatedHours, 0);

    const criticalTasks = allTasks.filter(t => t.isCritical);
    const criticalCount = criticalTasks.length;
    const criticalCompleted = criticalTasks.filter(t => t.completed).length;

    const overdueIncompleteCount = allTasks.filter(t =>
      !t.completed && new Date(t.scheduledDate) < new Date(currentDate)
    ).length;

    let statusAlertList: 'on-track' | 'warning' | 'panic-alert' = 'on-track';
    if (overdueIncompleteCount > 0) {
      statusAlertList = 'panic-alert';
    } else if (completionRate < 45 && total > 0) {
      statusAlertList = 'warning';
    }

    let pScore = 100;
    if (total > 0) {
      const completionWeight = completionRate * 0.5;
      const criticalWeight = criticalCount > 0 ? (criticalCompleted / criticalCount) * 40 : 40;
      const penaltyOverdue = Math.min(30, overdueIncompleteCount * 10);
      pScore = Math.max(0, Math.round(completionWeight + criticalWeight - penaltyOverdue));
    }

    return {
      totalTasks: total,
      completedTasks: completed,
      completionRate,
      remainingHours,
      criticalTasksCount: criticalCount,
      criticalTasksCompleted: criticalCompleted,
      productivityScore: pScore,
      onTrackAlert: statusAlertList
    };
  };

  const metrics = calculateMetrics();

  const [isPanicMode, setIsPanicMode] = useState(false);

  // Auto trigger Panic Mode if score < 40 or any goal has a missed deadline
  useEffect(() => {
    const hasMissedDeadline = goals.some(g => {
      const incomplete = g.tasks.some(t => !t.completed);
      return incomplete && new Date(g.deadline) < new Date(currentDate);
    });

    if ((metrics.productivityScore < 40 || hasMissedDeadline) && goals.length > 0) {
      setIsPanicMode(true);
    } else {
      setIsPanicMode(false);
    }
  }, [metrics.productivityScore, goals, currentDate]);

  // Create a plan from Onboarding
  const handleOnboardingComplete = (userProfile: any) => {
    setCurrentUser(userProfile);
    localStorage.setItem('oh_no_current_user', JSON.stringify(userProfile));
    setGoals([]);
    setActiveGoalId(null);
    setViewState('app');
    setActiveTab('dashboard');
    logSessionEvent('goal_add', 'New User Onboarded', `Created account for ${userProfile.username} (${userProfile.role}, age ${userProfile.age})`);
  };

  // Preload Harsh demo
  const handleLoadDemo = () => {
    const demoUser = {
      username: 'alex',
      email: 'alex@mit.edu',
      age: 21,
      role: 'Student',
      commonTasks: ["Syllabus & Lecture studies", "Code Sprints & Feature building"],
      procrastinationReasons: ["Perfectionism (afraid to make mistakes)"],
      dailyHours: 3
    };
    setCurrentUser(demoUser);
    localStorage.setItem('oh_no_current_user', JSON.stringify(demoUser));
    const shifted = getShiftedDemoGoals();
    setGoals(shifted);
    setActiveGoalId(shifted[0].id);
    setViewState('app');
    setActiveTab('dashboard');
    setDemoStep(1); // Start guided walkthrough
    logSessionEvent('goal_add', 'Demo Mode Loaded', 'Loaded Alex\'s ML project simulation demo with shifted dates.');
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('oh_no_current_user');
    setGoals([]);
    setActiveGoalId(null);
    setViewState('landing');
    setDemoStep(0);
  };

  // Create plan
  const handlePlanGenerate = async (request: PlanGenerationRequest) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server rejected schedule calculation.');
      }

      const rawPlan = await response.json();

      const newGoalId = `goal-${Date.now()}`;
      const rawTasks = Array.isArray(rawPlan.tasks) ? rawPlan.tasks : [];
      const transformedTasks: Task[] = rawTasks.map((t: any, index: number) => ({
        id: `task-${newGoalId}-${index}`,
        goalId: newGoalId,
        title: t.title,
        estimatedHours: t.estimatedHours || 1.5,
        priority: t.priority || 'medium',
        completed: false,
        scheduledDate: t.scheduledDate,
        isCritical: !!t.isCritical,
        notes: t.notes || '',
        energyLoad: t.energyLoad || 'medium'
      }));

      const newGoal: Goal = {
        id: newGoalId,
        title: request.title,
        category: request.category,
        deadline: request.deadline,
        estimatedHours: transformedTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
        availableHours: request.availableHours,
        urgency: rawPlan.urgency || 'medium',
        complexity: rawPlan.complexity || 'medium',
        aiAnalysis: rawPlan.aiAnalysis || 'Plan loaded and set on local dashboard path.',
        createdAt: currentDate,
        tasks: transformedTasks,
        driftProbability: rawPlan.driftProbability || 15,
        driftExplanation: rawPlan.driftExplanation || "Initial trajectory parameters established.",
        academicImpact: rawPlan.academicImpact || "No critical consequences defined.",
        focusWindows: rawPlan.focusWindows || ["09:00 - 11:30 Peak Focus Window"],
        dailyBriefing: rawPlan.dailyBriefing || {
          biggestRisk: "Establish primary workspace elements.",
          objective: "Define first milestone goals.",
          recoveryProgress: 100,
          successProbability: 85
        },
        scenarios: rawPlan.scenarios || []
      };

      setGoals(prev => [newGoal, ...prev]);
      setActiveGoalId(newGoalId);
      setActiveTab('timeline');
      logSessionEvent('goal_add', 'Project Plan Created', `Generated timeline for "${request.title}" (${request.category}) with deadline ${request.deadline}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reschedule
  const handlePlanRecover = async (targetGoal: Goal, availableHoursRemaining: number) => {
    setIsRecovering(true);
    try {
      const response = await fetch('/api/plan/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: targetGoal,
          availableHoursRemaining,
          currentDateString: currentDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server recovery mechanism failure.');
      }

      const recoveryResult = await response.json();

      const rawUpdatedTasks = Array.isArray(recoveryResult.updatedTasks) ? recoveryResult.updatedTasks : [];
      const newTasks: Task[] = rawUpdatedTasks.map((t: any, index: number) => {
        return {
          id: `rec-task-${targetGoal.id}-${index}-${Date.now()}`,
          goalId: targetGoal.id,
          title: t.title,
          estimatedHours: t.estimatedHours,
          priority: t.priority,
          completed: !!t.completed,
          scheduledDate: t.scheduledDate,
          isCritical: !!t.isCritical,
          notes: t.notes,
          energyLoad: t.energyLoad || 'medium'
        };
      });

      const updatedGoal: Goal = {
        ...targetGoal,
        availableHours: availableHoursRemaining,
        recoveryMessage: recoveryResult.recoveryMessage || 'Schedule re-allocated to match tight recovery limits.',
        lastRecoveredAt: currentDate,
        tasks: newTasks,
        driftProbability: Math.max(10, Math.round(targetGoal.driftProbability ? targetGoal.driftProbability * 0.4 : 15)),
        driftExplanation: "Timeline restructured. Drift risk successfully mitigated."
      };

      setGoals(prev => prev.map(g => g.id === targetGoal.id ? updatedGoal : g));
      triggerCelebration("Timeline stabilized. Excellent.", "100% capacity");
      logSessionEvent('triage_apply', 'Triage Applied', `Reallocated hours for "${targetGoal.title}" to ${availableHoursRemaining}h`, updatedGoal.recoveryMessage);
    } finally {
      setIsRecovering(false);
    }
  };

  const handlePanicRecover = async (targetGoal: Goal, reason: string) => {
    logSessionEvent('panic_trigger', 'Emergency Triage Engaged', `Started emergency recovery triage for "${targetGoal.title}"`, `Reason: "${reason}"`);
    const response = await fetch('/api/plan/panic-recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goal: targetGoal,
        reason,
        currentDateString: currentDate
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server panic recovery triage failure.');
    }

    return await response.json();
  };

  const handleApplyPanicRecovery = (goalId: string, updatedTasks: Task[], recoveryMessage: string, probability: number) => {
    let goalTitle = '';
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      goalTitle = g.title;

      const transformedTasks: Task[] = updatedTasks.map((t: any, index: number) => ({
        id: t.id || `rec-panic-${goalId}-${index}-${Date.now()}`,
        goalId: goalId,
        title: t.title,
        estimatedHours: t.estimatedHours || 1.5,
        priority: t.priority || 'medium',
        completed: !!t.completed,
        scheduledDate: t.scheduledDate,
        isCritical: !!t.isCritical,
        notes: t.notes || '',
        energyLoad: t.energyLoad || 'medium'
      }));

      return {
        ...g,
        recoveryMessage: recoveryMessage || 'Panic triage reconstruction applied.',
        lastRecoveredAt: currentDate,
        tasks: transformedTasks,
        driftProbability: Math.max(5, 100 - probability),
        driftExplanation: "Timeline reconstructed via panic recovery triage."
      };
    }));
    triggerCelebration("✓ Panic mode resolved. Emergency schedule generated.", "+12% rate");
    logSessionEvent('panic_apply', 'Emergency Triage Applied', `Reconstructed timeline for "${goalTitle}" (AI Success probability: ${probability}%)`, recoveryMessage);
  };

  const triggerConfetti = () => {
    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#D9FF57', '#57E389', '#F6C344', '#FF5A6C', '#3B82F6', '#8B5CF6'];
    const particles: any[] = [];

    // Create 150 particles
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height + 20,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        r: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // Gravity
        p.rotation += p.rotationSpeed;
        
        if (p.vy > 0) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0 && p.y < canvas.height + 20) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
          ctx.restore();
        }
      });

      if (active) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  };

  // Toggle tasks (recocalculates indices dynamically)
  const handleToggleTask = (taskId: string) => {
    let taskCompletedState = false;
    let taskTitle = '';
    let goalTitle = '';
    setGoals(prev => prev.map(g => {
      const target = g.tasks.find(t => t.id === taskId);
      if (!target) return g;
      taskCompletedState = !target.completed;
      taskTitle = target.title;
      goalTitle = g.title;

      const updatedTasks = g.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, completed: !t.completed, completedAt: !t.completed ? currentDate : undefined };
        }
        return t;
      });

      const total = updatedTasks.length;
      const completedCount = updatedTasks.filter(t => t.completed).length;
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      // Calculate new drift probability based on completed percentage
      const newDriftProb = Math.max(5, Math.round((1 - completedCount / total) * (g.driftProbability || 35)));

      return {
        ...g,
        tasks: updatedTasks,
        driftProbability: newDriftProb,
        dailyBriefing: g.dailyBriefing ? {
          ...g.dailyBriefing,
          recoveryProgress: pct,
          successProbability: Math.min(100, Math.max(10, 100 - newDriftProb))
        } : undefined
      };
    }));

    if (taskCompletedState) {
      triggerCelebration("✓ Nice recovery. Completion probability increased.", "+4% rate");
      triggerConfetti();
    }
    logSessionEvent('task_toggle', taskCompletedState ? 'Task Completed' : 'Task Incompleted', `${taskCompletedState ? 'Completed' : 'Reopened'} task "${taskTitle}" in project "${goalTitle}"`);
  };

  const handleAddCustomTask = (
    goalId: string,
    title: string,
    scheduledDate: string,
    estimatedHours: number,
    priority: 'high' | 'medium' | 'low',
    isCritical: boolean
  ) => {
    let goalTitle = '';
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      goalTitle = g.title;
      const newTask: Task = {
        id: `custom-task-${Date.now()}`,
        goalId: g.id,
        title,
        estimatedHours,
        priority,
        completed: false,
        scheduledDate,
        isCritical,
        notes: "Manually injected action item.",
        energyLoad: "medium"
      };
      return {
        ...g,
        tasks: [...g.tasks, newTask]
      };
    }));
    logSessionEvent('task_add', 'Task Added', `Added manual task "${title}" to project "${goalTitle}"`);
  };

  const handleDeleteGoal = (goalId: string) => {
    let goalTitle = '';
    setGoals(prev => {
      const target = prev.find(g => g.id === goalId);
      goalTitle = target ? target.title : 'Unknown';
      const filtered = prev.filter(g => g.id !== goalId);
      if (activeGoalId === goalId) {
        setActiveGoalId(filtered[0]?.id || null);
      }
      return filtered;
    });
    logSessionEvent('goal_delete', 'Project Deleted', `Deleted project "${goalTitle}"`);
  };

  // Simulated Time Incrementor: Obsverves tasks, increases drift and compounding time debt
  const incrementSimulatedDate = () => {
    const parts = currentDate.split('-');
    const current = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    current.setDate(current.getDate() + 1);

    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const newStr = `${yyyy}-${mm}-${dd}`;
    setCurrentDate(newStr);
    logSessionEvent('simulation_increment', 'Advanced Simulation Clock', `Simulation date advanced to ${newStr}`);

    // Dynamic AI reaction on date increment
    setGoals(prev => prev.map(g => {
      const tasks = g.tasks || [];
      const overdueTasks = tasks.filter(t => !t.completed && t.scheduledDate && new Date(t.scheduledDate) < current);
      if (overdueTasks.length > 0) {
        // Increase risk
        const newDrift = Math.min(95, (g.driftProbability || 15) + overdueTasks.length * 10);
        return {
          ...g,
          driftProbability: newDrift,
          aiAnalysis: `Timelines slipped! ${overdueTasks.length} tasks scheduled in the past are unfinished. Triage required.`,
          dailyBriefing: g.dailyBriefing ? {
            ...g.dailyBriefing,
            biggestRisk: "Overdue tasks scheduled in previous periods.",
            successProbability: Math.max(5, 100 - newDrift)
          } : undefined
        };
      }
      return g;
    }));
  };

  const resetSimulationDate = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setCurrentDate(todayStr);
    setGoals(getShiftedDemoGoals());
    logSessionEvent('simulation_reset', 'Simulation Time Reset', `Simulation time reset back to current date: ${todayStr}`);
  };

  // Render Landing View
  if (viewState === 'landing') {
    return (
      <>
        <div className="cursor-spotlight" />
        <LandingPage
          onStartRecovering={() => setViewState('onboarding')}
          onSeeDemo={handleLoadDemo}
          onGoToDashboard={() => { setViewState('app'); setActiveTab('dashboard'); }}
          hasGoals={goals.length > 0}
        />
      </>
    );
  }

  // Render Onboarding View
  if (viewState === 'onboarding') {
    return (
      <>
        <div className="cursor-spotlight" />
        <Onboarding onComplete={handleOnboardingComplete} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col font-sans selection:bg-accent-app selection:text-black animate-fade-in" id="oh-no-root">

      {/* GPU cursor overlay */}
      <div className="cursor-spotlight" />

      {/* Navigation Header */}
      <header className="border-b border-border-app bg-card-app/60 sticky top-0 z-50 backdrop-blur-md px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" id="global-header">
        <div className="flex items-center gap-6">
          {/* Logo return to landing */}
          <button
            onClick={() => setViewState('landing')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-text-primary flex items-center justify-center text-bg-app font-black text-sm">
              !
            </div>
            <span className="text-base font-extrabold tracking-tight">OhNo</span>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 text-xs font-mono text-text-secondary">
            <button onClick={() => setViewState('landing')} className="hover:text-text-primary transition-colors cursor-pointer">Home</button>
            <button onClick={() => { setViewState('app'); setActiveTab('dashboard'); }} className={`hover:text-text-primary transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'text-text-primary font-bold' : ''}`}>Dashboard</button>
            <button onClick={() => { setViewState('app'); setActiveTab('timeline'); }} className={`hover:text-text-primary transition-colors cursor-pointer ${activeTab === 'timeline' ? 'text-text-primary font-bold' : ''}`}>Projects</button>
            <button onClick={() => { setViewState('app'); setActiveTab('tasks'); }} className={`hover:text-text-primary transition-colors cursor-pointer ${activeTab === 'tasks' ? 'text-text-primary font-bold' : ''}`}>Tasks</button>
            <button
              onClick={() => {
                if (activeGoal) {
                  setViewState('app');
                  setActiveTab('workspace');
                } else {
                  alert("Please load the Demo or create a new Project first.");
                }
              }}
              className={`hover:text-text-primary transition-colors cursor-pointer ${activeTab === 'workspace' ? 'text-text-primary font-bold' : ''}`}
            >
              Workspace
            </button>
            <button onClick={() => { setViewState('app'); setActiveTab('settings'); }} className={`hover:text-text-primary transition-colors cursor-pointer ${activeTab === 'settings' ? 'text-text-primary font-bold' : ''}`}>Settings</button>
            <button onClick={handleLoadDemo} className="text-accent-app hover:opacity-80 transition-colors font-bold cursor-pointer">Demo</button>
            {currentUser && (
              <div className="flex items-center gap-3 border-l border-border-app/40 pl-3">
                <span className="text-text-primary/80 font-bold">
                  👤 {currentUser.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-[#FF5A6C] hover:opacity-80 transition-colors cursor-pointer font-bold font-mono"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Global theme controls & simulated clock */}
        <div className="flex items-center gap-3 self-end sm:self-auto" id="global-controls">

          {/* Spotlight Search Toggle */}
          <button
            onClick={() => setIsSpotlightOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-border-app bg-card-app text-xs font-mono text-text-secondary hover:text-text-primary flex items-center gap-1.5 cursor-pointer"
            title="Press / or Ctrl+K to search"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
            <kbd className="px-1 bg-bg-app border border-border-app rounded text-[9px]">/</kbd>
          </button>

          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="p-2 rounded-lg border border-border-app bg-card-app text-text-secondary hover:text-text-primary hover:bg-hover-app transition-colors cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Time simulation */}
          <div className="flex items-center gap-3 bg-card-app border border-border-app rounded-lg p-1.5" id="simulated-dashboard-time">
            <div className="text-right px-2">
              <span className="text-[9px] text-text-secondary block font-mono">SIMULATION TIME</span>
              <span className="text-xs font-mono font-bold">{currentDate}</span>
            </div>
            <div className="border-l border-border-app pl-2 flex items-center gap-1">
              <button
                onClick={incrementSimulatedDate}
                id="simulate-time-btn"
                className="px-2.5 py-1 text-[10px] font-mono bg-hover-app text-text-primary rounded border border-border-app hover:border-text-secondary transition-all cursor-pointer whitespace-nowrap"
              >
                +1 DAY
              </button>
              {currentDate !== new Date().toISOString().split('T')[0] && (
                <button
                  onClick={resetSimulationDate}
                  className="px-2 py-1 text-[10px] font-mono bg-text-primary/10 text-text-primary hover:bg-text-primary/20 rounded cursor-pointer"
                >
                  RESET
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Main Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8" id="main-grid-layout">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6 animate-page-slide">
            {/* Navigation Controls */}
            <div className="flex items-center justify-between bg-card-app p-1 rounded-lg border border-border-app" id="deck-tabs">
              <div className="flex gap-1 flex-1">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'dashboard'
                    ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  DAILY HUD
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'timeline'
                    ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  PROJECTS
                </button>
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'tasks'
                    ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  TASKS ({goals.flatMap(g => g.tasks).filter(t => !t.completed).length})
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'settings'
                    ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                    : 'text-text-secondary hover:text-text-primary'
                    }`}
                >
                  SETTINGS
                </button>
              </div>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="mr-1 px-4 py-2 text-xs font-mono font-bold bg-accent-app text-black rounded-lg hover:opacity-90 transition-all cursor-pointer"
              >
                + New Project
              </button>
            </div>

            <Dashboard
              goals={goals}
              activeGoal={activeGoal}
              onSelectGoal={(goal) => {
                setActiveGoalId(goal.id);
                setActiveTab('workspace'); // Open Single project workspace on click!
              }}
              metrics={metrics}
              currentDate={currentDate}
              isPanicMode={isPanicMode}
              sessionEvents={sessionEvents}
              onClearEvents={() => {
                setSessionEvents([]);
                localStorage.removeItem('oh_no_session_events');
              }}
              onOpenNewProject={() => setShowNewProjectModal(true)}
              onSetGoals={setGoals}
              logSessionEvent={logSessionEvent}
              onTriggerPanic={(goal) => {
                setPanicGoal(goal);
                setShowPanicModal(true);
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Mission Definition & Onboarding) */}
            <div className="lg:col-span-4 space-y-6" id="left-controls-column">
              <div className="bg-card-app border border-border-app rounded-xl p-5" id="landing-why-trust">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary font-mono">Why trust OhNo?</h3>
                <p className="text-xs text-text-primary mt-2 leading-relaxed">
                  Traditional productivity tools simply watch you drift towards failure. OhNo is designed to continuously simulate your timeline, explain why you are running out of time, and mutate your agenda to keep success possible.
                </p>
              </div>

              <GoalCreator
                onPlanGenerate={async (req) => {
                  await handlePlanGenerate(req);
                }}
                isLoading={isGenerating}
              />

              <div className="bg-card-app border border-border-app rounded-xl p-5" id="simulation-panel-onboard">
                <h3 className="text-xs font-bold text-text-secondary font-mono uppercase tracking-wider mb-2">Simulating Slippage</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Use the <strong>+1 DAY</strong> button above to simulate delays. Incomplete tasks scheduled in the past will activate <strong>Panic Mode</strong>, prompting you to trigger recovery triage.
                </p>
              </div>
            </div>

            {/* Right Column (AI status & Workspace Views) */}
            <div className="lg:col-span-8 space-y-6 animate-page-slide" id="right-view-column">
              {/* Navigation Controls */}
              {activeTab !== 'workspace' && (
                <div className="flex items-center justify-between bg-card-app p-1 rounded-lg border border-border-app" id="deck-tabs">
                  <div className="flex gap-1 flex-1">
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'dashboard'
                        ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      DAILY HUD
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('timeline');
                        setActiveGoalId(null); // Return to projects grid overview by default
                      }}
                      className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'timeline'
                        ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      PROJECTS
                    </button>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'tasks'
                        ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      TASKS ({goals.flatMap(g => g.tasks).filter(t => !t.completed).length})
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`flex-1 sm:flex-initial px-5 py-2 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${activeTab === 'settings'
                        ? 'bg-hover-app text-text-primary shadow-sm border border-border-app'
                        : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                      SETTINGS
                    </button>
                  </div>
                </div>
              )}

              {/* Schedule Panel / Pipeline */}
              {activeTab === 'timeline' && (
                <>
                  {activeGoal ? (
                    <div className="space-y-4 animate-page-slide">
                      <button
                        onClick={() => setActiveGoalId(null)}
                        className="px-3 py-1.5 bg-hover-app hover:bg-hover-app/80 border border-border-app text-text-primary rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        ← Back to Projects Overview
                      </button>
                      <SchedulePanel
                        goal={activeGoal}
                        onToggleTask={handleToggleTask}
                        onPlanRecover={handlePlanRecover}
                        onAddTask={handleAddCustomTask}
                        onDeleteGoal={handleDeleteGoal}
                        isRecovering={isRecovering}
                        currentDate={currentDate}
                        onTriggerPanic={(goal) => {
                          setPanicGoal(goal);
                          setShowPanicModal(true);
                        }}
                        isPanicMode={isPanicMode}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 animate-page-slide">
                      <div>
                        <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider font-mono">Survive Projects Dashboard</h2>
                        <p className="text-[10px] text-text-secondary mt-0.5 font-mono">// Active workload containers and deadline recovery metrics</p>
                      </div>

                      {goals.length === 0 ? (
                        <div className="bg-card-app border border-border-app rounded-xl p-16 text-center flex flex-col items-center justify-center min-h-[300px]">
                          <Compass className="w-10 h-10 text-text-secondary mb-4 stroke-1 animate-pulse" />
                          <h3 className="text-sm font-semibold text-text-primary">No Active Projects</h3>
                          <p className="text-xs text-text-secondary font-mono mt-2 max-w-sm">
                            Paste a syllabus in the Daily HUD or click "+ New Project" to initialize a survive pipeline.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {goals.map(g => {
                            const total = g.tasks.length;
                            const completed = g.tasks.filter(t => t.completed).length;
                            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                            const gatingPending = g.tasks.filter(t => t.isCritical && !t.completed).length;
                            const isOverdue = new Date(g.deadline) < new Date(currentDate) && completed < total;

                            // Estimate scenarios
                            const bestCaseProb = Math.min(100, Math.max(10, 100 - (g.driftProbability || 35)));
                            const worstCaseProb = Math.max(5, Math.round((bestCaseProb) * 0.4));

                            return (
                              <div key={g.id} className="bg-card-app border border-border-app hover:border-text-primary rounded-xl p-6 flex flex-col justify-between space-y-4 shadow transition-all duration-200 group">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-0.5">
                                      <span className="text-[9px] font-mono text-text-secondary uppercase">{g.category}</span>
                                      <h3 className="text-sm font-bold text-text-primary group-hover:text-accent-app transition-colors font-mono">{g.title}</h3>
                                    </div>
                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                                      isOverdue ? 'bg-[#FF5A6C]/10 text-[#FF5A6C] border border-[#FF5A6C]/20' : 'bg-hover-app text-text-secondary'
                                    }`}>
                                      {isOverdue ? '⚠️ OVERDUE' : `DUE ${g.deadline}`}
                                    </span>
                                  </div>

                                  {/* Progress bar */}
                                  <div className="space-y-1 pt-1">
                                    <div className="flex justify-between text-[10px] font-mono text-text-secondary">
                                      <span>Progress</span>
                                      <span>{completed}/{total} Tasks ({progress}%)</span>
                                    </div>
                                    <div className="w-full bg-border-app/25 h-2 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-success-app' : 'bg-accent-app'}`}
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Gating Tasks Indicator */}
                                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-border-app/20 pt-2.5">
                                    <span className="text-text-secondary">Gating Tasks:</span>
                                    <span className={gatingPending > 0 ? 'text-[#FF5A6C] font-bold' : 'text-success-app font-bold'}>
                                      {gatingPending > 0 ? `⚠️ ${gatingPending} Blockers` : '✓ 0 Pending'}
                                    </span>
                                  </div>

                                  {/* Best/Worst Scenario Quick Preview */}
                                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono pt-2 border-t border-border-app/20">
                                    <div className="bg-success-app/5 p-1.5 rounded border border-success-app/10">
                                      <span className="text-success-app font-bold block">BEST CASE</span>
                                      <span className="text-text-secondary">{bestCaseProb}% Success</span>
                                    </div>
                                    <div className="bg-[#FF5A6C]/5 p-1.5 rounded border border-[#FF5A6C]/10">
                                      <span className="text-[#FF5A6C] font-bold block">WORST CASE</span>
                                      <span className="text-text-secondary">{worstCaseProb}% Success</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                  <button
                                    onClick={() => {
                                      setActiveGoalId(g.id);
                                    }}
                                    className="flex-1 py-2 bg-hover-app hover:bg-hover-app/80 text-text-primary border border-border-app rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-center"
                                  >
                                    Pipeline Agenda
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveGoalId(g.id);
                                      setActiveTab('workspace');
                                    }}
                                    className="flex-1 py-2 bg-text-primary text-bg-app rounded-lg text-xs font-mono font-bold hover:opacity-90 transition-all cursor-pointer text-center"
                                  >
                                    Workspace
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Tasks Tab Panel */}
              {activeTab === 'tasks' && (
                <TasksPanel
                  goals={goals}
                  currentDate={currentDate}
                  onToggleTask={handleToggleTask}
                />
              )}

              {/* Immersive Workspace */}
              {activeTab === 'workspace' && activeGoal && (
                <ProjectWorkspace
                  goal={activeGoal}
                  currentDate={currentDate}
                  onToggleTask={handleToggleTask}
                  onPlanRecover={handlePlanRecover}
                  onTriggerPanic={() => {
                    setPanicGoal(activeGoal);
                    setShowPanicModal(true);
                  }}
                  onClose={() => setActiveTab('dashboard')}
                  isPanicMode={isPanicMode}
                />
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="bg-card-app border border-border-app rounded-xl p-6 space-y-6" id="settings-tab">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">System Settings</h3>
                    <p className="text-xs text-text-secondary mt-1">Configure workspace variables and simulation nodes.</p>
                  </div>
                  <div className="space-y-4 font-mono text-xs text-text-primary">
                    <div className="flex justify-between items-center py-2 border-b border-border-app/40">
                      <span>Current date:</span>
                      <span className="font-bold">{currentDate}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border-app/40">
                      <span>Compounding Time Debt rate:</span>
                      <span className="font-bold">15% daily interest</span>
                    </div>
                    <div className="flex gap-4 pt-2">
                      <button
                        onClick={() => setIsLightMode(!isLightMode)}
                        className="px-4 py-2 bg-bg-app border border-border-app rounded-lg hover:border-text-primary"
                      >
                        Toggle Light Mode
                      </button>
                      <button
                        onClick={resetSimulationDate}
                        className="px-4 py-2 bg-[#FF5A6C]/10 text-[#FF5A6C] rounded-lg hover:bg-[#FF5A6C]/25"
                      >
                        Reset databases
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Goal Creator Modal Popup */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 bg-[#0F1012]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-app border border-border-app rounded-xl w-full max-w-md p-6 relative overflow-hidden flex flex-col">
            <button
              onClick={() => setShowNewProjectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border-app hover:bg-hover-app transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <GoalCreator
              onPlanGenerate={async (req) => {
                await handlePlanGenerate(req);
                setShowNewProjectModal(false);
              }}
              isLoading={isGenerating}
            />
          </div>
        </div>
      )}

      {/* Global Panic Recovery Modal Overlay */}
      {showPanicModal && panicGoal && (
        <div className="fixed inset-0 z-50 bg-[#0F1012]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card-app border border-border-app rounded-xl w-full max-w-xl p-6 relative overflow-hidden flex flex-col max-h-[90vh] animate-page-slide">
            
            <button
              onClick={() => {
                setShowPanicModal(false);
                setPanicStep('input');
                setPanicTriageResult(null);
                setPanicReason('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg border border-border-app hover:bg-hover-app transition-colors text-text-secondary hover:text-text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Step 1: Gather Reason */}
            {panicStep === 'input' && (
              <div className="space-y-5 flex-1 overflow-y-auto">
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight font-mono">Panic recovery triage</h3>
                  <p className="text-xs text-text-secondary mt-1 font-mono">Select a scenario or describe the timelines delay below.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["I wasted today.", "I overslept.", "I couldn't study.", "I underestimated this assignment.", "I forgot."].map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setPanicReason(ex)}
                      className="px-3.5 py-1.5 text-xs font-mono border border-border-app bg-bg-app hover:border-text-primary text-text-primary rounded-lg cursor-pointer transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-text-secondary font-medium font-mono">Triage logs details</label>
                  <textarea
                    value={panicReason}
                    onChange={(e) => setPanicReason(e.target.value)}
                    placeholder="Describe how the week slipped..."
                    className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg p-3 text-xs text-text-primary outline-none transition-all h-24 resize-none font-mono"
                  />
                </div>

                {panicError && <div className="text-xs text-danger-app font-mono">{panicError}</div>}

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    onClick={() => handlePanicSubmit(panicReason)}
                    disabled={!panicReason.trim()}
                    className="px-4 py-2.5 text-xs font-mono font-bold bg-[#FF5A6C] text-white rounded-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Engage Triage
                  </button>
                </div>
              </div>
            )}

            {/* Modal Step 2: Simulation Terminal */}
            {panicStep === 'simulating' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <RefreshCw className="w-6 h-6 text-text-primary animate-spin" />
                <div className="text-center space-y-2">
                  <h4 className="text-xs font-bold text-text-primary font-mono tracking-wider animate-pulse">TRIAGE COMPILING</h4>
                  <div className="w-64 bg-bg-app border border-border-app p-3 rounded-lg text-left font-mono text-[9px] text-text-secondary h-28 overflow-y-auto space-y-1">
                    {simulationLogs.map((log, idx) => (
                      <div key={idx} className="truncate">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Step 3: Triage Results Preview */}
            {panicStep === 'result' && panicTriageResult && (
              <div className="space-y-5 flex-1 overflow-y-auto pr-1">
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight font-mono">AI Reconstruction Preview</h3>
                  <p className="text-xs text-text-secondary mt-1 font-mono">Review the mutations proposed by the triage engine.</p>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-bg-app border border-border-app rounded-xl text-center">
                    <span className="text-[9px] text-text-secondary font-mono block">TIME SAVED</span>
                    <span className="text-xs font-bold text-[#57E389] font-mono mt-1 block">-{panicTriageResult.timeSaved || 0}h</span>
                  </div>
                  <div className="p-3 bg-bg-app border border-border-app rounded-xl text-center">
                    <span className="text-[9px] text-text-secondary font-mono block">PROBABILITY</span>
                    <span className="text-xs font-bold text-text-primary font-mono mt-1 block">{panicTriageResult.recoveryProbability || 100}%</span>
                  </div>
                  <div className="p-3 bg-bg-app border border-border-app rounded-xl text-center">
                    <span className="text-[9px] text-text-secondary font-mono block">IMPACT LEVEL</span>
                    <span className="text-xs font-bold text-[#F6C344] font-mono mt-1 block uppercase font-mono">Optimized</span>
                  </div>
                </div>

                {/* GPA Impact */}
                <div className="p-3 bg-bg-app border border-border-app rounded-xl text-xs space-y-1">
                  <span className="text-[9px] font-mono text-text-secondary uppercase">Estimated Impact Statement</span>
                  <p className="text-text-primary italic leading-relaxed font-mono">
                    "{panicTriageResult.gpaWorkImpact || 'Agenda mutated to ensure stabilization.'}"
                  </p>
                </div>

                {/* Proposed Mutations */}
                <div className="space-y-3 pt-2">
                  {/* Removes */}
                  {panicTriageResult.tasksToRemove?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono text-danger-app uppercase font-bold">Tasks to Remove</span>
                      <div className="space-y-1">
                        {panicTriageResult.tasksToRemove.map((t: string, i: number) => (
                          <div key={i} className="text-xs text-text-secondary flex items-center gap-1.5 font-mono">
                            <span className="line-through truncate">- {t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compressions */}
                  {panicTriageResult.tasksToCompress?.length > 0 && (
                    <div className="space-y-1.5 border-t border-border-app/20 pt-2.5">
                      <span className="text-[9px] font-mono text-warning-app uppercase font-bold">Tasks to Compress</span>
                      <div className="space-y-1.5">
                        {panicTriageResult.tasksToCompress.map((c: any, i: number) => (
                          <div key={i} className="text-xs text-text-primary flex justify-between items-center gap-2 font-mono">
                            <span className="truncate">{c.title}</span>
                            <span className="text-[10px] text-text-secondary shrink-0">{c.originalHours}h → <strong className="text-[#57E389]">{c.newHours}h</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Postponed */}
                  {panicTriageResult.tasksToPostpone?.length > 0 && (
                    <div className="space-y-1.5 border-t border-border-app/20 pt-2.5">
                      <span className="text-[9px] font-mono text-text-primary uppercase font-bold">Tasks to Postpone</span>
                      <div className="space-y-1.5">
                        {panicTriageResult.tasksToPostpone.map((p: any, i: number) => (
                          <div key={i} className="text-xs text-text-primary flex justify-between items-center gap-2 font-mono">
                            <span className="truncate">{p.title}</span>
                            <span className="text-[10px] text-[#FF5A6C] shrink-0">{p.originalDate} → <strong className="text-text-primary">{p.newDate}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-border-app/20 font-mono">
                  <button
                    onClick={() => {
                      setShowPanicModal(false);
                      setPanicStep('input');
                      setPanicTriageResult(null);
                      setPanicReason('');
                    }}
                    className="px-4 py-2.5 text-xs bg-bg-app border border-border-app text-text-primary rounded-lg cursor-pointer hover:border-text-secondary"
                  >
                    Abort
                  </button>
                  <button
                    onClick={handleApplyPanic}
                    className="px-5 py-2.5 text-xs font-bold bg-[#D9FF57] text-black rounded-lg cursor-pointer transition-all hover:opacity-90"
                  >
                    Confirm Reconstruction
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Floating Product Tour */}
      <div className="fixed bottom-6 right-6 z-40">
        {tourStep === 0 ? (
          <button
            onClick={() => setTourStep(1)}
            className="p-3 bg-accent-app text-black rounded-full shadow-lg shadow-black/40 font-mono font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:opacity-95"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Tour</span>
          </button>
        ) : (
          <div className="bg-card-app border border-border-app rounded-xl p-5 shadow-2xl w-80 space-y-3 font-sans animate-page-slide">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-text-secondary uppercase">System Walkthrough {tourStep}/5</span>
              <button onClick={() => setTourStep(0)} className="text-text-secondary hover:text-text-primary"><X className="w-3.5 h-3.5" /></button>
            </div>
            {tourStep === 1 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-accent-app">1. What is OhNo?</h4>
                <p className="text-xs text-text-primary leading-relaxed">
                  OhNo is a <strong>Deadline Recovery OS</strong>. Instead of just showing when tasks are due, it continuously simulates your timeline, warning you when your remaining hours don't fit the work.
                </p>
              </div>
            )}
            {tourStep === 2 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-accent-app">2. Daily HUD (Dashboard)</h4>
                <p className="text-xs text-text-primary leading-relaxed">
                  The dashboard displays your <strong>Productivity Score</strong>, remaining work hours, and critical gating tasks. If overdue tasks pile up, the engine triggers a panic alert.
                </p>
              </div>
            )}
            {tourStep === 3 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-accent-app">3. Timeline & Critical Gates</h4>
                <p className="text-xs text-text-primary leading-relaxed">
                  Under Projects, check off tasks day-by-day. Pay close attention to tasks marked <strong>*GATING</strong>; these are critical path items that directly affect your drift probability if missed.
                </p>
              </div>
            )}
            {tourStep === 4 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-accent-app">4. What-if Simulation</h4>
                <p className="text-xs text-text-primary leading-relaxed">
                  Unsure how to handle a delay? Use the <strong>What-if Simulator</strong> to preview the risk level and delay debt of different options (e.g. Skip Work, Scope Cuts, or Crunch Mode).
                </p>
              </div>
            )}
            {tourStep === 5 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-accent-app">5. Panic Recovery Triage</h4>
                <p className="text-xs text-text-primary leading-relaxed">
                  If a day slips, click <strong>I messed up</strong>. The AI triage engine will dynamically compress task hours, postpone non-critical items, or prune low-leverage steps to rebuild a path to success.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-1 font-mono text-[10px]">
              {tourStep > 1 && <button onClick={() => setTourStep(prev => prev - 1)} className="text-text-secondary hover:text-text-primary">Back</button>}
              {tourStep < 5 ? (
                <button onClick={() => setTourStep(prev => prev + 1)} className="text-accent-app font-bold">Next</button>
              ) : (
                <button onClick={() => setTourStep(0)} className="text-accent-app font-bold">Finish</button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Spotlight Menu */}
      <Spotlight
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        goals={goals}
        onSelectGoal={(goal) => {
          setActiveGoalId(goal.id);
          setActiveTab('workspace'); // Switch to project workspace detail view!
        }}
        onTriggerPanic={() => {
          // Open panic modal via active goal
          if (activeGoal) {
            // We open Spotlight, but then we want to launch the panic recovery dialog. Let's toggle the modal inside SchedulePanel.
            setActiveTab('timeline');
            // Selectively trigger panic modal: we can open it from schedule view.
          } else {
            alert("Please create or select a project timeline first.");
          }
        }}
        onTriggerSimulateDay={incrementSimulatedDate}
        onTriggerThemeToggle={() => setIsLightMode(!isLightMode)}
        onTriggerDemo={handleLoadDemo}
        onNavigate={(tab) => {
          setActiveTab(tab);
        }}
      />

      {/* Guided Walkthrough Demo mode narrator card */}
      {demoStep > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#18191D] border border-accent-app/40 px-6 py-4 rounded-xl shadow-2xl w-[90%] max-w-md space-y-3 animate-page-slide text-xs font-mono">
          <div className="flex justify-between items-center text-[10px] text-accent-app font-bold">
            <span>OHNO TOUR CO-PILOT ({demoStep}/4)</span>
            <button onClick={() => setDemoStep(0)} className="text-text-secondary hover:text-text-primary">SKIP</button>
          </div>
          <p className="text-text-primary text-[11px] leading-relaxed">
            {demoStep === 1 && "Alex has five major commitments loaded on our AI Operating System dashboard."}
            {demoStep === 2 && "Notice that the calendar heatmap blocks and weekly stress forecast are colored by daily workload. Friday/Saturday crunch windows are overloaded."}
            {demoStep === 3 && "Current completion probability (Triage Health Ring) is only 74%, and AI confidence is dynamically balanced."}
            {demoStep === 4 && "Let's see what happens if Alex procrastinates. Click '+1 DAY' in simulation controls to simulate timeline compression."}
          </p>
          <div className="flex justify-end gap-2 pt-1">
            {demoStep > 1 && (
              <button
                onClick={() => setDemoStep(prev => prev - 1)}
                className="px-2 py-1 text-[9px] bg-bg-app border border-border-app text-text-secondary rounded cursor-pointer"
              >
                Back
              </button>
            )}
            {demoStep < 4 ? (
              <button
                onClick={() => setDemoStep(prev => prev + 1)}
                className="px-2.5 py-1 text-[9px] bg-accent-app text-black font-bold rounded hover:opacity-90 cursor-pointer"
              >
                Next
              </button>
            ) : (
              <button
                onClick={() => {
                  incrementSimulatedDate();
                  setDemoStep(0);
                }}
                className="px-2.5 py-1 text-[9px] bg-accent-app text-black font-bold rounded hover:opacity-90 cursor-pointer"
              >
                Simulate +1 Day
              </button>
            )}
          </div>
        </div>
      )}

      {/* Celebration Notification Toast */}
      {celebration && (
        <div className="fixed top-20 right-6 z-50 bg-[#18191D] border border-success-app/40 px-4 py-3 rounded-lg shadow-xl animate-bounce-slow flex items-center gap-3 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-success-app animate-ping" />
          <div className="space-y-0.5">
            <span className="text-text-primary font-bold block">{celebration.message}</span>
            {celebration.diff && <span className="text-success-app text-[10px]">{celebration.diff}</span>}
          </div>
        </div>
      )}

      {/* Confetti Particle Canvas overlay */}
      <canvas id="confetti-canvas" className="pointer-events-none fixed inset-0 z-[9999] w-full h-full" />

      {/* Footer */}
      <footer className="border-t border-border-app bg-card-app py-6 text-center text-[10px] text-text-secondary font-mono" id="main-footer">
        OHNO DECISION ENGINE • BUNDLED 2026 PLATFORM • ALL SIMULATION NODES ACTIVE
      </footer>
    </div>
  );
}
