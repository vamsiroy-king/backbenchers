-- 1. Create Tables (Idempotent)
create table if not exists public.online_brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  logo_url text,
  cover_image_url text,
  description text,
  website_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.online_offers (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.online_brands(id) on delete cascade not null,
  title text not null,
  description text,
  code text,
  link text,
  expiry_date timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.online_brands enable row level security;
alter table public.online_offers enable row level security;

-- Drop old policies to avoid duplicates
drop policy if exists "Enable read access for all users" on public.online_brands;
drop policy if exists "Enable write access for authenticated users" on public.online_brands;
drop policy if exists "Enable read access for all users" on public.online_offers;
drop policy if exists "Enable write access for authenticated users" on public.online_offers;

-- Create Policies
create policy "Enable read access for all users" on public.online_brands for select using (true);
create policy "Enable read access for all users" on public.online_offers for select using (true);
create policy "Enable write access for authenticated users" on public.online_brands for all using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users" on public.online_offers for all using (auth.role() = 'authenticated');

-- 3. STORAGE SETUP (CRITICAL FOR UPLOAD)
insert into storage.buckets (id, name, public)
values ('online-brands', 'online-brands', true)
on conflict (id) do nothing;

-- Allow public read of images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'online-brands' );

-- Allow authenticated upload (Admins)
create policy "Authenticated Upload"
on storage.objects for insert
with check ( bucket_id = 'online-brands' and auth.role() = 'authenticated' );

-- Allow authenticated update/delete
create policy "Authenticated Update"
on storage.objects for update
using ( bucket_id = 'online-brands' and auth.role() = 'authenticated' );

create policy "Authenticated Delete"
on storage.objects for delete
using ( bucket_id = 'online-brands' and auth.role() = 'authenticated' );
