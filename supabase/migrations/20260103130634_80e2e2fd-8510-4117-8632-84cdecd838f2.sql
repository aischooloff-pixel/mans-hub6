-- Create table for manual payment requests
CREATE TABLE public.manual_payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL,
  billing_period text NOT NULL,
  amount integer NOT NULL,
  receipt_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  admin_message_id bigint,
  reviewed_by_telegram_id bigint,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_payment_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own payment requests"
ON public.manual_payment_requests
FOR SELECT
USING (user_profile_id IN (
  SELECT id FROM profiles WHERE telegram_id IS NOT NULL
));

CREATE POLICY "Service role can manage payment requests"
ON public.manual_payment_requests
FOR ALL
USING (true)
WITH CHECK (true);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', true);

-- Storage policies for receipts
CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-receipts');

CREATE POLICY "Service role can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-receipts');

CREATE POLICY "Service role can delete receipts"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-receipts');