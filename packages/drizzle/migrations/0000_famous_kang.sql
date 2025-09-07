-- Custom SQL migration file, put your code below! --
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE FUNCTION uuidv7() RETURNS uuid
AS $$
  -- Replace the first 48 bits of a uuidv4 with the current
  -- number of milliseconds since 1970-01-01 UTC
  -- and set the "ver" field to 7 by setting additional bits
  select encode(
    set_bit(
      set_bit(
        overlay(uuid_send(gen_random_uuid()) placing
	  substring(int8send((extract(epoch from clock_timestamp())*1000)::bigint) from 3)
	  from 1 for 6),
	52, 1),
      53, 1), 'hex')::uuid;
$$ LANGUAGE sql volatile;

-- CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
-- BEGIN
--   NEW."updatedAt" = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- DROP TRIGGER IF EXISTS locations_set_updated_at ON locations;
-- CREATE TRIGGER locations_set_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS uke_locations_set_updated_at ON uke_locations;
-- CREATE TRIGGER uke_locations_set_updated_at BEFORE UPDATE ON uke_locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS stations_set_updated_at ON stations;
-- CREATE TRIGGER stations_set_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS cells_set_updated_at ON cells;
-- CREATE TRIGGER cells_set_updated_at BEFORE UPDATE ON cells FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS uke_permits_set_updated_at ON uke_permits;
-- CREATE TRIGGER uke_permits_set_updated_at BEFORE UPDATE ON uke_permits FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS uke_radiolines_set_updated_at ON uke_radiolines;
-- CREATE TRIGGER uke_radiolines_set_updated_at BEFORE UPDATE ON uke_radiolines FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS attachments_set_updated_at ON attachments;
-- CREATE TRIGGER attachments_set_updated_at BEFORE UPDATE ON attachments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS user_lists_set_updated_at ON user_lists;
-- CREATE TRIGGER user_lists_set_updated_at BEFORE UPDATE ON user_lists FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS station_comments_set_updated_at ON station_comments;
-- CREATE TRIGGER station_comments_set_updated_at BEFORE UPDATE ON station_comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS submissions_set_updated_at ON submissions.submissions;
-- CREATE TRIGGER submissions_set_updated_at BEFORE UPDATE ON submissions.submissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS proposed_cells_set_updated_at ON submissions.proposed_cells;
-- CREATE TRIGGER proposed_cells_set_updated_at BEFORE UPDATE ON submissions.proposed_cells FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS proposed_stations_set_updated_at ON submissions.proposed_stations;
-- CREATE TRIGGER proposed_stations_set_updated_at BEFORE UPDATE ON submissions.proposed_stations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- DROP TRIGGER IF EXISTS proposed_locations_set_updated_at ON submissions.proposed_locations;
-- CREATE TRIGGER proposed_locations_set_updated_at BEFORE UPDATE ON submissions.proposed_locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();