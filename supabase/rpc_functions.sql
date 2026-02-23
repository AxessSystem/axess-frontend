-- ============================================================
--  AXESS Frontend — RPC functions for Dashboard
--  Run in Supabase SQL Editor BEFORE using the dashboard
-- ============================================================

-- 1. Monthly activity stats (last 13 months)
--    Returns: month, orders, revenue, commission, checkins
CREATE OR REPLACE FUNCTION public.get_monthly_stats()
RETURNS TABLE (
    month        TEXT,
    month_date   DATE,
    orders       BIGINT,
    revenue      NUMERIC,
    commission   NUMERIC,
    checkins     BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        TO_CHAR(DATE_TRUNC('month', t.purchase_date), 'MM/YYYY') AS month,
        DATE_TRUNC('month', t.purchase_date)::DATE               AS month_date,
        COUNT(t.id)                                               AS orders,
        COALESCE(SUM(t.total_income), 0)                         AS revenue,
        COALESCE(SUM(t.axess_commission), 0)                     AS commission,
        0::BIGINT                                                 AS checkins
    FROM transactions t
    WHERE
        t.purchase_date >= DATE_TRUNC('month', NOW()) - INTERVAL '12 months'
        AND t.goout_status IN ('Paid', 'Approved')
        AND t.purchase_date IS NOT NULL
    GROUP BY DATE_TRUNC('month', t.purchase_date)
    ORDER BY month_date ASC;
END;
$$;

-- Grant execute to anon (RLS on tables still applies for data isolation)
GRANT EXECUTE ON FUNCTION public.get_monthly_stats() TO anon, authenticated;

-- 2. Total commission sum (fast aggregate — avoids full table scan in JS)
CREATE OR REPLACE FUNCTION public.get_total_commission()
RETURNS NUMERIC
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT COALESCE(SUM(axess_commission), 0)
    FROM transactions
    WHERE is_axess_lead = TRUE
      AND goout_status IN ('Paid', 'Approved');
$$;

GRANT EXECUTE ON FUNCTION public.get_total_commission() TO anon, authenticated;

-- 3. Dashboard summary (all KPIs in one round-trip)
CREATE OR REPLACE FUNCTION public.get_admin_kpi()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_producers   BIGINT;
    v_users       BIGINT;
    v_events      BIGINT;
    v_commission  NUMERIC;
    v_transactions BIGINT;
    v_checkins_today BIGINT;
BEGIN
    SELECT COUNT(*) INTO v_producers  FROM producers   WHERE is_active = TRUE;
    SELECT COUNT(*) INTO v_users      FROM users;
    SELECT COUNT(*) INTO v_events     FROM events      WHERE is_active = TRUE;
    SELECT COALESCE(SUM(axess_commission), 0) INTO v_commission
        FROM transactions WHERE is_axess_lead = TRUE AND goout_status IN ('Paid','Approved');
    SELECT COUNT(*) INTO v_transactions FROM transactions WHERE goout_status IN ('Paid','Approved');
    SELECT COUNT(*) INTO v_checkins_today
        FROM checkins WHERE checkin_at::DATE = CURRENT_DATE AND status = 'checked_in';

    RETURN JSON_BUILD_OBJECT(
        'producers',       v_producers,
        'users',           v_users,
        'events',          v_events,
        'commission',      v_commission,
        'transactions',    v_transactions,
        'checkins_today',  v_checkins_today
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_kpi() TO anon, authenticated;
