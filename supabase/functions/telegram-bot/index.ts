
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const botToken = Deno.env.get('BOT_TOKEN')
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!botToken || !groqApiKey || !supabaseUrl || !supabaseKey) {
            throw new Error("Missing env variables")
        }

        const supabase = createClient(supabaseUrl, supabaseKey)
        const update = await req.json()

        // 2. Initial Setup (Webhook Registration Helper)
        if (update.action === 'setup_webhook') {
            const webhookUrl = `https://qysfycmynplwylnbnskw.supabase.co/functions/v1/telegram-bot`;
            const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
            const data = await res.json();
            return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 3. Process Message or Callback
        const message = update.message;
        const callbackQuery = update.callback_query;

        // --- HANDLE CALLBACK QUERY (BUTTONS) ---
        if (callbackQuery) {
            const cbChatId = callbackQuery.from.id;
            if (callbackQuery.data === 'get_all_tasks') {
                // Fetch tasks
                const { data: tasks, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', cbChatId)
                    .neq('status', 'completed') // Only active
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (error) console.error("Fetch Error:", error);

                if (!tasks || tasks.length === 0) {
                    await sendMessage(botToken, cbChatId, "✅ У вас нет активных задач.");
                } else {
                    let msg = "📋 **Ваши задачи:**\n\n";
                    tasks.forEach((t: any, i: number) => {
                        const date = t.deadline ? ` 📅 ${new Date(t.deadline).toLocaleDateString('ru-RU')}` : '';
                        const priority = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '⚪️';
                        msg += `${i + 1}. ${priority} ${t.title}${date}\n`;
                    });
                    await sendMessage(botToken, cbChatId, msg);
                }

                // Answer callback
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: callbackQuery.id })
                });
            }
            return new Response("OK");
        }

        // --- HANDLE MESSAGES (TEXT/VOICE) ---
        if (message) {
            const chatId = message.chat.id;

            // Admin Command to fix profile
            if (message.text && message.text.trim() === '/admin_premium') {
                if (chatId === 6034524743 || chatId === 906251783) {
                    await sendMessage(botToken, chatId, "🔄 Processing license creation...");

                    try {
                        // Create a license task
                        const { error } = await supabase.from('tasks').insert({
                            user_id: chatId,
                            title: "⭐️ Premium License",
                            status: "completed", // Hidden from main list usually
                            priority: "low",
                            deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                        });

                        if (error) {
                            console.error("License Error:", error);
                            await sendMessage(botToken, chatId, `❌ Error: ${JSON.stringify(error)}`);
                        } else {
                            await sendMessage(botToken, chatId, "✅ Admin: Premium License Task Created!");
                        }
                    } catch (e: any) {
                        console.error("Exception:", e);
                        await sendMessage(botToken, chatId, `❌ Exception: ${e.message}`);
                    }
                    return new Response("OK");
                } else {
                    await sendMessage(botToken, chatId, "⛔️ Not Authorized.");
                    return new Response("OK");
                }
            }

            // Ignore non-supported content types (Stickers, Photos, Videos, etc.)
            if (!message.text && !message.voice && !message.contact) {
                return new Response("OK");
            }

            // Check Premium Status (Look for License Task OR Profile for backward compat)
            const { data: licenseTasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('user_id', chatId)
                .eq('title', '⭐️ Premium License')
                .limit(1);

            const hasLicense = licenseTasks && licenseTasks.length > 0;

            const isPremium = hasLicense; // || (profile && profile.is_premium...);

            // If NOT Premium and trying to use voice or text for tasks
            if (!isPremium) {
                await sendMessage(botToken, chatId, `⭐️ **Доступно только в Premium**\n\nГолосовое и текстовое добавление задач — это функция для подписчиков.`, {
                    inline_keyboard: [[
                        { text: "💎 Открыть Premium", web_app: { url: "https://degtyarikup-ui.github.io/Task_manager/#/premium" } }
                    ]]
                });
                return new Response("OK");
            }

            // C. Contact Processing (Add Client)
            if (message.contact) {
                const contact = message.contact;
                const name = `${contact.first_name}${contact.last_name ? ' ' + contact.last_name : ''}`.trim();
                const phone = contact.phone_number;
                let avatarUrl = null;
                let debugMsg = "";
                // Try to fetch avatar
                if (contact.user_id) {
                    try {
                        const photosRes = await fetch(`https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${contact.user_id}&limit=1`);
                        const photosData = await photosRes.json();

                        if (photosData.ok && photosData.result.total_count > 0) {
                            // Get largest photo of the first set
                            const sizes = photosData.result.photos[0];
                            const bestPhoto = sizes[sizes.length - 1]; // Largest size

                            // Get File Path
                            const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${bestPhoto.file_id}`);
                            const fileData = await fileRes.json();

                            if (fileData.ok) {
                                const filePath = fileData.result.file_path;
                                const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

                                // Download
                                const imgBlob = await (await fetch(fileUrl)).blob();

                                // Upload to Supabase Storage
                                const fileName = `client_${contact.user_id}_${Date.now()}.jpg`;
                                const { error: uploadError } = await supabase.storage
                                    .from('avatars')
                                    .upload(fileName, imgBlob, { upsert: true, contentType: 'image/jpeg' });

                                if (!uploadError) {
                                    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                                    avatarUrl = publicData.publicUrl;
                                    debugMsg += "Photo Uploaded. ";
                                } else {
                                    console.error("Avatar Upload Error:", uploadError);
                                    debugMsg += `Upload Error: ${uploadError.message}. `;
                                }
                            }
                        } else {
                            debugMsg += "No profile photos found/accessible. ";
                        }
                    } catch (e: any) {
                        console.error("Avatar Processing Exception:", e);
                        debugMsg += `Avatar Exc: ${e.message}. `;
                    }
                } else {
                    debugMsg += "Not a registered Telegram User (No ID). ";
                }


                const { error } = await supabase.from('clients').insert({
                    user_id: chatId,
                    name: name,
                    contact: phone,
                    telegram_id: contact.user_id || null,
                    avatar_url: avatarUrl,
                    notes: 'Imported via Telegram Contact'
                });

                if (error) {
                    await sendMessage(botToken, chatId, `⚠️ Ошибка добавления: ${JSON.stringify(error)}`);
                } else {
                    const avatarMsg = avatarUrl ? " (c фото 📸)" : " (без фото)";
                    await sendMessage(botToken, chatId, `✅ Клиент **${name}** добавлен${avatarMsg}!\nRunning Log: ${debugMsg}`, {
                        reply_markup: {
                            inline_keyboard: [[
                                { text: "👥 Открыть Клиентов", web_app: { url: "https://degtyarikup-ui.github.io/Task_manager/#/clients" } }
                            ]]
                        }
                    });
                }
                return new Response("OK");
            }

            let text = message.text;

            // A. Voice Processing
            if (message.voice) {
                try {
                    // 1. Get File Path
                    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${message.voice.file_id}`);
                    const fileData = await fileRes.json();
                    if (!fileData.ok) throw new Error("Failed to get file path");
                    const filePath = fileData.result.file_path;

                    // 2. Download File
                    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
                    const audioBlob = await (await fetch(fileUrl)).blob();

                    // 3. Transcribe with Groq
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'voice.ogg');
                    formData.append('model', 'whisper-large-v3');
                    formData.append('response_format', 'json');

                    const transRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${groqApiKey}`,
                        },
                        body: formData
                    });

                    if (!transRes.ok) {
                        const errText = await transRes.text();
                        console.error("Groq Transcribe Error:", errText);
                        await sendMessage(botToken, chatId, `⚠️ Ошибка Groq Audio: ${transRes.status} ${errText}`);
                        return new Response("OK");
                    }

                    const transData = await transRes.json();
                    if (transData.text) {
                        text = transData.text;
                        // Removed "Recognized" message
                    } else {
                        await sendMessage(botToken, chatId, "❌ Не удалось распознать голос (пустой текст).");
                        return new Response("OK");
                    }
                } catch (e: any) {
                    await sendMessage(botToken, chatId, `❌ Exception processing voice: ${e.message}`);
                    return new Response("OK");
                }
            }

            if (!text) return new Response("OK");

            // B. Analyze Text with Llama 3 (Groq)
            const now = new Date();
            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });

            const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-70b-versatile',
                    messages: [
                        {
                            role: 'system', content: `You remain a smart task assistant.
Current Time: ${now.toISOString()} (${dayName}).
Language: Russian.

Your Goal: Parse user text into JSON.
Rules:
1. **Deadline**: Extract ANY date mention (tomorrow, next week, в пятницу, 13 декабря, завтра).
   - Convert it to YYYY-MM-DD.
   - If User says "13 декабря", use current year (or next year if passed).
   - If NO date is mentioned, "deadline" MUST be null. DO NOT default to today.
2. **Title**: The task text WITHOUT the date words.
   - User: "Встреча 13 декабря" -> Title: "Встреча", Deadline: "2025-12-13" (example).
   - User: "Купить хлеб" -> Title: "Купить хлеб", Deadline: null.
3. **Priority**: high/medium/low (default low).
4. **Status**: on-hold (default).

Return JSON:` },
                        { role: 'user', content: text }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            const chatData = await chatRes.json();
            let taskData;
            try {
                taskData = JSON.parse(chatData.choices[0].message.content);
            } catch (e) {
                taskData = { title: text, deadline: null, priority: 'low', status: 'on-hold' };
            }

            // C. Insert into Supabase
            const { error } = await supabase.from('tasks').insert({
                user_id: chatId,
                title: taskData.title,
                deadline: taskData.deadline,
                status: taskData.status || 'on-hold',
                priority: taskData.priority || 'low'
            });

            if (error) {
                console.error("DB Error", error);
                await sendMessage(botToken, chatId, `❌ Ошибка сохранения: ${error.message} `);
            } else {
                const replyMarkup = {
                    inline_keyboard: [[
                        { text: "📋 Все мои задачи", callback_data: "get_all_tasks" }
                    ]]
                };
                await sendMessage(botToken, chatId, `✅ Задача добавлена: \n ** ${taskData.title}** `, replyMarkup);
            }
        }

        return new Response("OK");

    } catch (e) {
        console.error(e);
        return new Response("Error", { status: 500 });
    }
});

async function sendMessage(token: string, chatId: number, text: string, replyMarkup?: any) {
    const body: any = { chat_id: chatId, text, parse_mode: 'Markdown' };
    if (replyMarkup) body.reply_markup = replyMarkup;

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}
