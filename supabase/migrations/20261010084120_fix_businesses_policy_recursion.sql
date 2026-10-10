/*
# Fix businesses policy recursion

1. Overview
- Removes the circular RLS dependency between `businesses` and `business_members`.
- The previous policies checked `business_members` from `businesses`, while `business_members` checked `businesses` again, causing PostgreSQL to stop with "infinite recursion detected in policy".

2. Security helpers
- Adds `public.is_business_owner` as a SECURITY DEFINER helper that checks ownership without re-entering RLS.
- Adds `public.is_business_member` as a SECURITY DEFINER helper that checks membership without re-entering RLS.
- Both helpers use a fixed `search_path` and are callable only by authenticated users.

3. Modified policies
- Replaces policies on `businesses` and `business_members` with equivalent owner/member checks that call the helpers.
- No user data, tables, columns, or rows are deleted.

4. Important notes
- Owners can still manage their own businesses and memberships.
- Members can still read businesses they belong to.
- The change is idempotent and safe to apply again.
*/

CREATE OR REPLACE FUNCTION public.is_business_owner(p_business_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE id = p_business_id
      AND owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(p_business_id uuid, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.business_members
    WHERE business_id = p_business_id
      AND user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_business_owner(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_business_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_business_owner(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_business_member(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "select_businesses" ON public.businesses;
DROP POLICY IF EXISTS "insert_businesses" ON public.businesses;
DROP POLICY IF EXISTS "update_businesses" ON public.businesses;
DROP POLICY IF EXISTS "delete_businesses" ON public.businesses;

CREATE POLICY "select_businesses" ON public.businesses
FOR SELECT TO authenticated
USING (
  auth.uid() = owner_id
  OR public.is_business_member(id, auth.uid())
);

CREATE POLICY "insert_businesses" ON public.businesses
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "update_businesses" ON public.businesses
FOR UPDATE TO authenticated
USING (
  auth.uid() = owner_id
  OR public.is_business_member(id, auth.uid())
)
WITH CHECK (
  auth.uid() = owner_id
  OR public.is_business_member(id, auth.uid())
);

CREATE POLICY "delete_businesses" ON public.businesses
FOR DELETE TO authenticated
USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "select_business_members" ON public.business_members;
DROP POLICY IF EXISTS "insert_business_members" ON public.business_members;
DROP POLICY IF EXISTS "update_business_members" ON public.business_members;
DROP POLICY IF EXISTS "delete_business_members" ON public.business_members;

CREATE POLICY "select_business_members" ON public.business_members
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_business_owner(business_id, auth.uid())
);

CREATE POLICY "insert_business_members" ON public.business_members
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.is_business_owner(business_id, auth.uid())
);

CREATE POLICY "update_business_members" ON public.business_members
FOR UPDATE TO authenticated
USING (public.is_business_owner(business_id, auth.uid()))
WITH CHECK (public.is_business_owner(business_id, auth.uid()));

CREATE POLICY "delete_business_members" ON public.business_members
FOR DELETE TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_business_owner(business_id, auth.uid())
);