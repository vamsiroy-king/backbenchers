-- 1. Create Online Brands Table
create table public.online_brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null, -- 'Food', 'Fashion', 'Fitness', 'Beauty', 'Tech'
  logo_url text,
  cover_image_url text,
  description text,
  website_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Online Offers Table
create table public.online_offers (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.online_brands(id) on delete cascade not null,
  title text not null, -- e.g. "Flat 50% Off"
  description text,
  code text,
  link text,
  expiry_date timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable Public Access (Simplest for now)
alter table public.online_brands enable row level security;
alter table public.online_offers enable row level security;

create policy "Enable read access for all users" on public.online_brands for select using (true);
create policy "Enable read access for all users" on public.online_offers for select using (true);

create policy "Enable write access for authenticated users" on public.online_brands for all using (auth.role() = 'authenticated');
create policy "Enable write access for authenticated users" on public.online_offers for all using (auth.role() = 'authenticated');
