# Руководство: Напоминания в Telegram с кнопкой завершения

Реализовать напоминания с Supabase довольно просто, так как у нас уже есть `user_id` (Telegram ID) пользователей.

## Шаг 1: Подготовка Supabase Edge Function

Нам понадобятся две функции:
1. `send-reminders` — для рассылки (по расписанию).
2. `bot-webhook` — для обработки нажатий кнопок.

Создайте их через Supabase CLI:
`supabase functions new send-reminders`
`supabase functions new bot-webhook`

## Шаг 2: Код функции send-reminders

Эта функция ищет задачи на сегодня и отправляет сообщение.

```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Инициализация Supabase (Admin доступ)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const botToken = Deno.env.get('TG_BOT_TOKEN')!

  // Получаем задачи на сегодня
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('id, title, user_id')
    .eq('deadline', today)
    .neq('status', 'completed')
  
  if (error) return new Response(JSON.stringify(error), { status: 500 })
  console.log(`Найдено ${tasks?.length} задач для напоминания`)

  if (!tasks || tasks.length === 0) return new Response('No tasks', { status: 200 })

  for (const task of tasks) {
    // Отправляем сообщение
    // user_id в базе должен быть корректным Telegram ID
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: task.user_id, 
            text: `🔔 *Напоминание*\n\nЗадача: ${task.title}\nДедлайн сегодня!`,
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: "✅ Завершить", callback_data: `complete:${task.id}` }
                ]]
            }
        })
    })
  }

  return new Response(JSON.stringify({ sent: tasks.length }), { status: 200 })
})
```

## Шаг 3: Код функции bot-webhook

Эта функция принимает события от Telegram (клик по кнопке).

```typescript
// supabase/functions/bot-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const botToken = Deno.env.get('TG_BOT_TOKEN')!

  try {
    const update = await req.json()
    
    // Обработка клика по кнопке (callback_query)
    if (update.callback_query) {
        const query = update.callback_query
        const data = query.data
        const taskId = data.split(':')[1]

        if (data.startsWith('complete:')) {
            // 1. Обновляем задачу в базе
            await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId)

            // 2. Убираем часики загрузки в Телеграм
            await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ callback_query_id: query.id, text: "Задача завершена!" })
            })

            // 3. Обновляем сообщение (ставим галочку)
            // Важно: проверяем наличие message
            if (query.message) {
                await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: query.message.chat.id,
                        message_id: query.message.message_id,
                        text: `✅ Задача выполнена!\n${query.message.text.split('\n')[2] || ''}`, 
                        reply_markup: { inline_keyboard: [] }
                    })
                })
            }
        }
    }
  } catch (e) {
    console.error(e)
  }

  return new Response('ok', { status: 200 })
})
```

## Шаг 4: Деплой и Настройка

1. Деплой функций:
   `supabase functions deploy send-reminders`
   `supabase functions deploy bot-webhook`

2. Установка переменной окружения (Токен бота):
   `supabase secrets set TG_BOT_TOKEN=ваш_токен_от_BotFather`

3. Настройка Webhook (чтобы Telegram знал куда слать клики):
   Выполните запрос в браузере или curl:
   `https://api.telegram.org/bot<ВАШ_ТОКЕН>/setWebhook?url=https://<PROJECT-ID>.supabase.co/functions/v1/bot-webhook`

4. Настройка расписания для `send-reminders`:
   Самый простой способ — использовать сторонний сервис (например, cron-job.org), который будет дергать URL вашей функции:
   `https://<PROJECT-ID>.supabase.co/functions/v1/send-reminders`
   (Не забудьте настроить проверку Authorization заголовка в функции, если функция не публичная).

   Или используйте **pg_cron** внутри базы Supabase (требует включения расширения и настройки):
   ```sql
   select cron.schedule(
     'daily-reminder',
     '0 9 * * *', -- каждый день в 9:00
     $$
     select
       net.http_post(
           url:='https://<PROJECT-ID>.supabase.co/functions/v1/send-reminders',
           headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_KEY>"}'::jsonb
       ) as request_id;
     $$
   );
   ```
