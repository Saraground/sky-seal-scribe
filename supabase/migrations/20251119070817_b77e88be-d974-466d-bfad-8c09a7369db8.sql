-- Add driver name and ID columns to flights table
ALTER TABLE public.flights 
ADD COLUMN driver_name TEXT,
ADD COLUMN driver_id TEXT;