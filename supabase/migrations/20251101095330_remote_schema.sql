


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."alert_channel_enum" AS ENUM (
    'push',
    'email',
    'system'
);


ALTER TYPE "public"."alert_channel_enum" OWNER TO "postgres";


CREATE TYPE "public"."alert_kind_enum" AS ENUM (
    'absolute',
    'relative',
    'nag'
);


ALTER TYPE "public"."alert_kind_enum" OWNER TO "postgres";


CREATE TYPE "public"."alert_relative_to_enum" AS ENUM (
    'start',
    'end',
    'due',
    'event_start',
    'event_end',
    'due_date',
    'created_at'
);


ALTER TYPE "public"."alert_relative_to_enum" OWNER TO "postgres";


CREATE TYPE "public"."item_priority_enum" AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE "public"."item_priority_enum" OWNER TO "postgres";


CREATE TYPE "public"."item_status_enum" AS ENUM (
    'pending',
    'done',
    'cancelled',
    'confirmed',
    'tentative'
);


ALTER TYPE "public"."item_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."item_type_enum" AS ENUM (
    'event',
    'reminder'
);


ALTER TYPE "public"."item_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_preset_alerts"("p_item_id" "uuid", "p_event_start" timestamp with time zone, "p_preset_name" "text" DEFAULT 'standard'::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."add_preset_alerts"("p_item_id" "uuid", "p_event_start" timestamp with time zone, "p_preset_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_single_alert"("p_item_id" "uuid", "p_offset_minutes" integer, "p_relative_to" "public"."alert_relative_to_enum" DEFAULT 'event_start'::"public"."alert_relative_to_enum", "p_channel" "public"."alert_channel_enum" DEFAULT 'push'::"public"."alert_channel_enum") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."add_single_alert"("p_item_id" "uuid", "p_offset_minutes" integer, "p_relative_to" "public"."alert_relative_to_enum", "p_channel" "public"."alert_channel_enum") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_alert_presets"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_default_alert_presets"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_category_access"("p_category_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select
    -- Category exists (global/shared), OR user can access it via items that use it
    exists (
      select 1
      from public.categories c
      where c.id = p_category_id
    )
    or exists (
      select 1
      from public.item_categories ic
      join public.items i on i.id = ic.item_id
      where ic.category_id = p_category_id
        and (i.is_public = true or i.user_id = auth.uid())
    );
$$;


ALTER FUNCTION "public"."has_category_access"("p_category_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_item_access"("p_item_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.items i
    where i.id = p_item_id
      and (i.is_public = true or i.user_id = auth.uid())
  );
$$;


ALTER FUNCTION "public"."has_item_access"("p_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_rule_access"("p_rule_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.recurrence_rules rr
    join public.items i on i.id = rr.item_id
    where rr.id = p_rule_id
      and (i.is_public = true or i.user_id = auth.uid())
  );
$$;


ALTER FUNCTION "public"."has_rule_access"("p_rule_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_item"("p_item_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.items i
    where i.id = p_item_id
      and i.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."owns_item"("p_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."owns_rule"("p_rule_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
  select exists (
    select 1
    from public.recurrence_rules rr
    join public.items i on i.id = rr.item_id
    where rr.id = p_rule_id
      and i.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."owns_rule"("p_rule_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_alert_triggers"("p_item_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."recalculate_alert_triggers"("p_item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_items_prevent_illegal_type_switch"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if tg_op = 'UPDATE' and new.type <> old.type then
    if new.type = 'event' and exists (select 1 from public.reminder_details r where r.item_id = new.id) then
      raise exception 'Cannot change item % to event while ReminderDetails exist', new.id;
    elsif new.type = 'reminder' and exists (select 1 from public.event_details e where e.item_id = new.id) then
      raise exception 'Cannot change item % to reminder while EventDetails exist', new.id;
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_items_prevent_illegal_type_switch"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_items_responsible_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.is_public is null then
    new.is_public := false;
  end if;

  if new.responsible_user_id is null then
    new.responsible_user_id := new.user_id;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."tg_items_responsible_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trg_event_details_update_alerts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- When event time changes, recalculate all alerts
    IF (TG_OP = 'UPDATE' AND (NEW.start_at != OLD.start_at OR NEW.end_at != OLD.end_at))
       OR TG_OP = 'INSERT' THEN
        PERFORM recalculate_alert_triggers(NEW.item_id);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trg_event_details_update_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."alert_presets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "preset_config" "jsonb" NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."alert_presets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "kind" "public"."alert_kind_enum" NOT NULL,
    "trigger_at" timestamp with time zone,
    "offset_minutes" integer,
    "relative_to" "public"."alert_relative_to_enum",
    "repeat_every_minutes" integer,
    "max_repeats" integer,
    "channel" "public"."alert_channel_enum" DEFAULT 'push'::"public"."alert_channel_enum" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "last_fired_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_absolute_alert_trigger" CHECK ((("kind" <> 'absolute'::"public"."alert_kind_enum") OR ("trigger_at" IS NOT NULL))),
    CONSTRAINT "chk_max_repeats_positive" CHECK ((("max_repeats" IS NULL) OR ("max_repeats" > 0))),
    CONSTRAINT "chk_nag_alert_repeat" CHECK ((("kind" <> 'nag'::"public"."alert_kind_enum") OR ("repeat_every_minutes" IS NOT NULL))),
    CONSTRAINT "chk_offset_positive" CHECK ((("offset_minutes" IS NULL) OR ("offset_minutes" > 0))),
    CONSTRAINT "chk_relative_alert_fields" CHECK ((("kind" <> 'relative'::"public"."alert_kind_enum") OR (("offset_minutes" IS NOT NULL) AND ("relative_to" IS NOT NULL)))),
    CONSTRAINT "chk_repeat_positive" CHECK ((("repeat_every_minutes" IS NULL) OR ("repeat_every_minutes" > 0)))
);

ALTER TABLE ONLY "public"."alerts" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "storage_key" "text",
    "file_url" "text",
    "mime_type" "text",
    "size_bytes" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."attachments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."attachments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."categories_position_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."categories_position_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "color_hex" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "position" integer DEFAULT "nextval"('"public"."categories_position_seq"'::"regclass") NOT NULL
);

ALTER TABLE ONLY "public"."categories" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_details" (
    "item_id" "uuid" NOT NULL,
    "start_at" timestamp with time zone NOT NULL,
    "end_at" timestamp with time zone NOT NULL,
    "all_day" boolean DEFAULT false NOT NULL,
    "location_text" "text",
    CONSTRAINT "chk_event_time_range" CHECK (("end_at" >= "start_at"))
);

ALTER TABLE ONLY "public"."event_details" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."item_categories" (
    "item_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."item_categories" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."item_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."item_type_enum" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "public"."item_priority_enum" DEFAULT 'normal'::"public"."item_priority_enum" NOT NULL,
    "status" "public"."item_status_enum",
    "metadata_json" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "archived_at" timestamp with time zone,
    "is_public" boolean DEFAULT false NOT NULL,
    "responsible_user_id" "uuid" NOT NULL
);

ALTER TABLE ONLY "public"."items" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurrence_exceptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rule_id" "uuid" NOT NULL,
    "exdate" timestamp with time zone NOT NULL,
    "override_payload_json" "jsonb"
);

ALTER TABLE ONLY "public"."recurrence_exceptions" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurrence_exceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recurrence_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_id" "uuid" NOT NULL,
    "rrule" "text" NOT NULL,
    "start_anchor" timestamp with time zone NOT NULL,
    "end_until" timestamp with time zone,
    "count" integer
);

ALTER TABLE ONLY "public"."recurrence_rules" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."recurrence_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reminder_details" (
    "item_id" "uuid" NOT NULL,
    "due_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "estimate_minutes" integer,
    "has_checklist" boolean DEFAULT false NOT NULL,
    CONSTRAINT "chk_reminder_completed_after_due" CHECK ((("due_at" IS NULL) OR ("completed_at" IS NULL) OR ("completed_at" >= "due_at"))),
    CONSTRAINT "chk_reminder_estimate_nonneg" CHECK ((("estimate_minutes" IS NULL) OR ("estimate_minutes" >= 0)))
);

ALTER TABLE ONLY "public"."reminder_details" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."reminder_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."snoozes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "alert_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "snoozed_until" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."snoozes" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."snoozes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subtasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_item_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "done_at" timestamp with time zone,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE ONLY "public"."subtasks" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."subtasks" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_upcoming_alerts" WITH ("security_invoker"='on') AS
 SELECT "a"."id" AS "alert_id",
    "a"."item_id",
    "i"."title",
    "i"."type",
    "a"."trigger_at",
    "a"."offset_minutes",
    "a"."relative_to",
    "a"."channel",
    "ed"."start_at" AS "event_start",
    "ed"."end_at" AS "event_end",
    (EXTRACT(epoch FROM ("a"."trigger_at" - "now"())) / (60)::numeric) AS "minutes_until_trigger",
    "a"."last_fired_at",
    "a"."active"
   FROM (("public"."alerts" "a"
     JOIN "public"."items" "i" ON (("i"."id" = "a"."item_id")))
     LEFT JOIN "public"."event_details" "ed" ON (("ed"."item_id" = "a"."item_id")))
  WHERE (("a"."active" = true) AND ("a"."trigger_at" > "now"()) AND ("i"."user_id" = "auth"."uid"()))
  ORDER BY "a"."trigger_at";


ALTER VIEW "public"."v_upcoming_alerts" OWNER TO "postgres";


ALTER TABLE ONLY "public"."alert_presets"
    ADD CONSTRAINT "alert_presets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alert_presets"
    ADD CONSTRAINT "alert_presets_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_details"
    ADD CONSTRAINT "event_details_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."item_categories"
    ADD CONSTRAINT "pk_item_categories" PRIMARY KEY ("item_id", "category_id");



ALTER TABLE ONLY "public"."recurrence_exceptions"
    ADD CONSTRAINT "recurrence_exceptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recurrence_rules"
    ADD CONSTRAINT "recurrence_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reminder_details"
    ADD CONSTRAINT "reminder_details_pkey" PRIMARY KEY ("item_id");



ALTER TABLE ONLY "public"."snoozes"
    ADD CONSTRAINT "snoozes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subtasks"
    ADD CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_alerts_active_trigger" ON "public"."alerts" USING "btree" ("trigger_at") WHERE ("active" = true);



CREATE INDEX "idx_alerts_item" ON "public"."alerts" USING "btree" ("item_id");



CREATE INDEX "idx_alerts_item_trigger" ON "public"."alerts" USING "btree" ("item_id", "trigger_at") WHERE ("active" = true);



CREATE INDEX "idx_attachments_item" ON "public"."attachments" USING "btree" ("item_id");



CREATE INDEX "idx_categories_position" ON "public"."categories" USING "btree" ("position", "name");



CREATE INDEX "idx_event_details_end" ON "public"."event_details" USING "btree" ("end_at");



CREATE INDEX "idx_event_details_range" ON "public"."event_details" USING "btree" ("start_at", "end_at");



CREATE INDEX "idx_event_details_start" ON "public"."event_details" USING "btree" ("start_at");



CREATE INDEX "idx_item_categories_category" ON "public"."item_categories" USING "btree" ("category_id");



CREATE INDEX "idx_items_archived_at" ON "public"."items" USING "btree" ("user_id", "archived_at");



CREATE INDEX "idx_items_is_public" ON "public"."items" USING "btree" ("is_public");



CREATE INDEX "idx_items_metadata_gin" ON "public"."items" USING "gin" ("metadata_json");



CREATE INDEX "idx_items_responsible" ON "public"."items" USING "btree" ("responsible_user_id", "is_public");



CREATE INDEX "idx_items_user_id" ON "public"."items" USING "btree" ("user_id") WHERE ("archived_at" IS NULL);



CREATE INDEX "idx_items_user_priority" ON "public"."items" USING "btree" ("user_id", "priority");



CREATE INDEX "idx_items_user_status" ON "public"."items" USING "btree" ("user_id", "status");



CREATE INDEX "idx_items_user_type" ON "public"."items" USING "btree" ("user_id", "type");



CREATE INDEX "idx_recur_exceptions_rule" ON "public"."recurrence_exceptions" USING "btree" ("rule_id");



CREATE INDEX "idx_recur_rules_item" ON "public"."recurrence_rules" USING "btree" ("item_id");



CREATE INDEX "idx_recurrence_rules_item_user" ON "public"."recurrence_rules" USING "btree" ("item_id") INCLUDE ("id");



CREATE INDEX "idx_reminder_details_done" ON "public"."reminder_details" USING "btree" ("completed_at");



CREATE INDEX "idx_reminder_details_due" ON "public"."reminder_details" USING "btree" ("due_at");



CREATE INDEX "idx_snoozes_alert" ON "public"."snoozes" USING "btree" ("alert_id");



CREATE INDEX "idx_snoozes_item" ON "public"."snoozes" USING "btree" ("item_id");



CREATE UNIQUE INDEX "uq_event_details_item" ON "public"."event_details" USING "btree" ("item_id") WHERE ("item_id" IS NOT NULL);



CREATE UNIQUE INDEX "uq_reminder_details_item" ON "public"."reminder_details" USING "btree" ("item_id") WHERE ("item_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trg_categories_updated_at" BEFORE UPDATE ON "public"."categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_event_details_update_alerts" AFTER INSERT OR UPDATE ON "public"."event_details" FOR EACH ROW EXECUTE FUNCTION "public"."trg_event_details_update_alerts"();



CREATE OR REPLACE TRIGGER "trg_items_prevent_illegal_type_switch" BEFORE UPDATE OF "type" ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_items_prevent_illegal_type_switch"();



CREATE OR REPLACE TRIGGER "trg_items_responsible_defaults" BEFORE INSERT OR UPDATE OF "is_public", "responsible_user_id", "user_id" ON "public"."items" FOR EACH ROW EXECUTE FUNCTION "public"."tg_items_responsible_defaults"();



ALTER TABLE ONLY "public"."alert_presets"
    ADD CONSTRAINT "alert_presets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attachments"
    ADD CONSTRAINT "attachments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_details"
    ADD CONSTRAINT "event_details_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."item_categories"
    ADD CONSTRAINT "item_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."item_categories"
    ADD CONSTRAINT "item_categories_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_responsible_user_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurrence_exceptions"
    ADD CONSTRAINT "recurrence_exceptions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "public"."recurrence_rules"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recurrence_rules"
    ADD CONSTRAINT "recurrence_rules_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reminder_details"
    ADD CONSTRAINT "reminder_details_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snoozes"
    ADD CONSTRAINT "snoozes_alert_id_fkey" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."snoozes"
    ADD CONSTRAINT "snoozes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subtasks"
    ADD CONSTRAINT "subtasks_parent_item_id_fkey" FOREIGN KEY ("parent_item_id") REFERENCES "public"."items"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE "public"."alert_presets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "alert_presets_del" ON "public"."alert_presets" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "alert_presets_ins" ON "public"."alert_presets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "alert_presets_sel" ON "public"."alert_presets" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "alert_presets_upd" ON "public"."alert_presets" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."alerts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "alerts_del" ON "public"."alerts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "alerts"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "alerts_ins" ON "public"."alerts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "alerts"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "alerts_sel" ON "public"."alerts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "alerts"."item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "alerts_upd" ON "public"."alerts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "alerts"."item_id") AND ("items"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "alerts"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."attachments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "attachments_del" ON "public"."attachments" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "attachments"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "attachments_ins" ON "public"."attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "attachments"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "attachments_sel" ON "public"."attachments" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "attachments"."item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "attachments_upd" ON "public"."attachments" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "attachments"."item_id") AND ("items"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "attachments"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "categories_del" ON "public"."categories" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "categories_ins" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "categories_sel" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "categories_upd" ON "public"."categories" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."event_details" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_details_del" ON "public"."event_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "event_details"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "event_details_ins" ON "public"."event_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "event_details"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "event_details_sel" ON "public"."event_details" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "event_details"."item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "event_details_upd" ON "public"."event_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "event_details"."item_id") AND ("items"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "event_details"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."item_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "item_categories_del" ON "public"."item_categories" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "item_categories"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "item_categories_ins" ON "public"."item_categories" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "item_categories"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "item_categories_sel" ON "public"."item_categories" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "item_categories"."item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "item_categories_upd" ON "public"."item_categories" FOR UPDATE TO "authenticated" USING ("public"."owns_item"("item_id")) WITH CHECK ("public"."owns_item"("item_id"));



ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "items_del" ON "public"."items" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "items_ins" ON "public"."items" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "items_sel" ON "public"."items" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("is_public" = true)));



CREATE POLICY "items_upd" ON "public"."items" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."recurrence_exceptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recurrence_exceptions_del" ON "public"."recurrence_exceptions" FOR DELETE TO "authenticated" USING ("public"."owns_rule"("rule_id"));



CREATE POLICY "recurrence_exceptions_ins" ON "public"."recurrence_exceptions" FOR INSERT TO "authenticated" WITH CHECK ("public"."owns_rule"("rule_id"));



CREATE POLICY "recurrence_exceptions_sel" ON "public"."recurrence_exceptions" FOR SELECT TO "authenticated" USING ("public"."has_rule_access"("rule_id"));



CREATE POLICY "recurrence_exceptions_upd" ON "public"."recurrence_exceptions" FOR UPDATE TO "authenticated" USING ("public"."owns_rule"("rule_id")) WITH CHECK ("public"."owns_rule"("rule_id"));



ALTER TABLE "public"."recurrence_rules" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recurrence_rules_del" ON "public"."recurrence_rules" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "recurrence_rules"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "recurrence_rules_ins" ON "public"."recurrence_rules" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "recurrence_rules"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "recurrence_rules_sel" ON "public"."recurrence_rules" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "recurrence_rules"."item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "recurrence_rules_upd" ON "public"."recurrence_rules" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "recurrence_rules"."item_id") AND ("items"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "recurrence_rules"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."reminder_details" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reminder_details_del" ON "public"."reminder_details" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "reminder_details"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "reminder_details_ins" ON "public"."reminder_details" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "reminder_details"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "reminder_details_sel" ON "public"."reminder_details" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "reminder_details"."item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "reminder_details_upd" ON "public"."reminder_details" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "reminder_details"."item_id") AND ("items"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "reminder_details"."item_id") AND ("items"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."snoozes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "snoozes_del" ON "public"."snoozes" FOR DELETE TO "authenticated" USING ("public"."owns_item"("item_id"));



CREATE POLICY "snoozes_ins" ON "public"."snoozes" FOR INSERT TO "authenticated" WITH CHECK ("public"."owns_item"("item_id"));



CREATE POLICY "snoozes_sel" ON "public"."snoozes" FOR SELECT TO "authenticated" USING ("public"."has_item_access"("item_id"));



CREATE POLICY "snoozes_upd" ON "public"."snoozes" FOR UPDATE TO "authenticated" USING ("public"."owns_item"("item_id")) WITH CHECK ("public"."owns_item"("item_id"));



ALTER TABLE "public"."subtasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "subtasks_del" ON "public"."subtasks" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "subtasks"."parent_item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "subtasks_ins" ON "public"."subtasks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "subtasks"."parent_item_id") AND ("items"."user_id" = "auth"."uid"())))));



CREATE POLICY "subtasks_sel" ON "public"."subtasks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "subtasks"."parent_item_id") AND (("items"."user_id" = "auth"."uid"()) OR ("items"."is_public" = true))))));



CREATE POLICY "subtasks_upd" ON "public"."subtasks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "subtasks"."parent_item_id") AND ("items"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."items"
  WHERE (("items"."id" = "subtasks"."parent_item_id") AND ("items"."user_id" = "auth"."uid"())))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."add_preset_alerts"("p_item_id" "uuid", "p_event_start" timestamp with time zone, "p_preset_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_preset_alerts"("p_item_id" "uuid", "p_event_start" timestamp with time zone, "p_preset_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_preset_alerts"("p_item_id" "uuid", "p_event_start" timestamp with time zone, "p_preset_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_single_alert"("p_item_id" "uuid", "p_offset_minutes" integer, "p_relative_to" "public"."alert_relative_to_enum", "p_channel" "public"."alert_channel_enum") TO "anon";
GRANT ALL ON FUNCTION "public"."add_single_alert"("p_item_id" "uuid", "p_offset_minutes" integer, "p_relative_to" "public"."alert_relative_to_enum", "p_channel" "public"."alert_channel_enum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_single_alert"("p_item_id" "uuid", "p_offset_minutes" integer, "p_relative_to" "public"."alert_relative_to_enum", "p_channel" "public"."alert_channel_enum") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_alert_presets"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_alert_presets"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_alert_presets"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_category_access"("p_category_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_category_access"("p_category_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_category_access"("p_category_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_item_access"("p_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_item_access"("p_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_item_access"("p_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_rule_access"("p_rule_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_rule_access"("p_rule_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_rule_access"("p_rule_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owns_item"("p_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owns_item"("p_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_item"("p_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."owns_rule"("p_rule_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."owns_rule"("p_rule_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."owns_rule"("p_rule_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_alert_triggers"("p_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_alert_triggers"("p_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_alert_triggers"("p_item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_items_prevent_illegal_type_switch"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_items_prevent_illegal_type_switch"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_items_prevent_illegal_type_switch"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_items_responsible_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_items_responsible_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_items_responsible_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trg_event_details_update_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."trg_event_details_update_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trg_event_details_update_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."alert_presets" TO "anon";
GRANT ALL ON TABLE "public"."alert_presets" TO "authenticated";
GRANT ALL ON TABLE "public"."alert_presets" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."attachments" TO "anon";
GRANT ALL ON TABLE "public"."attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."attachments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_position_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_position_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_position_seq" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_details" TO "anon";
GRANT ALL ON TABLE "public"."event_details" TO "authenticated";
GRANT ALL ON TABLE "public"."event_details" TO "service_role";



GRANT ALL ON TABLE "public"."item_categories" TO "anon";
GRANT ALL ON TABLE "public"."item_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."item_categories" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."recurrence_exceptions" TO "anon";
GRANT ALL ON TABLE "public"."recurrence_exceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."recurrence_exceptions" TO "service_role";



GRANT ALL ON TABLE "public"."recurrence_rules" TO "anon";
GRANT ALL ON TABLE "public"."recurrence_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."recurrence_rules" TO "service_role";



GRANT ALL ON TABLE "public"."reminder_details" TO "anon";
GRANT ALL ON TABLE "public"."reminder_details" TO "authenticated";
GRANT ALL ON TABLE "public"."reminder_details" TO "service_role";



GRANT ALL ON TABLE "public"."snoozes" TO "anon";
GRANT ALL ON TABLE "public"."snoozes" TO "authenticated";
GRANT ALL ON TABLE "public"."snoozes" TO "service_role";



GRANT ALL ON TABLE "public"."subtasks" TO "anon";
GRANT ALL ON TABLE "public"."subtasks" TO "authenticated";
GRANT ALL ON TABLE "public"."subtasks" TO "service_role";



GRANT ALL ON TABLE "public"."v_upcoming_alerts" TO "anon";
GRANT ALL ON TABLE "public"."v_upcoming_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."v_upcoming_alerts" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


