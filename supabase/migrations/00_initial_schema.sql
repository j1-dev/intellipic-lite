-- Create users table that extends Supabase auth.users
create table public.users (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'starter', 'pro', 'enterprise')),
  credits_remaining integer default 5,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create images table
create table public.images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  url text not null,
  prompt text not null,
  negative_prompt text,
  model_version text,
  width integer,
  height integer,
  created_at timestamptz default now() not null
);

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.images enable row level security;

-- Create policies
create policy "Users can view own profile"
  on public.users for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on public.users for update
  using ( auth.uid() = id );

create policy "Users can view own images"
  on public.images for select
  using ( auth.uid() = user_id );

create policy "Users can insert own images"
  on public.images for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own images"
  on public.images for delete
  using ( auth.uid() = user_id );

-- Create function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updating timestamp
create trigger handle_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();
