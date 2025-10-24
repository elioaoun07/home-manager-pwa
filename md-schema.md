| info                            | create_statement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| -- Table: alerts                | CREATE TABLE alerts (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  kind alert_kind_enum NOT NULL,
  trigger_at timestamptz,
  offset_minutes int4,
  relative_to alert_relative_to_enum,
  repeat_every_minutes int4,
  max_repeats int4,
  channel alert_channel_enum NOT NULL DEFAULT 'push'::alert_channel_enum,
  active bool NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
); |
| -- Table: attachments           | CREATE TABLE attachments (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  storage_key text,
  file_url text,
  mime_type text,
  size_bytes int8,
  created_at timestamptz NOT NULL DEFAULT now()
);                                                                                                                                                                                                                                                                                        |
| -- Table: categories            | CREATE TABLE categories (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color_hex text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  position int4 NOT NULL DEFAULT nextval('categories_position_seq'::regclass)
);                                                                                                                                                                                                                    |
| -- Table: event_details         | CREATE TABLE event_details (  item_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day bool NOT NULL DEFAULT false,
  location_text text
);                                                                                                                                                                                                                                                                                                                                  |
| -- Table: item_categories       | CREATE TABLE item_categories (  item_id uuid NOT NULL,
  category_id uuid NOT NULL
);                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -- Table: items                 | CREATE TABLE items (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type item_type_enum NOT NULL,
  title text NOT NULL,
  description text,
  priority item_priority_enum NOT NULL DEFAULT 'normal'::item_priority_enum,
  status item_status_enum,
  metadata_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  is_public bool NOT NULL DEFAULT false,
  responsible_user_id uuid NOT NULL
);    |
| -- Table: recurrence_exceptions | CREATE TABLE recurrence_exceptions (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL,
  exdate timestamptz NOT NULL,
  override_payload_json jsonb
);                                                                                                                                                                                                                                                                                                                                           |
| -- Table: recurrence_rules      | CREATE TABLE recurrence_rules (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  rrule text NOT NULL,
  start_anchor timestamptz NOT NULL,
  end_until timestamptz,
  count int4
);                                                                                                                                                                                                                                                                                                           |
| -- Table: reminder_details      | CREATE TABLE reminder_details (  item_id uuid NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  estimate_minutes int4,
  has_checklist bool NOT NULL DEFAULT false
);                                                                                                                                                                                                                                                                                                                                    |
| -- Table: snoozes               | CREATE TABLE snoozes (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL,
  item_id uuid NOT NULL,
  snoozed_until timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);                                                                                                                                                                                                                                                                                                      |
| -- Table: subtasks              | CREATE TABLE subtasks (  id uuid NOT NULL DEFAULT gen_random_uuid(),
  parent_item_id uuid NOT NULL,
  title text NOT NULL,
  done_at timestamptz,
  order_index int4 NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);                                                                                                                                                                                                                        |