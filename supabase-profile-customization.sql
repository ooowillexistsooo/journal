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

create table if not exists likes (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (post_id, user_id)
);

create table if not exists comments (
    id uuid primary key default gen_random_uuid(),
    post_id uuid not null references posts(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    content text not null check (char_length(content) between 1 and 1000),
    created_at timestamptz not null default now()
);

alter table likes enable row level security;
alter table comments enable row level security;

drop policy if exists "Anyone can view likes" on likes;
create policy "Anyone can view likes"
on likes
for select
using (true);

drop policy if exists "Users can create their own likes" on likes;
create policy "Users can create their own likes"
on likes
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own likes" on likes;
create policy "Users can delete their own likes"
on likes
for delete
using (auth.uid() = user_id);

drop policy if exists "Anyone can view comments" on comments;
create policy "Anyone can view comments"
on comments
for select
using (true);

drop policy if exists "Users can create their own comments" on comments;
create policy "Users can create their own comments"
on comments
for insert
with check (auth.uid() = user_id);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'comments_profile_id_fkey'
    ) then
        alter table comments
            add constraint comments_profile_id_fkey
            foreign key (user_id) references profiles(id) on delete cascade;
    end if;
end
$$;
