/*
# Revoke legacy public policy helper access

1. Overview
- Removes direct API execution access from legacy public SECURITY DEFINER functions.
- These public helper functions are no longer used by the active RLS policies; the active policy helpers live in the private schema.

2. Security changes
- Anonymous and authenticated clients cannot call the legacy helpers through RPC.
- The auth trigger function remains available internally to the auth trigger but is not callable through the Data API.

3. Data safety
- No tables, columns, or rows are modified.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_business_owner(uuid, uuid) FROM PUBLIC, anon, authenticated;