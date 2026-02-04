-- Add deleted_at column for soft delete support
ALTER TABLE vehicles 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Optional: Index on deleted_at for performance if table grows large
CREATE INDEX idx_vehicles_deleted_at ON vehicles(deleted_at);
