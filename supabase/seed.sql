-- Seed basic data
insert into public.items (id, name, unit) values
  ('00000000-0000-0000-0000-000000000001', 'Rice 50kg', 'bag'),
  ('00000000-0000-0000-0000-000000000002', 'Beans 5kg', 'bag'),
  ('00000000-0000-0000-0000-000000000003', 'Tomato 1kg', 'kg')
on conflict (id) do nothing;

insert into public.markets (id, name, url) values
  ('10000000-0000-0000-0000-000000000001', 'Jumia', 'https://www.jumia.com.ng'),
  ('10000000-0000-0000-0000-000000000002', 'Konga', 'https://www.konga.com')
on conflict (id) do nothing;

insert into public.prices (item_id, market_id, price, date_scraped) values
  ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 47000, now()),
  ('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 6200, now()),
  ('00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 1200, now())
on conflict do nothing;



