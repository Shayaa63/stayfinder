
-- ==========================================
-- STAYFINDER: SKÄRPTA BOKNINGSREGLER (002)
-- ==========================================
-- Tar bort DELETE-policies för bokningar.
-- Inför databasregler för tillåtna bokningsuppdateringar.
--
-- Bokningar raderas inte permanent.
-- Gäst och värd kan avboka genom status = 'cancelled'.
-- Avbokade bokningar kan inte ändras.
--
-- auth.uid() IS NULL tillåts för betrodda operationer
-- som migrationskörningar och service role.

-- 1. Ta bort policies som tillåter permanent radering av bokningar.

DROP POLICY IF EXISTS "Delete own or received bookings"
ON public.bookings;

DROP POLICY IF EXISTS "Guests can delete their own bookings"
ON public.bookings;

-- 2. Skydda bokningsuppdateringar.

CREATE OR REPLACE FUNCTION public.protect_booking_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  is_owner boolean;
  is_guest boolean;
BEGIN
  -- Betrodda serveroperationer och migrationskörningar.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Avbokade bokningar är låsta.
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled bookings cannot be modified';
  END IF;

  -- Bokningens ägare och boende får aldrig bytas.
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.property_id IS DISTINCT FROM OLD.property_id THEN
    RAISE EXCEPTION 'user_id and property_id cannot be changed';
  END IF;

  is_guest := OLD.user_id = auth.uid();

  SELECT EXISTS (
    SELECT 1
    FROM public.properties AS p
    WHERE p.property_id = OLD.property_id
      AND p.user_id = auth.uid()
  )
  INTO is_owner;

  -- Ingen annan än gästen eller boendets ägare får uppdatera.
  IF NOT is_guest AND NOT is_owner THEN
    RAISE EXCEPTION 'Not authorized to update this booking';
  END IF;

  IF is_guest THEN

    -- Gästen får avboka, men får inte kombinera avbokning
    -- med ändringar av andra bokningsuppgifter.
    IF NEW.status IS DISTINCT FROM OLD.status THEN

      IF NEW.status IS DISTINCT FROM 'cancelled' THEN
        RAISE EXCEPTION 'Guests may only cancel bookings';
      END IF;

      IF NEW.guest_name IS DISTINCT FROM OLD.guest_name
         OR NEW.guest_email IS DISTINCT FROM OLD.guest_email
         OR NEW.check_in IS DISTINCT FROM OLD.check_in
         OR NEW.check_out IS DISTINCT FROM OLD.check_out
         OR NEW.guests IS DISTINCT FROM OLD.guests THEN
        RAISE EXCEPTION 'Cancellation cannot modify booking details';
      END IF;

    ELSE

      -- Gästen får bara ändra uppgifter medan bokningen är pending.
      IF OLD.status <> 'pending' THEN
        RAISE EXCEPTION 'Only pending bookings can be edited by guests';
      END IF;

      -- Gästens namn och e-post är låsta efter att bokningen skapats.
      IF NEW.guest_name IS DISTINCT FROM OLD.guest_name
         OR NEW.guest_email IS DISTINCT FROM OLD.guest_email THEN
        RAISE EXCEPTION 'Guest name and email cannot be changed';
      END IF;

    END IF;

  ELSE

    -- Värden får bara ändra status.
    IF NEW.status IS NOT DISTINCT FROM OLD.status
       OR NEW.guest_name IS DISTINCT FROM OLD.guest_name
       OR NEW.guest_email IS DISTINCT FROM OLD.guest_email
       OR NEW.check_in IS DISTINCT FROM OLD.check_in
       OR NEW.check_out IS DISTINCT FROM OLD.check_out
       OR NEW.guests IS DISTINCT FROM OLD.guests THEN
      RAISE EXCEPTION 'Hosts may only change booking status';
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- Klienter ska inte kunna anropa triggerfunktionen direkt.
REVOKE ALL ON FUNCTION public.protect_booking_columns()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_booking_columns
ON public.bookings;

CREATE TRIGGER protect_booking_columns
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.protect_booking_columns();
