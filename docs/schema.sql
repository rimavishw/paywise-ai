
-- ==========================================
-- PAYWISE AI - DATABASE SCHEMA
-- Phase 2: Database
-- ==========================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'sender'
        CHECK (role IN ('sender', 'recipient')),
    paypal_email TEXT,
    paypal_verified BOOLEAN NOT NULL DEFAULT FALSE,
    sandbox_balance NUMERIC(12,2) NOT NULL DEFAULT 500.00
        CHECK (sandbox_balance >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RECIPIENTS TABLE
CREATE TABLE IF NOT EXISTS public.recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_id, email)
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    recipient_email TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    note TEXT,

    status TEXT NOT NULL DEFAULT 'created'
        CHECK (status IN (
            'created', 'pending', 'on_hold',
            'unclaimed', 'completed', 'returned', 'failed'
        )),

    issue_code TEXT,
    risk_level TEXT
        CHECK (risk_level IN ('low', 'medium', 'high')),

    paypal_batch_id TEXT,
    paypal_item_id TEXT,
    sender_item_id TEXT UNIQUE,

    preflight JSONB NOT NULL DEFAULT '{}'::jsonb,
    explanation JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_simulated BOOLEAN NOT NULL DEFAULT FALSE,

    paypal_order_id TEXT,
    paypal_capture_id TEXT,
    funding_source TEXT,
    funding_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    pending_reason TEXT,
    payment_flow TEXT
        CHECK (payment_flow IN ('payout', 'checkout')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PAYMENT EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    transaction_id UUID NOT NULL
        REFERENCES public.transactions(id) ON DELETE CASCADE,

    source TEXT NOT NULL
        CHECK (source IN ('paypal', 'simulator', 'system')),

    event_type TEXT NOT NULL,
    paypal_event_id TEXT UNIQUE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_recipients_owner
ON public.recipients(owner_id);

CREATE INDEX IF NOT EXISTS idx_transactions_sender
ON public.transactions(sender_id);

CREATE INDEX IF NOT EXISTS idx_transactions_status
ON public.transactions(status);

CREATE INDEX IF NOT EXISTS idx_transactions_created
ON public.transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_events_transaction
ON public.payment_events(transaction_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON public.notifications(user_id);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- ==========================================
-- RECIPIENTS POLICIES
-- ==========================================

CREATE POLICY "Users can view own recipients"
ON public.recipients
FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can add own recipients"
ON public.recipients
FOR INSERT TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own recipients"
ON public.recipients
FOR UPDATE TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own recipients"
ON public.recipients
FOR DELETE TO authenticated
USING (owner_id = (SELECT auth.uid()));

-- ==========================================
-- TRANSACTIONS POLICIES
-- ==========================================

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT TO authenticated
USING (sender_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own transactions"
ON public.transactions
FOR INSERT TO authenticated
WITH CHECK (sender_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own transactions"
ON public.transactions
FOR UPDATE TO authenticated
USING (sender_id = (SELECT auth.uid()))
WITH CHECK (sender_id = (SELECT auth.uid()));

-- ==========================================
-- PAYMENT EVENTS POLICIES
-- Users can only read events belonging
-- to their own transactions.
-- Backend service role handles inserts.
-- ==========================================

CREATE POLICY "Users can view own payment events"
ON public.payment_events
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.transactions t
        WHERE t.id = payment_events.transaction_id
        AND t.sender_id = (SELECT auth.uid())
    )
);

-- ==========================================
-- NOTIFICATIONS POLICIES
-- ==========================================

CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ==========================================
-- END OF PAYWISE AI SCHEMA
-- ==========================================
