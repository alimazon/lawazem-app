// lib/telegram.ts

const API_BASE = 'https://api.telegram.org';

// ==================== Types ====================
export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface SendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  disable_web_page_preview?: boolean;
  reply_markup?: InlineKeyboardMarkup;
}

// ==================== Token ====================
function getToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN غير مُعد');
  return token;
}

export function getWebhookSecret(): string | undefined {
  return process.env.TELEGRAM_WEBHOOK_SECRET;
}

// ==================== Send Message ====================
export async function sendMessage(
  chatId: number,
  text: string,
  options: SendMessageOptions = {}
): Promise<boolean> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parse_mode ?? 'HTML',
        disable_web_page_preview: options.disable_web_page_preview ?? true,
        reply_markup: options.reply_markup,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[tg] sendMessage failed:', res.status, body.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[tg] sendMessage error:', err);
    return false;
  }
}

// ==================== Edit Message ====================
export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  options: SendMessageOptions = {}
): Promise<boolean> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: options.parse_mode ?? 'HTML',
        disable_web_page_preview: options.disable_web_page_preview ?? true,
        reply_markup: options.reply_markup,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==================== Answer Callback ====================
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<void> {
  const token = getToken();
  try {
    await fetch(`${API_BASE}/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  } catch {
    /* تجاهل */
  }
}

// ==================== Set / Delete Webhook ====================
export async function setWebhook(
  webhookUrl: string,
  secretToken?: string
): Promise<{ ok: boolean; description: string }> {
  const token = getToken();
  const payload: Record<string, unknown> = {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  };
  if (secretToken) payload.secret_token = secretToken;

  try {
    const res = await fetch(`${API_BASE}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; description?: string };
    return {
      ok: !!data.ok,
      description: data.description ?? (data.ok ? 'تم بنجاح' : 'فشل'),
    };
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error ? err.message : 'خطأ غير معروف',
    };
  }
}

export async function deleteWebhook(): Promise<boolean> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/bot${token}/deleteWebhook`, {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ==================== Helpers ====================
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ==================== Stage Helpers ====================
export const STAGE_MAP: Record<string, string> = {
  '1': 'المرحلة الأولى',
  '2': 'المرحلة الثانية',
  '3': 'المرحلة الثالثة',
};

export const STAGE_REVERSE: Record<string, string> = {
  'المرحلة الأولى': '1',
  'المرحلة الثانية': '2',
  'المرحلة الثالثة': '3',
};

export function stageLabel(code: string): string {
  return STAGE_MAP[code] ?? code;
}
// ==================== Helper: getAdminChatIds ====================
// (يُستخدم من telegram-admins.ts، لا يحتاج تعديل الملف)

// ==================== Message Helpers ====================
export function bold(text: string): string {
  return `<b>${text}</b>`;
}

export function code(text: string): string {
  return `<code>${text}</code>`;
}

export function italic(text: string): string {
  return `<i>${text}</i>`;
}

export function truncate(text: string, max = 3500): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}