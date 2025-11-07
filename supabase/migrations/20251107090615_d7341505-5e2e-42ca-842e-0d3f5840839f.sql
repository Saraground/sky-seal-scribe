-- Add columns for Hi-Lift numbers
ALTER TABLE public.flights
ADD COLUMN hilift_1_number text,
ADD COLUMN hilift_2_number text;