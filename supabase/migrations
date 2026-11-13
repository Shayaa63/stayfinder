-- ==========================================
-- STAYFINDER: RLS + POLICIES
-- ==========================================

-- 1. AKTIVERA RLS

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings   ENABLE ROW LEVEL SECURITY;


-- 2. POLICIES: PROPERTIES

DROP POLICY IF EXISTS "Published properties are visible" ON public.properties;
DROP POLICY IF EXISTS "Users can create their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

CREATE POLICY "Published properties are visible"
ON public.properties
FOR SELECT
TO anon, authenticated
USING (
  is_published = true
  OR user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can create their own properties"
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);

CREATE POLICY "Users can update their own properties"
ON public.properties
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own properties"
ON public.properties
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));


-- 3. POLICIES: BOOKINGS

DROP POLICY IF EXISTS "Guests and property owners can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests and property owners can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can delete their own bookings" ON public.bookings;

CREATE POLICY "Guests and property owners can view bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.properties
    WHERE properties.property_id = bookings.property_id
      AND properties.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Guests and property owners can update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.properties
    WHERE properties.property_id = bookings.property_id
      AND properties.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.properties
    WHERE properties.property_id = bookings.property_id
      AND properties.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Guests can delete their own bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));


-- 4. SKYDD MOT MISSBRUK VID UPPDATERING AV BOKNINGAR
-- - Bara boendets ägare får ändra status (gästen får dock avboka).
-- - user_id och property_id får inte ändras.
-- - SQL Editor, migrationer och service role (auth.uid() IS NULL) påverkas inte.

CREATE OR REPLACE FUNCTION public.protect_booking_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_owner boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.property_id IS DISTINCT FROM OLD.property_id THEN
    RAISE EXCEPTION 'user_id and property_id cannot be changed';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.properties p
      WHERE p.property_id = OLD.property_id
        AND p.user_id = auth.uid()
    ) INTO is_owner;

    IF NOT is_owner AND NEW.status::text <> 'cancelled' THEN
      RAISE EXCEPTION 'Only the property owner can change booking status (guests may cancel)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_columns ON public.bookings;

CREATE TRIGGER protect_booking_columns
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.protect_booking_columns();