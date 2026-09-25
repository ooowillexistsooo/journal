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

create table if not exists profile_revisions (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references profiles(id) on delete cascade,
    custom_html text not null default '',
    custom_css text not null default '',
    created_at timestamptz not null default now()
);

alter table profile_revisions enable row level security;

drop policy if exists "Users can view their profile revisions" on profile_revisions;
create policy "Users can view their profile revisions"
on profile_revisions
for select
using (auth.uid() = profile_id);

drop policy if exists "Users can create their profile revisions" on profile_revisions;
create policy "Users can create their profile revisions"
on profile_revisions
for insert
with check (auth.uid() = profile_id);

alter table posts
    add column if not exists is_public boolean not null default false;

alter table posts enable row level security;

drop policy if exists "Anyone can view public posts" on posts;
create policy "Anyone can view public posts"
on posts
for select
using (is_public = true);
