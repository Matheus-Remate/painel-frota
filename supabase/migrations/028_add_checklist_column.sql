-- Add checklist column for dynamic mobile check-in data
ALTER TABLE public.check_ins 
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '{}'::jsonb;
