-- ============================================
-- ALERT PRESETS & HELPER FUNCTIONS
-- ============================================
-- This extends your existing alerts table with preset configurations
-- and helper functions for common reminder scenarios

-- ============================================
-- 1. CREATE ENUM TYPES (if not already created)
-- ============================================

-- Alert kind enum (types of alerts)
DO $$ BEGIN
    CREATE TYPE alert_kind_enum AS ENUM (
        'absolute',      -- Specific datetime
        'relative',      -- Relative to event (offset_minutes)
        'recurring'      -- Repeating alerts
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Relative to enum (what the offset is relative to)
DO $$ BEGIN
    CREATE TYPE alert_relative_to_enum AS ENUM (
        'event_start',   -- Before/after event start
        'event_end',     -- Before/after event end
        'due_date',      -- For reminders
        'created_at'     -- From creation time
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alert channel enum (how to deliver the alert)
DO $$ BEGIN
    CREATE TYPE alert_channel_enum AS ENUM (
        'push',          -- Push notification
        'email',         -- Email
        'sms',           -- SMS
        'in_app'         -- In-app notification only
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- 2. HELPER FUNCTION: Add Preset Alerts
-- ============================================

CREATE OR REPLACE FUNCTION add_preset_alerts(
    p_item_id uuid,
    p_event_start timestamptz,
    p_preset_name text DEFAULT 'standard'
)
RETURNS void AS $$
BEGIN
    -- Delete existing alerts for this item
    DELETE FROM alerts WHERE item_id = p_item_id;
    
    CASE p_preset_name
        -- Standard preset: 30 mins, 1 day before
        WHEN 'standard' THEN
            INSERT INTO alerts (item_id, kind, offset_minutes, relative_to, trigger_at)
            VALUES 
                (p_item_id, 'relative', 30, 'event_start', p_event_start - INTERVAL '30 minutes'),
                (p_item_id, 'relative', 1440, 'event_start', p_event_start - INTERVAL '1 day');
        
        -- Important: 1 week, 1 day, 1 hour, 15 mins before
        WHEN 'important' THEN
            INSERT INTO alerts (item_id, kind, offset_minutes, relative_to, trigger_at)
            VALUES 
                (p_item_id, 'relative', 10080, 'event_start', p_event_start - INTERVAL '1 week'),
                (p_item_id, 'relative', 1440, 'event_start', p_event_start - INTERVAL '1 day'),
                (p_item_id, 'relative', 60, 'event_start', p_event_start - INTERVAL '1 hour'),
                (p_item_id, 'relative', 15, 'event_start', p_event_start - INTERVAL '15 minutes');
        
        -- Minimal: Just 15 mins before
        WHEN 'minimal' THEN
            INSERT INTO alerts (item_id, kind, offset_minutes, relative_to, trigger_at)
            VALUES 
                (p_item_id, 'relative', 15, 'event_start', p_event_start - INTERVAL '15 minutes');
        
        -- Custom (no presets, user will add manually)
        WHEN 'custom' THEN
            NULL;
            
        ELSE
            RAISE EXCEPTION 'Unknown preset: %', p_preset_name;
    END CASE;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 3. HELPER FUNCTION: Add Single Alert
-- ============================================

CREATE OR REPLACE FUNCTION add_single_alert(
    p_item_id uuid,
    p_offset_minutes integer,
    p_relative_to alert_relative_to_enum DEFAULT 'event_start',
    p_channel alert_channel_enum DEFAULT 'push'
)
RETURNS uuid AS $$
DECLARE
    v_alert_id uuid;
    v_event_start timestamptz;
    v_trigger_at timestamptz;
BEGIN
    -- Get event start time
    SELECT start_at INTO v_event_start
    FROM event_details
    WHERE item_id = p_item_id;
    
    IF v_event_start IS NULL THEN
        RAISE EXCEPTION 'Item % has no event details', p_item_id;
    END IF;
    
    -- Calculate trigger time
    v_trigger_at := v_event_start - (p_offset_minutes || ' minutes')::INTERVAL;
    
    -- Insert alert
    INSERT INTO alerts (
        item_id, 
        kind, 
        offset_minutes, 
        relative_to, 
        trigger_at,
        channel
    )
    VALUES (
        p_item_id,
        'relative',
        p_offset_minutes,
        p_relative_to,
        v_trigger_at,
        p_channel
    )
    RETURNING id INTO v_alert_id;
    
    RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 4. HELPER FUNCTION: Update Alert Triggers
-- ============================================
-- This recalculates trigger_at when event time changes

CREATE OR REPLACE FUNCTION recalculate_alert_triggers(p_item_id uuid)
RETURNS void AS $$
DECLARE
    v_event_start timestamptz;
    v_event_end timestamptz;
BEGIN
    -- Get event times
    SELECT start_at, end_at INTO v_event_start, v_event_end
    FROM event_details
    WHERE item_id = p_item_id;
    
    IF v_event_start IS NULL THEN
        RETURN; -- No event details, skip
    END IF;
    
    -- Update all relative alerts
    UPDATE alerts
    SET trigger_at = CASE 
        WHEN relative_to = 'event_start' THEN 
            v_event_start - (offset_minutes || ' minutes')::INTERVAL
        WHEN relative_to = 'event_end' THEN 
            v_event_end - (offset_minutes || ' minutes')::INTERVAL
        ELSE 
            trigger_at
    END,
    updated_at = now()
    WHERE item_id = p_item_id
    AND kind = 'relative';
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 5. TRIGGER: Auto-update alerts on event change
-- ============================================

CREATE OR REPLACE FUNCTION trg_event_details_update_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- When event time changes, recalculate all alerts
    IF (TG_OP = 'UPDATE' AND (NEW.start_at != OLD.start_at OR NEW.end_at != OLD.end_at))
       OR TG_OP = 'INSERT' THEN
        PERFORM recalculate_alert_triggers(NEW.item_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_event_details_update_alerts ON event_details;
CREATE TRIGGER trg_event_details_update_alerts
    AFTER INSERT OR UPDATE ON event_details
    FOR EACH ROW
    EXECUTE FUNCTION trg_event_details_update_alerts();


-- ============================================
-- 6. VIEW: Active Upcoming Alerts
-- ============================================

CREATE OR REPLACE VIEW v_upcoming_alerts AS
SELECT 
    a.id as alert_id,
    a.item_id,
    i.title,
    i.type,
    a.trigger_at,
    a.offset_minutes,
    a.relative_to,
    a.channel,
    ed.start_at as event_start,
    ed.end_at as event_end,
    EXTRACT(EPOCH FROM (a.trigger_at - now())) / 60 AS minutes_until_trigger,
    a.last_fired_at,
    a.active
FROM alerts a
JOIN items i ON i.id = a.item_id
LEFT JOIN event_details ed ON ed.item_id = a.item_id
WHERE a.active = true
  AND a.trigger_at > now()
  AND i.user_id = auth.uid()
ORDER BY a.trigger_at ASC;


-- ============================================
-- 7. PRESET CONFIGURATIONS TABLE (Optional)
-- ============================================
-- Store common alert presets per user

CREATE TABLE IF NOT EXISTS alert_presets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    preset_config jsonb NOT NULL,
    -- Example: [{"offset_minutes": 30, "channel": "push"}, {"offset_minutes": 1440, "channel": "email"}]
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Enable RLS
ALTER TABLE alert_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY alert_presets_sel ON alert_presets
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY alert_presets_ins ON alert_presets
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY alert_presets_upd ON alert_presets
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY alert_presets_del ON alert_presets
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());


-- ============================================
-- 8. INSERT DEFAULT PRESETS
-- ============================================
-- Run this for each user (or create a trigger on user signup)

CREATE OR REPLACE FUNCTION create_default_alert_presets(p_user_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO alert_presets (user_id, name, description, preset_config, is_default)
    VALUES 
        (p_user_id, 'Standard', '30 mins and 1 day before', 
         '[{"offset_minutes": 30, "channel": "push"}, {"offset_minutes": 1440, "channel": "push"}]', true),
        
        (p_user_id, 'Important', 'Multiple reminders for important events',
         '[{"offset_minutes": 10080, "channel": "email"}, {"offset_minutes": 1440, "channel": "push"}, {"offset_minutes": 60, "channel": "push"}, {"offset_minutes": 15, "channel": "push"}]', false),
        
        (p_user_id, 'Minimal', 'Just 15 minutes before',
         '[{"offset_minutes": 15, "channel": "push"}]', false),
        
        (p_user_id, 'Daily', '1 day before only',
         '[{"offset_minutes": 1440, "channel": "push"}]', false),
        
        (p_user_id, 'Weekly', '1 week before only',
         '[{"offset_minutes": 10080, "channel": "email"}]', false)
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- USAGE EXAMPLES
-- ============================================

/*
-- Example 1: Create event with standard alerts
INSERT INTO items (user_id, type, title, responsible_user_id)
VALUES (auth.uid(), 'event', 'Parent''s House Visit', auth.uid())
RETURNING id;

INSERT INTO event_details (item_id, start_at, end_at)
VALUES ('<item_id>', '2025-10-25 18:00:00+00', '2025-10-25 21:00:00+00');

-- Add standard alerts (30 mins, 1 day before)
SELECT add_preset_alerts('<item_id>', '2025-10-25 18:00:00+00', 'standard');


-- Example 2: Add custom alerts manually
SELECT add_single_alert('<item_id>', 30);     -- 30 mins before
SELECT add_single_alert('<item_id>', 1440);   -- 1 day before
SELECT add_single_alert('<item_id>', 10080);  -- 1 week before


-- Example 3: View upcoming alerts
SELECT * FROM v_upcoming_alerts;


-- Example 4: Update event time (alerts auto-update via trigger)
UPDATE event_details 
SET start_at = '2025-10-26 18:00:00+00'
WHERE item_id = '<item_id>';
-- Alerts automatically recalculated!


-- Example 5: Create default presets for current user
SELECT create_default_alert_presets(auth.uid());
*/
