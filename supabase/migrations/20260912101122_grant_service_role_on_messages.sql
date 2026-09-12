-- "Automatically expose new tables" was off when this table was created, so
-- PostgREST has no grants for it at all — not even for service_role, which is
-- why the webhook's insert got a 403. Grant only service_role: this table holds
-- customer conversation data, so anon and authenticated must stay unable to read it.
grant insert, select on messages to service_role;
