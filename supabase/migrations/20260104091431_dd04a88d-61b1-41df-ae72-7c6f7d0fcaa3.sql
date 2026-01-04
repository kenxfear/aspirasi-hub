-- 1. Fix: Recreate handle_new_user function untuk Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix has_role function dengan proper search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Update RLS policies untuk admin_emails agar superadmin bisa INSERT/DELETE
DROP POLICY IF EXISTS "Superadmins can insert admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Superadmins can delete admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Superadmins can view admin emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can view admin emails" ON public.admin_emails;

-- Recreate dengan PERMISSIVE policies (default)
CREATE POLICY "Superadmins can view admin emails" 
ON public.admin_emails 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can insert admin emails" 
ON public.admin_emails 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmins can delete admin emails" 
ON public.admin_emails 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

-- 5. Add policy untuk admins bisa view admin emails list juga
CREATE POLICY "Admins can view admin emails" 
ON public.admin_emails 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 6. Fix profiles INSERT policy 
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 7. Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- 8. Add unique constraint on admin_emails.email to prevent duplicates
ALTER TABLE public.admin_emails DROP CONSTRAINT IF EXISTS admin_emails_email_unique;
ALTER TABLE public.admin_emails ADD CONSTRAINT admin_emails_email_unique UNIQUE (email);