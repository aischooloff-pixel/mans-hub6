import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyTelegramWebAppData(initData: string, botToken: string) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false, reason: 'no hash' };

    params.delete('hash');
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map((k) => `${k}=${params.get(k)}`).join('\n');

    const encoder = new TextEncoder();
    const keyData = encoder.encode('WebAppData');
    const tokenData = encoder.encode(botToken);
    
    const key1 = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const secretKey = await crypto.subtle.sign('HMAC', key1, tokenData);
    
    const key2 = await crypto.subtle.importKey('raw', secretKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key2, encoder.encode(dataCheckString));
    
    const calculatedHash = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (calculatedHash !== hash) return { valid: false, reason: 'hash mismatch' };

    const userRaw = params.get('user');
    if (!userRaw) return { valid: false, reason: 'no user' };
    const user = JSON.parse(userRaw);

    return { valid: true, user };
  } catch (e) {
    return { valid: false, reason: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { initData, action, rating, reviewText, suggestions } = await req.json();
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
    const result = await verifyTelegramWebAppData(initData, botToken);

    if (!result.valid || !result.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const telegramId = result.user.id;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Submit a review
    if (action === 'submit') {
      if (!rating || rating < 1 || rating > 5 || !reviewText) {
        return new Response(JSON.stringify({ error: 'Invalid review data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if user already has a pending or approved review
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id, status')
        .eq('user_profile_id', profile.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      if (existingReview) {
        return new Response(JSON.stringify({ 
          error: existingReview.status === 'pending' 
            ? 'У вас уже есть отзыв на модерации' 
            : 'Вы уже оставляли отзыв'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: review, error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_profile_id: profile.id,
          rating,
          review_text: reviewText,
          suggestions: suggestions || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting review:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to submit review' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Send notification to admin bot
      const adminChatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');
      const adminBotToken = Deno.env.get('ADMIN_BOT_TOKEN');
      
      if (adminChatId && adminBotToken) {
        const userName = result.user.username 
          ? `@${result.user.username}` 
          : result.user.first_name || `ID:${telegramId}`;
        
        const stars = '⭐'.repeat(rating);
        
        const message = `📝 <b>Новый отзыв</b>

${stars} (${rating}/5)

👤 <b>От:</b> ${userName}

💬 <b>Отзыв:</b>
${reviewText}

${suggestions ? `💡 <b>Пожелания/проблемы:</b>\n${suggestions}` : ''}`;

        const keyboard = {
          inline_keyboard: [
            [
              { text: '✅ Одобрить', callback_data: `review_approve:${review.id}` },
              { text: '❌ Отклонить', callback_data: `review_reject:${review.id}` },
            ],
          ],
        };

        await fetch(`https://api.telegram.org/bot${adminBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminChatId,
            text: message,
            parse_mode: 'HTML',
            reply_markup: keyboard,
          }),
        });
      }

      return new Response(JSON.stringify({ success: true, review }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all approved reviews with stats
    if (action === 'list') {
      const { data: reviews, error: listError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          review_text,
          created_at,
          user:user_profile_id(first_name, username, avatar_url, show_name, show_username, show_avatar)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('Error fetching reviews:', listError);
        return new Response(JSON.stringify({ error: 'Failed to fetch reviews' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate stats
      const totalReviews = reviews?.length || 0;
      const avgRating = totalReviews > 0 
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
        : 0;

      // Check if current user has already submitted a review
      const { data: userReview } = await supabase
        .from('reviews')
        .select('id, status')
        .eq('user_profile_id', profile.id)
        .in('status', ['pending', 'approved'])
        .maybeSingle();

      return new Response(JSON.stringify({ 
        reviews: reviews || [],
        stats: {
          totalReviews,
          avgRating: Math.round(avgRating * 10) / 10,
        },
        userReview: userReview || null,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
