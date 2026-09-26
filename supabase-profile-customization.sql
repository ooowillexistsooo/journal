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
alter table posts
    add column if not exists moderation_status text not null default 'visible'
    check (moderation_status in ('visible', 'hidden'));

create table if not exists admin_users (
    user_id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
drop policy if exists "Users can see their own admin membership" on admin_users;
create policy "Users can see their own admin membership"
on admin_users for select
using (auth.uid() = user_id);

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1 from admin_users where user_id = auth.uid()
    );
$$;

grant execute on function is_admin() to authenticated;

drop policy if exists "Admins can read all posts" on posts;
create policy "Admins can read all posts"
on posts for select
using (is_admin());

drop policy if exists "Admins can update posts" on posts;
create policy "Admins can update posts"
on posts for update
using (is_admin())
with check (is_admin());

drop policy if exists "Admins can delete posts" on posts;
create policy "Admins can delete posts"
on posts for delete
using (is_admin());

drop policy if exists "Anyone can view public posts" on posts;
create policy "Anyone can view public posts"
on posts
for select
using (is_public = true and moderation_status = 'visible');

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

create table if not exists reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references auth.users(id) on delete cascade,
    post_id uuid references posts(id) on delete cascade,
    comment_id uuid references comments(id) on delete cascade,
    reason text not null check (char_length(reason) between 1 and 1000),
    status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
    created_at timestamptz not null default now(),
    reviewed_at timestamptz,
    check (num_nonnulls(post_id, comment_id) = 1)
);

alter table reports
    add column if not exists comment_id uuid references comments(id) on delete cascade,
    add column if not exists reviewed_at timestamptz;

update reports
set status = 'resolved'
where status = 'closed';

alter table reports enable row level security;
drop policy if exists "Users can file reports" on reports;
create policy "Users can file reports"
on reports for insert
with check (auth.uid() = reporter_id);

drop policy if exists "Admins can read reports" on reports;
create policy "Admins can read reports"
on reports for select
using (is_admin());

drop policy if exists "Admins can moderate reports" on reports;
create policy "Admins can moderate reports"
on reports for update
using (is_admin())
with check (is_admin());

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

drop policy if exists "Admins can read all comments" on comments;
create policy "Admins can read all comments"
on comments for select
using (is_admin());

drop policy if exists "Users can create their own comments" on comments;
create policy "Users can create their own comments"
on comments
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on comments;
create policy "Users can delete their own comments"
on comments for delete
using (auth.uid() = user_id or is_admin());

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
