-- Add RLS policy to allow photographers to view cart_items for their photos
-- This enables the sales dashboard to show sales data

create policy "Photographers can view sales of their photos"
  on public.cart_items
  for select
  to authenticated
  using (photographer_id = auth.uid());

