/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { hybridAI } from "./src/services/ai/HybridAIProvider";
import { PromptBuilder } from "./src/services/ai/PromptBuilder";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Latency tracker helper
let lastInferenceLatency = 0;

// Helper to clean JSON markdown wrappers
function sanitizeJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "");
    cleaned = cleaned.replace(/\n```$/, "");
  }
  return cleaned.trim();
}

// ---------------------------------------------------------
// GET /api/health
// ---------------------------------------------------------
app.get("/api/health", async (req, res) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const llamaLoaded = hybridAI.isLlamaReady();
  const mem = process.memoryUsage();

  return res.json({
    Gemini: geminiAvailable ? "Available" : "Unavailable",
    "Local Llama": llamaLoaded ? "Loaded" : "Not Loaded",
    "Hybrid Mode": (geminiAvailable && llamaLoaded) ? "Enabled" : "Disabled",
    "Model Name": "Llama-3-Maal-8B",
    "Inference latency": `${lastInferenceLatency}ms`,
    "Memory usage": {
      heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`,
      heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`
    }
  });
});

// ---------------------------------------------------------
// POST /api/plan/generate
// ---------------------------------------------------------
app.post("/api/plan/generate", async (req, res) => {
  const { title, category, deadline, availableHours, currentDateString } = req.body;

  if (!title || !category || !deadline || !availableHours) {
    return res.status(400).json({ error: "Missing required fields: title, category, deadline, availableHours" });
  }

  const today = currentDateString || "2026-06-23";
  const prompt = PromptBuilder.buildGeneratePrompt(title, category, deadline, availableHours, today);
  const systemInstruction = "You are OhNo, an elite AI Deadline Recovery teammate and high-performance coach. Formulate master plans of daily tasks. Predict drift, consequences, windows, scenarios, and briefing details in JSON.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    const cleanedText = sanitizeJsonString(aiResponse.text);
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Hybrid AI Generation Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to compile plan trajectory." });
  }
});

// ---------------------------------------------------------
// POST /api/plan/recover
// ---------------------------------------------------------
app.post("/api/plan/recover", async (req, res) => {
  const { goal, availableHoursRemaining, currentDateString } = req.body;

  if (!goal || availableHoursRemaining === undefined) {
    return res.status(400).json({ error: "Missing required fields: goal, availableHoursRemaining" });
  }

  const today = currentDateString || "2026-06-23";
  const prompt = PromptBuilder.buildRecoverPrompt(goal.title, goal.category, goal.deadline, availableHoursRemaining, today, goal.tasks);
  const systemInstruction = "You are OhNo, the AI deadline recovery teammate. Reschedule remaining incomplete tasks to fit inside revised hour budgets in JSON.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    const cleanedText = sanitizeJsonString(aiResponse.text);
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Hybrid AI Recovery Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to mutate timeline." });
  }
});

// ---------------------------------------------------------
// POST /api/plan/panic-recover
// ---------------------------------------------------------
app.post("/api/plan/panic-recover", async (req, res) => {
  const { goal, reason, currentDateString } = req.body;

  if (!goal || !reason) {
    return res.status(400).json({ error: "Missing required fields: goal, reason" });
  }

  const today = currentDateString || "2026-06-23";
  const prompt = PromptBuilder.buildPanicPrompt(goal.title, goal.category, goal.deadline, reason, today, goal.tasks);
  const systemInstruction = "You are OhNo, the AI deadline recovery teammate. Perform emergency triage: remove, compress, postpone, and rebuild task items. Provide probability, impact, and saved hour sums in JSON.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    const cleanedText = sanitizeJsonString(aiResponse.text);
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Hybrid AI Panic Recovery Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to execute emergency panic triage." });
  }
});

// ---------------------------------------------------------
// POST /api/plan/parse-schedule
// ---------------------------------------------------------
app.post("/api/plan/parse-schedule", async (req, res) => {
  const { scheduleText, currentDateString, dailyHours } = req.body;

  if (!scheduleText) {
    return res.status(400).json({ error: "Missing required field: scheduleText" });
  }

  const today = currentDateString || "2026-06-30";
  const limit = dailyHours || 3;
  const prompt = PromptBuilder.buildParseSchedulePrompt(scheduleText, today, limit);
  const systemInstruction = "You are OhNo, the AI deadline recovery teammate. Parse timetables and structure courses, assignments, and exams into distinct project goals with nested daily tasks in JSON.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    const cleanedText = sanitizeJsonString(aiResponse.text);
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Hybrid AI Parse Schedule Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to parse academic schedule." });
  }
});

// ---------------------------------------------------------
// POST /api/plan/briefing
// ---------------------------------------------------------
app.post("/api/plan/briefing", async (req, res) => {
  const { goals, currentDateString } = req.body;
  if (!goals) {
    return res.status(400).json({ error: "Missing required field: goals" });
  }

  const today = currentDateString || "2026-06-30";
  const prompt = PromptBuilder.buildBriefingPrompt(goals, today);
  const systemInstruction = "You are OhNo, the AI morning briefing co-pilot. Analyze active projects, remaining tasks, and time debt to write a brutal, 3-sentence daily briefing.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    return res.json({ text: aiResponse.text });
  } catch (error: any) {
    console.error("Hybrid AI Briefing Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to compile daily briefing." });
  }
});

// ---------------------------------------------------------
// POST /api/plan/triage-deck
// ---------------------------------------------------------
app.post("/api/plan/triage-deck", async (req, res) => {
  const { goal, currentDateString } = req.body;
  if (!goal) {
    return res.status(400).json({ error: "Missing required field: goal" });
  }

  const today = currentDateString || "2026-06-30";
  const prompt = PromptBuilder.buildTriageDeckPrompt(goal, today);
  const systemInstruction = "You are OhNo, the AI deadline recovery teammate. Formulate exactly 3 recovery action items with hour estimates in JSON.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    const cleanedText = sanitizeJsonString(aiResponse.text);
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Hybrid AI Triage Deck Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to generate recovery steps." });
  }
});

// ---------------------------------------------------------
// POST /api/plan/gcal-sync
// ---------------------------------------------------------
app.post("/api/plan/gcal-sync", async (req, res) => {
  const { tasks, currentDateString } = req.body;
  if (!tasks) {
    return res.status(400).json({ error: "Missing required field: tasks" });
  }

  const today = currentDateString || "2026-06-30";
  const prompt = PromptBuilder.buildGCalSyncPrompt(tasks, today);
  const systemInstruction = "You are OhNo, the AI calendar scheduling co-pilot. Use tool definitions to select tasks and output creation events in JSON.";

  try {
    const aiResponse = await hybridAI.generate(prompt, systemInstruction);
    lastInferenceLatency = aiResponse.latency;
    const cleanedText = sanitizeJsonString(aiResponse.text);
    return res.json(JSON.parse(cleanedText));
  } catch (error: any) {
    console.error("Hybrid AI GCal Sync Error:", error.message);
    return res.status(500).json({ error: "Inference engine failed to sync calendar." });
  }
});

// Vite / Static Assets configuration
async function startServer() {
  // Initialize AI Engines in background (checks Gemini status, warm loads Local Llama GGUF on CPU)
  hybridAI.initialize().catch((err: any) => {
    console.error("AI engines initialization warning:", err.message);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OhNo Server running on http://localhost:${PORT}`);
  });
}

startServer();
