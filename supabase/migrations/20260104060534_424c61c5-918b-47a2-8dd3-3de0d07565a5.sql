-- Create admin_emails table to store allowed admin emails for Google OAuth login
CREATE TABLE public.admin_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view admin emails
CREATE POLICY "Superadmins can view admin emails"
ON public.admin_emails
FOR SELECT
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Only superadmins can insert admin emails
CREATE POLICY "Superadmins can insert admin emails"
ON public.admin_emails
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

-- Only superadmins can delete admin emails
CREATE POLICY "Superadmins can delete admin emails"
ON public.admin_emails
FOR DELETE
USING (has_role(auth.uid(), 'superadmin'::app_role));

-- Also fix profiles INSERT policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;