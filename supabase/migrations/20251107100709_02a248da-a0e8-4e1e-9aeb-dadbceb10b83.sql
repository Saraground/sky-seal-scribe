-- Add rear seal number columns to flights table
ALTER TABLE public.flights 
ADD COLUMN hilift_1_rear_seal text,
ADD COLUMN hilift_2_rear_seal text;