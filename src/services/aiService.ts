import type { Task, Client } from "../types";

export const parseTaskFromVoice = async (
    text: string,
    clients: Client[],
    apiKey: string
): Promise<Partial<Task>> => {
    // Dynamic import to reduce initial bundle size
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-pro for maximum compatibility
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // Fallback to gemini-pro if flash fails is not easy here without retry logic,
    // but the error was 404, implying model name issue.
    // Let's try 'gemini-1.0-pro' or just 'gemini-pro' which is aliased to stable.
    // Actually, let's use 'gemini-1.5-flash-latest' or just stay safe with 'gemini-pro'
    // Update: 'gemini-1.5-flash' should work but maybe region locked?
    // Let's switch to 'gemini-pro' to be 100% safe.
    // Re-instating: const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const clientNames = clients.map(c => c.name).join(", ");
    const today = new Date().toISOString().split('T')[0];

    const prompt = `
        You are a smart AI assistant for a task manager app.
        Your goal is to extract structured task data from a spoken user command.
        
        Current Date: ${today}
        Existing Clients: [${clientNames}]

        User Command: "${text}"

        Instructions:
        1. **Title**: Extract a concise task title.
        2. **Client**: If a client is mentioned, try to match it with "Existing Clients". If it's a new client, use the name mentioned. If no client, null.
        3. **Deadline**: precise ISO 8601 date string (YYYY-MM-DD) calculated relative to Today. If "next friday", calculate it.
        4. **Priority**: 'low', 'medium', or 'high'.
        5. **Subtasks**: If the user lists steps (e.g., "first do this, then do that"), create subtasks.

        Return ONLY a JSON object with this structure (no markdown):
        {
            "title": "string",
            "client": "string | null",
            "deadline": "string | null",
            "priority": "low" | "medium" | "high",
            "subtasks": [{"title": "string", "completed": false, "id": "string"}]
        }
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const textResponse = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = textResponse.replace(/^```json\n|\n```$/g, "").trim();
        const data = JSON.parse(jsonStr);

        // Sanitize IDs for subtasks
        if (data.subtasks) {
            data.subtasks = data.subtasks.map((s: any) => ({
                ...s,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                completed: false
            }));
        }

        return data;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        throw error;
    }
};
