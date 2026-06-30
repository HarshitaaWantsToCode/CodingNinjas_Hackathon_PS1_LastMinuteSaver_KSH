/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlanGenerationRequest } from '../types';

interface GoalCreatorProps {
  onPlanGenerate: (request: PlanGenerationRequest) => Promise<void>;
  isLoading: boolean;
}

export default function GoalCreator({ onPlanGenerate, isLoading }: GoalCreatorProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'assignment' | 'project' | 'exam' | 'interview' | 'other'>('assignment');
  const [deadline, setDeadline] = useState('');
  const [availableHours, setAvailableHours] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const today = new Date();
    const defaultDate = new Date(today);
    defaultDate.setDate(today.getDate() + 5);
    setDeadline(defaultDate.toISOString().split('T')[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a project or objective title.');
      return;
    }

    if (!deadline) {
      setError('Please specify a deadline date.');
      return;
    }

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (new Date(deadline) < todayDate) {
      setError('Deadline cannot be in the past.');
      return;
    }

    if (availableHours <= 0) {
      setError('Please allocate a non-zero hour balance.');
      return;
    }

    try {
      await onPlanGenerate({
        title: title.trim(),
        category,
        deadline,
        availableHours,
        currentDateString: new Date().toISOString().split('T')[0],
      });
      setTitle('');
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    }
  };

  return (
    <div className="bg-card-app border border-border-app rounded-xl p-6" id="goal-creator-card">
      <div className="mb-6">
        <h2 className="text-sm font-bold text-text-primary tracking-tight">New target</h2>
        <p className="text-xs text-text-secondary mt-1">Configure your parameters to initialize scheduling.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" id="goal-creator-form">
        {error && (
          <div className="p-3 bg-danger-app/5 border border-danger-app/10 rounded-lg text-xs text-danger-app" id="goal-creator-error">
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-text-secondary font-medium">Objective title</label>
          <input
            type="text"
            id="goal-input-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Build hackathon prototype"
            className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-secondary outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-text-secondary font-medium">Category</label>
          <select
            id="goal-input-category"
            value={category}
            onChange={(e: any) => setCategory(e.target.value)}
            disabled={isLoading}
            className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg px-3 py-2 text-xs text-text-primary outline-none transition-all appearance-none"
          >
            <option value="assignment">Assignment</option>
            <option value="project">Project / Hackathon</option>
            <option value="exam">Exam Prep</option>
            <option value="interview">Interview prep</option>
            <option value="other">General Task</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Deadline</label>
            <input
              type="date"
              id="goal-input-deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={isLoading}
              className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg px-3 py-2 text-xs text-text-primary outline-none transition-all font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-medium">Hour budget</label>
            <div className="relative">
              <input
                type="number"
                id="goal-input-hours"
                min="1"
                max="120"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
                className="w-full bg-bg-app border border-border-app focus:border-text-primary rounded-lg pl-3 pr-8 py-2 text-xs text-text-primary outline-none transition-all font-mono"
              />
              <span className="absolute right-3 top-2 text-[10px] text-text-secondary font-mono">h</span>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            id="btn-generate-plan"
            disabled={isLoading || !title.trim()}
            className="w-full bg-accent-app hover:opacity-90 text-black text-xs font-mono font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin inline-block" />
                <span>Simulating...</span>
              </>
            ) : (
              <span>Generate Master Agenda</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
