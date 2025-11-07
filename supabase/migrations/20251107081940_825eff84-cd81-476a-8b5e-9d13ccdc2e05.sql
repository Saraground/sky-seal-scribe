-- Add Hi-Lift seal number columns to flights table
ALTER TABLE public.flights 
ADD COLUMN hilift_1_seal TEXT,
ADD COLUMN hilift_2_seal TEXT;