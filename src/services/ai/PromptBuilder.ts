/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class PromptBuilder {
  static buildGeneratePrompt(title: string, category: string, deadline: string, availableHours: number, today: string): string {
    return `Generate a master plan for the goal: "${title}"
Category: "${category}"
Deadline: ${deadline}
Available study/work hours in total: ${availableHours} hours
Current Sandbox Date: ${today}

Your response must be a valid JSON object matching the following instructions:
1. Schedule daily tasks between ${today} and ${deadline}.
2. Ensure tasks have: title, estimatedHours, priority ('high'|'medium'|'low'), scheduledDate (YYYY-MM-DD), isCritical (boolean), notes (actionable advice), completed (false), and energyLoad ('high'|'medium'|'low').
3. Include:
   - "urgency": "critical" | "high" | "medium" | "low"
   - "complexity": "high" | "medium" | "low"
   - "aiAnalysis": a 1-2 sentence overview of potential issues or study advice
   - "driftProbability": a number from 0 to 100 representing the risk of failing to meet the deadline
   - "driftExplanation": brief reasoning for the drift risk
   - "academicImpact": explanation of academic/professional consequences of failure
   - "focusWindows": array of recommended daily focus blocks (e.g. "09:00 - 11:30 Deep Focus")
   - "dailyBriefing": object containing:
       * "biggestRisk": the main threat to completion
       * "objective": today's main goal
       * "recoveryProgress": number (usually 100 representing initial trajectory)
       * "successProbability": number from 0 to 100
   - "scenarios": array of 3 what-if scenarios (e.g. "Skip Today's Work", "Scope Reduction", "Crunch Mode"), each containing:
       * "name": scenario title
       * "outcome": detail of what happens
       * "riskImpact": description of risk change
       * "delayDebt": number representing additional delayed hours (debt) incurred (can be negative if saving time)
4. Do NOT output markdown ticks (e.g. \`\`\`json). Output raw, parseable JSON text only.`;
  }

  static buildRecoverPrompt(goalTitle: string, category: string, deadline: string, availableHoursRemaining: number, today: string, tasks: any[]): string {
    return `Mutate the remaining timeline for: "${goalTitle}"
Category: "${category}"
Deadline: ${deadline}
Revised hours budget: ${availableHoursRemaining}
Current Sandbox Date: ${today}
Existing tasks: ${JSON.stringify(tasks)}

Your response must be a valid JSON object matching the following instructions:
1. Reschedule and optimize remaining incomplete tasks so that they fit within the new ${availableHoursRemaining} hours budget between ${today} and ${deadline}.
2. Return an object containing:
   - "recoveryMessage": a 1-2 sentence coaching brief detailing the timeline change
   - "updatedTasks": array of tasks, preserving completed ones, but modifying dates, notes, and estimating hours for incomplete ones to fit the revised hours.
3. Output raw JSON text only.`;
  }

  static buildPanicPrompt(goalTitle: string, category: string, deadline: string, reason: string, today: string, tasks: any[]): string {
    return `Perform emergency triage reconstruction for: "${goalTitle}"
Category: "${category}"
Deadline: ${deadline}
Current Sandbox Date: ${today}
Reason for failure: "${reason}"
Existing tasks: ${JSON.stringify(tasks)}

Your response must be a valid JSON object matching the following instructions:
1. Perform surgical triage:
   - Identify low-value tasks to completely remove (discard). Return titles in "tasksToRemove".
   - Identify tasks to compress (reduce estimated hours). Return objects in "tasksToCompress" (title, originalHours, newHours).
   - Identify tasks to postpone to future dates. Return objects in "tasksToPostpone" (title, originalDate, newDate).
   - Rebuild the complete updated tasks list in "updatedTasks" scheduled between ${today} and ${deadline}.
2. Return an object containing:
   - "recoveryMessage": coaching message regarding the panic recovery
   - "recoveryProbability": success confidence percentage (0-100)
   - "gpaWorkImpact": text describing the academic or work outcome impact
   - "timeSaved": number representing total hours saved by removals and compressions
   - "tasksToRemove": array of strings
   - "tasksToCompress": array of { title, originalHours, newHours }
   - "tasksToPostpone": array of { title, originalDate, newDate }
   - "updatedTasks": array of updated tasks
3. Output raw JSON text only.`;
  }

  static buildParseSchedulePrompt(scheduleText: string, today: string, dailyHours: number): string {
    return `You are OhNo, an elite AI scheduling assistant.
Your task is to parse the following text-based timetable, deadlines, or exams, and structure them into distinct project pipelines (goals).

Raw text to parse:
"""
${scheduleText}
"""

Current Sandbox Date: ${today}
Default daily study/work hours limit: ${dailyHours} hours/day

Instructions:
1. Identify all distinct subjects/courses, tasks, assignments, exams, or projects mentioned in the text.
2. Group them by subject/project into separate goals.
3. For each goal:
   - "title": Title of the goal/subject (e.g. "Biology Midterm Prep")
   - "category": assignment | project | exam | interview | other
   - "deadline": The deadline date formatted as YYYY-MM-DD. If year is missing or ambiguous, assume year 2026.
   - "availableHours": Calculate this dynamically by multiplying the number of days remaining until the deadline by the daily limit of ${dailyHours} hours.
   - "tasks": A list of daily action items scheduled between ${today} and the deadline to complete this goal.
     - Each task must have: title, estimatedHours (e.g. 1 to 4 hours), priority ('high'|'medium'|'low'), scheduledDate (YYYY-MM-DD), isCritical (boolean), completed (false), notes (contextual advice), and energyLoad ('high'|'medium'|'low').
4. If the input text is extremely ambiguous, does not contain any recognizable dates/deadlines, or has major missing parameters (e.g. you cannot determine a deadline at all), you can set "needsClarification": true and provide a list of clarifying questions in "questions" (each question should have "id", "question", and "type": "date"|"number"|"text").
5. Output a valid JSON object matching the following structure:
{
  "needsClarification": false,
  "questions": [],
  "parsedGoals": [
    {
      "title": "...",
      "category": "...",
      "deadline": "YYYY-MM-DD",
      "availableHours": 15,
      "tasks": [
        {
          "title": "...",
          "estimatedHours": 2,
          "priority": "medium",
          "completed": false,
          "scheduledDate": "YYYY-MM-DD",
          "isCritical": false,
          "notes": "...",
          "energyLoad": "medium"
        }
      ]
    }
  ]
}

Ensure all dates are strictly after or on ${today} and before or on the deadline. Output raw, parseable JSON text only. Do NOT output markdown ticks.`;
  }
  static buildBriefingPrompt(goals: any[], today: string): string {
    return `You are a brutal but encouraging productivity co-pilot named OhNo.
Generate a morning briefing based on the user's active goals and time debt.

Active Goals and Tasks context:
${JSON.stringify(goals)}

Current Date: ${today}

Instructions:
1. Write a 3-sentence daily morning briefing.
2. Name the single biggest risk to the deadline trajectory and recommend exactly one high-impact action to execute today.
3. Be direct, coaching, and analytical.
4. Output raw briefing text only. Do NOT wrap in markdown ticks or anything else. Just plain text.`;
  }

  static buildTriageDeckPrompt(goal: any, today: string): string {
    return `You are OhNo, the AI deadline recovery teammate.
Develop a 3-step action recovery plan for the project: "${goal.title}"
Category: "${goal.category}"
Deadline: ${goal.deadline}
Remaining task load details: ${JSON.stringify(goal.tasks)}

Current Date: ${today}

Your response must be a valid JSON object matching this structure:
{
  "message": "A coaching intro sentence about the recovery directive.",
  "steps": [
    {
      "title": "Actionable task title",
      "hours": 1.5,
      "notes": "Short description of what to do/reduce."
    }
  ]
}

Ensure there are exactly 3 steps. Output raw JSON text only. Do NOT output markdown ticks.`;
  }

  static buildGCalSyncPrompt(tasks: any[], today: string): string {
    return `You are OhNo, the AI deadline recovery teammate.
You have access to Google Calendar API tools.
Select the highest priority tasks that should be scheduled on Google Calendar starting from ${today}.

Tasks: ${JSON.stringify(tasks)}

Your response must be a valid JSON object showing the tool calls you will execute:
{
  "toolCalls": [
    {
      "method": "Calendar.createEvent",
      "summary": "Focus: Task Title",
      "start": "YYYY-MM-DDT09:00:00",
      "end": "YYYY-MM-DDT11:30:00"
    }
  ],
  "confirmation": "1-sentence summary confirming that the study sessions have been synced successfully to Google Calendar."
}

Output raw JSON text only. Do NOT output markdown ticks.`;
  }
}
