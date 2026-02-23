-- ============================================================
--  AXESS Frontend — profiles table
--  Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email        VARCHAR(255),
    full_name    VARCHAR(200),
    role         VARCHAR(20) NOT NULL DEFAULT 'producer'
                 CHECK (role IN ('admin', 'producer')),
    producer_id  UUID REFERENCES public.producers(id) ON DELETE SET NULL,
    avatar_url   VARCHAR(500),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policy: users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- 4. Policy: users can update their own profile (non-role fields)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Admin can read all profiles (via service_role - bypasses RLS)

-- 6. Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'producer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop if exists then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.touch_profiles_updated_at();

-- ============================================================
--  Seed the first admin user (run AFTER creating auth user)
--  Replace 'YOUR_AUTH_USER_UUID' with actual UUID from auth.users
-- ============================================================
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES ('YOUR_AUTH_USER_UUID', 'admin@axess.app', 'Axess Admin', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ============================================================
--  How to create a producer user:
--  1. Create auth user in Supabase Dashboard (Auth → Users → Invite)
--  2. Set metadata: { "role": "producer" }
--  3. Then update their profile:
--     UPDATE profiles SET producer_id = '<uuid>' WHERE email = 'producer@example.com';
-- ============================================================
