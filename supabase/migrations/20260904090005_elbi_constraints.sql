-- Support upsert-by-name for tour operators (admin "add operator" flow).
alter table public.tour_operators add constraint tour_operators_name_key unique (name);
