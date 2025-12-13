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
        const { projectType, description, hourlyRate, language, experience } = await req.json();

        if (!description && !projectType) throw new Error("Description or Project Type is required");

        console.log(`Calculating cost (Groq) for: ${projectType} - ${description} (${language})`);

        const langName = language === 'ru' ? 'Russian' : 'English';
        const currency = language === 'ru' ? 'RUB' : 'USD';
        // Simple heuristic for currency symbol/name if needed, but AI can handle it.

        const systemPrompt = `You are an expert freelance business mentor.
        Your goal is to help a user estimate the cost of a project based on their experience level.
        
        Input Data:
        - Project Type: ${projectType}
        - Description: ${description}
        - Freelancer Hourly Rate: ${hourlyRate || 'Unknown'}
        - Experience Level: ${experience || 'Beginner'}
        - Target Audience Currency: USD

        Task:
        1. Analyze the project requirements.
        2. Estimate the number of hours required (Min/Max).
        3. Calculate a recommended price range (Min/Max) in USD.
        4. Provide a "Complexity Rating" (Low, Medium, High).
        5. Write a brief "Explanation".

        CRITICAL PRICING RULES (Experience Level Impact):
        - You MUST differentiate results based on Experience Level:
          * Beginner: Focus on core functionality only. Standard hours.
          * Intermediate: Add 20% to hours/price for better code quality and basic testing.
          * Expert: Add 50-80% to hours/price for premium architecture, exhaustive testing, security, and scalability.
        - Even with a fixed Hourly Rate, an Expert provides MORE VALUE (and does MORE work/checks), so the Total Price/Hours MUST be higher than a Beginner.
        - Do NOT return the same estimate for different levels.
        
        Output Requirements:
        - Language: ${langName}
        - Return ONLY a valid JSON object.
        - JSON Structure: { "minPrice": number, "maxPrice": number, "currency": "USD", "minHours": number, "maxHours": number, "complexity": "string", "explanation": "string" }
        `;

        const userPrompt = `Estimate this project: ${projectType}. Details: ${description}`;

        const models = ['llama-3.1-70b-versatile', 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768'];
        let data;
        let lastError;

        for (const model of models) {
            try {
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
                        temperature: 0.3, // Lower temperature for more consistent numerical reasoning
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
            throw new Error(`Groq API Error: ${lastError?.message || JSON.stringify(lastError)}`);
        }

        let text = data.choices[0].message.content.trim();
        // Clean markdown
        text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

        const result = JSON.parse(text);

        return new Response(JSON.stringify(result), {
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
