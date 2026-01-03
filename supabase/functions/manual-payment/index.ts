import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_BOT_TOKEN = Deno.env.get('ADMIN_BOT_TOKEN')!;
const TELEGRAM_ADMIN_CHAT_ID = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function sendAdminPhoto(chatId: string | number, photoUrl: string, caption: string, options: any = {}) {
  const url = `https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendPhoto`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML',
      ...options,
    }),
  });
  
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const telegramId = formData.get('telegram_id');
    const plan = formData.get('plan');
    const billingPeriod = formData.get('billing_period');
    const amount = formData.get('amount');
    const receiptFile = formData.get('receipt') as File;

    console.log('Manual payment request:', { telegramId, plan, billingPeriod, amount });

    if (!telegramId || !plan || !billingPeriod || !amount || !receiptFile) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, first_name, telegram_id')
      .eq('telegram_id', Number(telegramId))
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload receipt to storage
    const fileExt = receiptFile.name.split('.').pop() || 'jpg';
    const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const arrayBuffer = await receiptFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('payment-receipts')
      .upload(filePath, arrayBuffer, {
        contentType: receiptFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload receipt' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('payment-receipts')
      .getPublicUrl(filePath);

    const receiptUrl = urlData.publicUrl;

    // Create payment request
    const { data: paymentRequest, error: insertError } = await supabase
      .from('manual_payment_requests')
      .insert({
        user_profile_id: profile.id,
        plan,
        billing_period: billingPeriod,
        amount: Number(amount),
        receipt_url: receiptUrl,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to admin bot
    const userName = profile.username ? `@${profile.username}` : profile.first_name || 'Пользователь';
    const periodText = billingPeriod === 'monthly' ? 'месяц' : 'год';
    
    const caption = `💳 <b>Новая ручная оплата</b>

👤 <b>Пользователь:</b> ${userName}
🆔 <b>Telegram ID:</b> <code>${profile.telegram_id}</code>
📦 <b>План:</b> ${plan === 'plus' ? 'Plus' : 'Premium'}
⏱ <b>Период:</b> ${periodText}
💰 <b>Сумма:</b> ${amount}₽

🕐 <b>Дата:</b> ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `manual_pay_approve:${paymentRequest.id}` },
          { text: '❌ Отклонить', callback_data: `manual_pay_reject:${paymentRequest.id}` },
        ],
      ],
    };

    const result = await sendAdminPhoto(TELEGRAM_ADMIN_CHAT_ID, receiptUrl, caption, { reply_markup: keyboard });

    if (result.ok && result.result?.message_id) {
      // Save admin message ID
      await supabase
        .from('manual_payment_requests')
        .update({ admin_message_id: result.result.message_id })
        .eq('id', paymentRequest.id);
    }

    console.log('Payment request created:', paymentRequest.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Payment request submitted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Manual payment error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
