/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLlama, LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";
import path from "path";
import { AIProvider, AIResponse } from "./AIProvider";

export class LocalLlamaProvider implements AIProvider {
  private llama: any = null;
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private isLoaded = false;
  private modelName = "Llama-3-Maal-8B";

  async initialize(): Promise<void> {
    if (this.isLoaded) return;
    const modelPath = path.join(process.cwd(), "agent", "llama-3-maal-8b-instruct-v0.1.Q4_K_M.gguf");
    console.log(`Loading local Llama GGUF Model from ${modelPath}...`);
    try {
      this.llama = await getLlama({ gpu: false });
      this.model = await this.llama.loadModel({ modelPath });
      this.context = await this.model.createContext();
      this.isLoaded = true;
      console.log("✓ Local Llama Ready");
    } catch (err: any) {
      console.error(`Local Llama failed to load: ${err.message}`);
      this.isLoaded = false;
      throw err;
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.isLoaded;
  }

  async generate(prompt: string, systemInstruction?: string): Promise<AIResponse> {
    if (!this.isLoaded || !this.context) {
      throw new Error("Local Llama is not loaded/initialized.");
    }

    const startTime = Date.now();
    try {
      const session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        systemPrompt: systemInstruction
      });

      console.log("Local Llama request started...");
      const text = await session.prompt(prompt);
      const latency = Date.now() - startTime;
      console.log(`Local inference completed in ${(latency / 1000).toFixed(1)}s`);

      return {
        text,
        provider: 'llama',
        latency,
        fallbackUsed: true
      };
    } catch (error: any) {
      console.error(`Local Llama inference error: ${error.message}`);
      throw error;
    }
  }

  getModelName(): string {
    return this.modelName;
  }

  dispose() {
    this.model = null;
    this.context = null;
    this.isLoaded = false;
  }
}
