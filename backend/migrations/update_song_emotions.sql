-- Update all existing songs with NULL or 'Neutral' emotion to 'Feel Good' as default
UPDATE songs 
SET emotion = 'Feel Good' 
WHERE emotion IS NULL OR emotion = 'Neutral' OR emotion = '';

-- This ensures all songs have a valid emotion for filtering
