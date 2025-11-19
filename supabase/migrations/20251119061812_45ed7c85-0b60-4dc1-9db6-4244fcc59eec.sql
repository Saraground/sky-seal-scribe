-- Add padlock_total column to flights table
ALTER TABLE public.flights 
ADD COLUMN padlock_total text;

-- Add comment to explain the column
COMMENT ON COLUMN public.flights.padlock_total IS 'Total number of padlocks used for the flight';