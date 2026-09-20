import { ENV } from "./_core/env";

const SYSTEM_PROMPT = `You are the Assessment Workbench Bug Hunt support assistant. The candidate is actively taking a timed debugging assessment. You may explain requirements, point to likely areas to inspect, discuss test failures, edge cases, API contracts, debugging strategy, and architecture. Do NOT provide complete solutions, code snippets that directly implement the fix, or paste replacement code. Keep guidance concise and Socratic. Never assist with cheating or bypassing the assessment.`;

export async function getBugHuntAiHint(message: string) {
  if (!ENV.aiApiKey) {
    const text = message.toLowerCase();
    return text.includes("api") || text.includes("response")
      ? "Check the API response contract first. Compare the shape returned by the backend with the shape the frontend reads."
      : text.includes("cache")
        ? "Trace the cache lifecycle: read, write, update, and invalidation. Look for the stale value surviving an update."
        : text.includes("test")
          ? "Start with the first failing test. Compare expected versus actual behavior and fix one contract at a time before rerunning the suite."
          : "Start from the first failing behavior, identify the expected contract, then trace where the mismatch is introduced. I can give reasoning hints, not the fix.";
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENV.aiApiKey}` },
    body: JSON.stringify({
      model: ENV.aiModel,
      input: [
        { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
        { role: "user", content: [{ type: "input_text", text: message }] },
      ],
      max_output_tokens: 220,
    }),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const data = await response.json() as { output_text?: string };
  return data.output_text?.trim() || "Inspect the first failing test and compare its expected contract with the actual value.";
}
