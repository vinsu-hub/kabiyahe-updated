-- Retiring 'Dairy & Desserts' — its one row (DTRI) is a pasalubong dairy shop, not a café.
update public.delicacies set category = 'Local Favorites' where category = 'Dairy & Desserts';

alter table public.delicacies drop constraint if exists delicacies_category_check;
alter table public.delicacies add constraint delicacies_category_check
  check (category in ('Local Favorites','Street Food','Baked Goods','Cafes & Desserts','Filipino Classics','Healthy Eats','Drinks & Beverages','Market Finds'));

alter table public.delicacies add column if not exists dietary_tags text[] not null default '{}';
