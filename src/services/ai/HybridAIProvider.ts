/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AIProvider, AIResponse } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import type { LocalLlamaProvider } from "./LocalLlamaProvider";

export class HybridAIProvider implements AIProvider {
  private geminiProvider: GeminiProvider;
  private localLlamaProvider: LocalLlamaProvider | null = null;
  private isLlamaInitialized = false;

  constructor() {
    this.geminiProvider = new GeminiProvider();
  }

  private llamaInitPromise: Promise<void> | null = null;

  async ensureLlamaInitialized(): Promise<void> {
    if (this.isLlamaInitialized) return;
    if (this.llamaInitPromise) return this.llamaInitPromise;

    this.llamaInitPromise = (async () => {
      try {
        if (!this.localLlamaProvider) {
          const { LocalLlamaProvider } = await import("./LocalLlamaProvider");
          this.localLlamaProvider = new LocalLlamaProvider();
        }
        await this.localLlamaProvider.initialize();
        this.isLlamaInitialized = true;
        console.log("✓ Local Llama loaded successfully on demand.");
      } catch (err: any) {
        console.error(`⚠️ Local Llama lazy initialization failed: ${err.message}`);
        this.isLlamaInitialized = false;
        throw err;
      } finally {
        this.llamaInitPromise = null;
      }
    })();
    return this.llamaInitPromise;
  }

  async initialize(): Promise<void> {
    console.log("Initializing AI...");

    // 1. Check Gemini Availability
    const geminiAvailable = !!process.env.GEMINI_API_KEY;
    if (geminiAvailable) {
      console.log("✓ Gemini Ready. Eager Local Llama initialization skipped (will load lazily if fallback is required).");
      return;
    }

    console.warn("⚠️ Gemini API key is missing. System will operate in Local Llama only mode. Loading model...");
    try {
      await this.ensureLlamaInitialized();
    } catch (err: any) {
      console.error("❌ Eager Local Llama initialization failed.");
    }
  }

  async healthCheck(): Promise<boolean> {
    const geminiStatus = await this.geminiProvider.healthCheck();
    const llamaStatus = this.localLlamaProvider ? await this.localLlamaProvider.healthCheck() : false;
    return geminiStatus || llamaStatus;
  }

  async generate(prompt: string, systemInstruction?: string): Promise<AIResponse> {
    const geminiAvailable = !!process.env.GEMINI_API_KEY;

    if (geminiAvailable) {
      try {
        const res = await this.geminiProvider.generate(prompt, systemInstruction);
        return res;
      } catch (geminiError: any) {
        console.warn(`Gemini unavailable (${geminiError.message || 'Error'}). Switching to Local Llama fallback...`);
        await this.ensureLlamaInitialized();
        return await this.localLlamaProvider!.generate(prompt, systemInstruction);
      }
    } else {
      // Direct Local Llama Mode
      await this.ensureLlamaInitialized();
      return await this.localLlamaProvider!.generate(prompt, systemInstruction);
    }
  }

  getLlamaProvider(): LocalLlamaProvider | null {
    return this.localLlamaProvider;
  }

  getGeminiProvider(): GeminiProvider {
    return this.geminiProvider;
  }

  isLlamaReady(): boolean {
    return this.isLlamaInitialized;
  }
}
export const hybridAI = new HybridAIProvider();
