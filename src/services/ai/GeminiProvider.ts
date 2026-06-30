/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { AIProvider, AIResponse } from './AIProvider';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI | null = null;
  private modelName = 'gemini-3.5-flash';

  private getAIClient(): GoogleGenAI | null {
    if (this.ai) return this.ai;
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      return this.ai;
    }
    return null;
  }

  async healthCheck(): Promise<boolean> {
    const ai = this.getAIClient();
    if (!ai) return false;
    try {
      // Basic call to check availability
      await Promise.race([
        ai.models.generateContent({
          model: this.modelName,
          contents: 'Ping',
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      ]);
      return true;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, systemInstruction?: string): Promise<AIResponse> {
    const ai = this.getAIClient();
    if (!ai) {
      throw new Error('Gemini API key is not configured or client failed to initialize.');
    }

    const executeAttempt = async (): Promise<string> => {
      const apiCall = ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: Gemini API request exceeded 90 seconds limit')), 90000)
      );

      const result = await Promise.race([apiCall, timeoutPromise]);
      const text = result.text;
      if (!text) {
        throw new Error('Gemini API returned an empty response.');
      }
      return text;
    };

    console.log('Gemini request started...');
    const startTime = Date.now();

    try {
      // Attempt 1
      const text = await executeAttempt();
      const latency = Date.now() - startTime;
      return {
        text,
        provider: 'gemini',
        latency,
        fallbackUsed: false
      };
    } catch (error: any) {
      console.warn(`Gemini primary attempt failed: ${error.message}. Retrying in 1s...`);
      
      // Wait 1s (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Attempt 2 (Retry)
        const text = await executeAttempt();
        const latency = Date.now() - startTime;
        return {
          text,
          provider: 'gemini',
          latency,
          fallbackUsed: false
        };
      } catch (retryError: any) {
        console.error(`Gemini retry attempt failed: ${retryError.message}`);
        throw retryError; // Let caller (Hybrid Provider) catch this and fall back to local Llama
      }
    }
  }
}
