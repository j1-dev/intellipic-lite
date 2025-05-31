-- Create credits table to track user credits
create table credits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  amount int not null default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create trigger to update updated_at
create or replace function update_credits_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger credits_updated_at
  before update on credits
  for each row
  execute function update_credits_updated_at_column();

-- Modify existing handle_new_user function to also create credits
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into users table (existing functionality)
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  -- Insert initial credits
  insert into public.credits (user_id, amount)
  values (new.id, 5);
  
  return new;
end;
$$ language plpgsql security definer;

-- Create RLS policies
alter table credits enable row level security;

create policy "Users can view their own credits"
  on credits for select
  using (auth.uid() = user_id);

create policy "Only service role can insert credits"
  on credits for insert
  with check (auth.role() = 'service_role');

create policy "Only service role can update credits"
  on credits for update
  using (auth.role() = 'service_role');

-- Initialize credits for existing users
insert into credits (user_id, amount)
select id, 5
from auth.users
where id not in (select user_id from credits)
on conflict (user_id) do nothing;
