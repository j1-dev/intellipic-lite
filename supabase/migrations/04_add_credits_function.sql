-- Function to safely add credits to a user
create or replace function add_credits(p_user_id uuid, p_amount int)
returns void as $$
begin
  insert into credits (user_id, amount)
  values (p_user_id, p_amount)
  on conflict (user_id) 
  do update set 
    amount = credits.amount + p_amount,
    updated_at = timezone('utc'::text, now());
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function add_credits(uuid, int) to authenticated;

-- Example of how to use:
-- Add 5 credits: select add_credits(user_id, 5);
-- Remove 1 credit: select add_credits(user_id, -1);
