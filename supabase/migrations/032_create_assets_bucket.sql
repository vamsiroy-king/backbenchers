-- Create a public 'assets' bucket for general static files (logos, banners, etc.)
insert into storage.buckets (id, name, public)
values ('assets', 'assets', true)
on conflict (id) do nothing;

-- Allow public access to 'assets'
create policy "Public Access to Assets"
  on storage.objects for select
  using ( bucket_id = 'assets' );

-- Allow authenticated uploads to 'assets' (for admin dashboard usage later)
create policy "Authenticated Uploads to Assets"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'assets' );
