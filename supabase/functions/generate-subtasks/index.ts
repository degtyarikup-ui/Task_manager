import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || "";

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

        console.log(`Generating subtasks (Groq) for: ${title} (${language})`);

        const langName = language === 'ru' ? 'Russian' : 'English';

        // Construct the prompt
        const systemPrompt = `You are a helpful task assistant.
        Generate a list of 3 to 6 concise, concrete, and actionable subtasks to complete the user's task.
        Output Language: ${langName}.
        IMPORTANT: Return ONLY a valid JSON array of strings. Do not include markdown code blocks, do not include explanations.
        Example: ["Buy materials", "Call contractor"]`;

        const userPrompt = `Task: "${title}"`;

        const models = ['llama-3.1-70b-versatile', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
        let data;
        let lastError;

        for (const model of models) {
            try {
                console.log(`Trying Groq model: ${model}`);
                const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: 0.5,
                        max_tokens: 500
                    })
                });

                data = await response.json();

                if (data.error) {
                    console.warn(`Groq Model ${model} error:`, data.error);
                    lastError = data.error;
                    continue;
                }

                if (data.choices && data.choices[0]?.message?.content) {
                    break;
                }
            } catch (e) {
                console.error(`Fetch error for ${model}:`, e);
                lastError = e;
            }
        }

        if (!data || !data.choices || !data.choices[0]?.message?.content) {
            console.error("All Groq models failed.");
            throw new Error(`Groq API Error: ${lastError?.message || JSON.stringify(lastError)}`);
        }

        let text = data.choices[0].message.content.trim();

        // Clean up markdown if present
        text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        let subtasks = [];
        try {
            subtasks = JSON.parse(text);
            if (!Array.isArray(subtasks)) throw new Error("Not an array");
        } catch (e) {
            console.error("JSON Parse Error:", text);
            // Fallback parsing
            subtasks = text.split('\n')
                .filter(l => l.trim().startsWith('-') || l.trim().match(/^\d+\./))
                .map(l => l.replace(/^[-\d\.]+\s*/, '').trim())
                .filter(l => l.length > 0);
        }

        return new Response(JSON.stringify({ subtasks }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
})
