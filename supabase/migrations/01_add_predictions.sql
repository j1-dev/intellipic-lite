-- Create predictions table
create table public.predictions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now() not null,
  completed_at timestamptz,
  status text not null,
  prompt text not null,
  replicate_id text,
  original_image text,
  output_urls text[],

  constraint status_values check (status in ('processing', 'completed', 'failed'))
);

-- Enable RLS
alter table public.predictions enable row level security;

-- Create policies
create policy "Users can view own predictions"
  on public.predictions for select
  using ( auth.uid() = user_id );

create policy "Users can create predictions"
  on public.predictions for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own predictions"
  on public.predictions for update
  using ( auth.uid() = user_id );
