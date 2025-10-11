-- Drop existing policies if they exist
drop policy if exists categories_sel on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update on public.categories;
drop policy if exists categories_delete on public.categories;

-- Allow authenticated users to read all categories
create policy categories_sel
on public.categories
for select
to authenticated
using (true);

-- Allow authenticated users to insert categories
create policy categories_insert
on public.categories
for insert
to authenticated
with check (true);

-- Allow authenticated users to update categories
create policy categories_update
on public.categories
for update
to authenticated
using (true);

-- Allow authenticated users to delete categories
create policy categories_delete
on public.categories
for delete
to authenticated
using (true);
