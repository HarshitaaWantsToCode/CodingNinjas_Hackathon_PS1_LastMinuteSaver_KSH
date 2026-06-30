/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AIResponse {
  text: string;
  provider: 'gemini' | 'llama';
  latency: number; // ms
  tokens?: number;
  fallbackUsed: boolean;
}

export interface AIProvider {
  generate(prompt: string, systemInstruction?: string): Promise<AIResponse>;
  healthCheck(): Promise<boolean>;
}
