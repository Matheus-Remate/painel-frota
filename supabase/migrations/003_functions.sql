-- Função para processar check-in e atualizar status do veículo automaticamente
CREATE OR REPLACE FUNCTION process_check_in()
RETURNS TRIGGER AS $$
BEGIN
  -- Detecta se há problemas
  IF NEW.cleanliness_status IN ('ALERT', 'DAMAGE') OR
     NEW.dash_lights_status IN ('ALERT', 'DAMAGE') OR
     NEW.tires_exterior_status IN ('ALERT', 'DAMAGE') THEN
    
    -- Marca flag de problemas
    NEW.has_issues = TRUE;
    
    -- Atualiza status do veículo para AWAITING_REPAIR
    UPDATE vehicles
    SET status = 'AWAITING_REPAIR'
    WHERE id = NEW.vehicle_id;
    
    -- Cancela reservas futuras
    UPDATE reservations
    SET status = 'CANCELLED'
    WHERE vehicle_id = NEW.vehicle_id
      AND start_date >= NOW()
      AND status = 'ACTIVE';
  ELSE
    -- Se tudo OK, volta para pátio
    UPDATE vehicles
    SET status = 'IN_YARD'
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para processar check-in automaticamente
CREATE TRIGGER on_check_in_created
  BEFORE INSERT ON check_ins
  FOR EACH ROW
  EXECUTE FUNCTION process_check_in();

-- Função para verificar disponibilidade de veículo
CREATE OR REPLACE FUNCTION is_vehicle_available(vehicle_uuid UUID, start_dt TIMESTAMPTZ, end_dt TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
DECLARE
  vehicle_current_status vehicle_status;
  conflicting_reservations INTEGER;
BEGIN
  -- Verifica status do veículo
  SELECT status INTO vehicle_current_status
  FROM vehicles
  WHERE id = vehicle_uuid;
  
  -- Apenas veículos IN_YARD estão disponíveis
  IF vehicle_current_status != 'IN_YARD' THEN
    RETURN FALSE;
  END IF;
  
  -- Verifica conflitos de reserva
  SELECT COUNT(*) INTO conflicting_reservations
  FROM reservations
  WHERE vehicle_id = vehicle_uuid
    AND status = 'ACTIVE'
    AND (
      (start_date <= start_dt AND end_date >= start_dt) OR
      (start_date <= end_dt AND end_date >= end_dt) OR
      (start_date >= start_dt AND end_date <= end_dt)
    );
  
  RETURN conflicting_reservations = 0;
END;
$$ LANGUAGE plpgsql;
