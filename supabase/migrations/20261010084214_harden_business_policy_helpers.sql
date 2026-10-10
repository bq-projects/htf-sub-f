/*
# Harden business policy helper functions

1. Overview
- Moves the internal RLS helper functions out of the API-exposed `public` schema into a private schema.
- Keeps the businesses and business-members policies working without recursion.

2. Security changes
- Only signed-in users can execute the private policy helpers.
- Anonymous users cannot call these SECURITY DEFINER helpers through the Data API.
- The automatic new-user trigger function is no longer callable through the Data API.
- Sets a fixed search path on the existing search-vector trigger function.

3. Data safety
- No tables, columns, or rows are deleted or changed.
- Existing business access behavior is preserved.
*/

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_business_owner(p_business_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = p_business_id AND owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION private.is_business_member(p_business_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.business_members
    WHERE business_id = p_business_id AND user_id = p_user_id
  );
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
REVOKE ALL ON FUNCTION private.is_business_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_business_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_business_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_business_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "select_businesses" ON public.businesses;
DROP POLICY IF EXISTS "update_businesses" ON public.businesses;
CREATE POLICY "select_businesses" ON public.businesses
FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR private.is_business_member(id, auth.uid()));
CREATE POLICY "update_businesses" ON public.businesses
FOR UPDATE TO authenticated
USING (auth.uid() = owner_id OR private.is_business_member(id, auth.uid()))
WITH CHECK (auth.uid() = owner_id OR private.is_business_member(id, auth.uid()));

DROP POLICY IF EXISTS "select_business_members" ON public.business_members;
DROP POLICY IF EXISTS "insert_business_members" ON public.business_members;
DROP POLICY IF EXISTS "update_business_members" ON public.business_members;
DROP POLICY IF EXISTS "delete_business_members" ON public.business_members;
CREATE POLICY "select_business_members" ON public.business_members
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR private.is_business_owner(business_id, auth.uid()));
CREATE POLICY "insert_business_members" ON public.business_members
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR private.is_business_owner(business_id, auth.uid()));
CREATE POLICY "update_business_members" ON public.business_members
FOR UPDATE TO authenticated
USING (private.is_business_owner(business_id, auth.uid()))
WITH CHECK (private.is_business_owner(business_id, auth.uid()));
CREATE POLICY "delete_business_members" ON public.business_members
FOR DELETE TO authenticated
USING (auth.uid() = user_id OR private.is_business_owner(business_id, auth.uid()));

REVOKE ALL ON FUNCTION public.is_business_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_member(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
ALTER FUNCTION public.update_search_vector() SET search_path = public;