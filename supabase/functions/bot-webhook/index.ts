import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const botToken = Deno.env.get('TG_BOT_TOKEN')!

    if (!botToken) return new Response("TG_BOT_TOKEN missing", { status: 500 })

    try {
        const update = await req.json()

        // Обработка клика по кнопке (callback_query)
        if (update.callback_query) {
            const query = update.callback_query
            const data = query.data
            // Format: "complete:<taskId>"

            if (data.startsWith('complete:')) {
                const taskId = data.split(':')[1]

                // 1. Обновляем задачу в базе
                // Можно добавить проверку user_id для безопасности
                const { error } = await supabase
                    .from('tasks')
                    .update({ status: 'completed' })
                    .eq('id', taskId)

                if (error) throw error

                // 2. Убираем часики загрузки в Телеграм
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callback_query_id: query.id, text: "Задача завершена!" })
                })

                // 3. Обновляем сообщение (ставим галочку и убираем кнопку)
                // Проверяем наличие message в update (оно есть для callback_query от инлайн кнопок)
                if (query.message) {
                    // Получаем старый текст (без "Напоминание...") чтобы сохранить его, или формируем новый
                    // Проще сформировать новый короткий
                    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: query.message.chat.id,
                            message_id: query.message.message_id,
                            text: `✅ Задача выполнена!\n${query.message.text.split('\n')[2] || ''}`,
                            parse_mode: 'Markdown',
                            reply_markup: { inline_keyboard: [] } // Empty keyboard
                        })
                    })
                }
            }
        }
    } catch (e) {
        console.error(e)
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
    }

    return new Response('ok', { status: 200 })
})
