/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';
export type ComplexityLevel = 'low' | 'medium' | 'high';
export type TaskPriority = 'high' | 'medium' | 'low';
export type EnergyLoad = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  goalId: string;
  title: string;
  estimatedHours: number;
  priority: TaskPriority;
  completed: boolean;
  completedAt?: string;
  scheduledDate: string; // YYYY-MM-DD
  isCritical: boolean;
  originalScheduledDate?: string;
  notes?: string;
  energyLoad?: EnergyLoad; // Energy-aware load tags (⚡/🧠)
}

export interface Scenario {
  name: string;
  outcome: string;
  riskImpact: string;
  delayDebt: number;
}

export interface DailyBriefing {
  biggestRisk: string;
  objective: string;
  recoveryProgress: number;
  successProbability: number;
}

export interface Goal {
  id: string;
  title: string;
  category: 'assignment' | 'project' | 'exam' | 'interview' | 'other';
  deadline: string; // YYYY-MM-DD
  estimatedHours: number; // total effort estimated by user
  availableHours: number; // total hours they actually have available until deadline
  urgency: UrgencyLevel;
  complexity: ComplexityLevel;
  aiAnalysis: string;
  createdAt: string;
  tasks: Task[];
  recoveryMessage?: string;
  lastRecoveredAt?: string;
  
  // AI Decision Engine Extended Fields
  driftProbability?: number; // Drift Predictor confidence %
  driftExplanation?: string; // Drift Predictor rationale
  timeDebt?: number; // Accumulated delay in hours
  interestRate?: number; // Delay compounding rate (e.g. 0.15)
  academicImpact?: string; // Consequence Engine output
  focusWindows?: string[]; // Recommended peak periods
  scenarios?: Scenario[]; // What-if scenarios
  dailyBriefing?: DailyBriefing; // Morning summaries
}

export interface PlanGenerationRequest {
  title: string;
  category: 'assignment' | 'project' | 'exam' | 'interview' | 'other';
  deadline: string; // YYYY-MM-DD
  availableHours: number;
  currentDateString?: string;
}

export interface PlanRecoveryRequest {
  goal: Goal;
  availableHoursRemaining: number;
  currentDateString?: string;
}

export interface ProductivitySummary {
  totalTasks: number;
  completedTasks: number;
  completionRate: number; // percentage
  remainingHours: number;
  criticalTasksCount: number;
  criticalTasksCompleted: number;
  productivityScore: number; // calculated score out of 100
  onTrackAlert: 'on-track' | 'warning' | 'panic-alert';
}

export interface SessionEvent {
  id: string;
  timestamp: string;
  type: 'task_toggle' | 'task_add' | 'triage_apply' | 'panic_trigger' | 'panic_apply' | 'goal_add' | 'goal_delete' | 'simulation_increment' | 'simulation_reset';
  title: string;
  description: string;
  details?: string;
}

