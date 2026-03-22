CREATE TABLE IF NOT EXISTS public.otp_verifications (
    email TEXT PRIMARY KEY,
    otp TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + interval '10 minutes')
);

ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role to do anything
CREATE POLICY "Service role can manage OTPs" ON public.otp_verifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
