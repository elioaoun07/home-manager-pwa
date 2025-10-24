| function_statement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CREATE OR REPLACE FUNCTION has_category_access() RETURNS boolean AS $$

  select
    exists (select 1 from public.categories c
            where c.id = p_category_id and c.user_id = auth.uid())
    or
    exists (
      select 1
      from public.item_categories ic
      join public.items i on i.id = ic.item_id
      where ic.category_id = p_category_id
        and (i.is_public = true or i.user_id = auth.uid())
    );

$$ LANGUAGE SQL;                                                                                                                                                                               |
| CREATE OR REPLACE FUNCTION has_item_access() RETURNS boolean AS $$

  select exists (
    select 1
    from public.items i
    where i.id = p_item_id
      and (i.is_public = true or i.user_id = auth.uid())
  );

$$ LANGUAGE SQL;                                                                                                                                                                                                                                                                                                                                                                                                      |
| CREATE OR REPLACE FUNCTION has_rule_access() RETURNS boolean AS $$

  select exists (
    select 1
    from public.recurrence_rules rr
    join public.items i on i.id = rr.item_id
    where rr.id = p_rule_id
      and (i.is_public = true or i.user_id = auth.uid())
  );

$$ LANGUAGE SQL;                                                                                                                                                                                                                                                                                                                                           |
| CREATE OR REPLACE FUNCTION owns_item() RETURNS boolean AS $$

  select exists (
    select 1
    from public.items i
    where i.id = p_item_id
      and i.user_id = auth.uid()
  );

$$ LANGUAGE SQL;                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CREATE OR REPLACE FUNCTION owns_rule() RETURNS boolean AS $$

  select exists (
    select 1
    from public.recurrence_rules rr
    join public.items i on i.id = rr.item_id
    where rr.id = p_rule_id
      and i.user_id = auth.uid()
  );

$$ LANGUAGE SQL;                                                                                                                                                                                                                                                                                                                                                                         |
| CREATE OR REPLACE FUNCTION tg_items_prevent_illegal_type_switch() RETURNS trigger AS $$

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

$$ LANGUAGE PLPGSQL; |
| CREATE OR REPLACE FUNCTION tg_items_responsible_defaults() RETURNS trigger AS $$

begin
  if new.is_public is null then
    new.is_public := false;
  end if;

  if new.responsible_user_id is null then
    new.responsible_user_id := new.user_id;
  end if;

  return new;
end;

$$ LANGUAGE PLPGSQL;                                                                                                                                                                                                                                                                                                                              |