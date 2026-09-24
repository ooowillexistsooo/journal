alter table profiles
    add column if not exists display_name text,
    add column if not exists bio text,
    add column if not exists avatar_url text,
    add column if not exists custom_html text not null default '',
    add column if not exists custom_css text not null default '';

alter table profiles enable row level security;

drop policy if exists "Anyone can view profiles" on profiles;
create policy "Anyone can view profiles"
on profiles
for select
using (true);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

alter table posts
    add column if not exists is_public boolean not null default false;

alter table posts enable row level security;

drop policy if exists "Anyone can view public posts" on posts;
create policy "Anyone can view public posts"
on posts
for select
using (is_public = true);
