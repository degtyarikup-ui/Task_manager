import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || "";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { title, language } = await req.json();

        if (!title) throw new Error("Title is required");

        console.log(`Generating subtasks for: ${title} (${language})`);

        const langName = language === 'ru' ? 'Russian' : 'English';
        const prompt = `
      You are a helpful task assistant.
      The user has a task: "${title}".
      Generate a list of 3 to 6 concise, concrete, and actionable subtasks to complete this task.
      Output Language: ${langName}.
      
      IMPORTANT: Return ONLY a valid JSON array of strings. Do not include markdown code blocks, do not include explanations.
      Example: ["Buy materials", "Call contractor"]
    `;

        const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro'];
        let data;
        let lastError;

        for (const model of models) {
            try {
                console.log(`Trying model: ${model}`);
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                });

                data = await response.json();

                if (data.error) {
                    console.warn(`Model ${model} error:`, data.error);
                    lastError = data.error;
                    continue; // Try next model
                }

                if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                    console.log(`Success with model: ${model}`);
                    break; // Success!
                }
            } catch (e) {
                console.error(`Fetch error for ${model}:`, e);
                lastError = e;
            }
        }

        if (!data || !data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error("All models failed. Last error:", JSON.stringify(lastError));
            throw new Error(`Failed to generate content. Google Error: ${lastError?.message || 'Unknown'}`);
        }

        let text = data.candidates[0].content.parts[0].text.trim();
        // Clean up potentially wrapped markdown
        text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        let subtasks = [];
        try {
            subtasks = JSON.parse(text);
            if (!Array.isArray(subtasks)) throw new Error("Not an array");
        } catch (e) {
            console.error("JSON Parse Error:", text);
            // Fallback: split by newlines if it's not JSON
            subtasks = text.split('\n').filter(l => l.trim().startsWith('-')).map(l => l.replace(/^[-\d\.]+\s*/, '').trim());
        }

        return new Response(JSON.stringify({ subtasks }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
})
