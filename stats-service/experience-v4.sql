CREATE TABLE IF NOT EXISTS experience_events(day TEXT NOT NULL,event TEXT PRIMARY KEY,name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS experience_daily(day TEXT NOT NULL,name TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,name));
CREATE TRIGGER IF NOT EXISTS experience_count AFTER INSERT ON experience_events BEGIN
 INSERT INTO experience_daily(day,name,count) VALUES(NEW.day,NEW.name,1) ON CONFLICT(day,name) DO UPDATE SET count=count+1;
END;
CREATE INDEX IF NOT EXISTS experience_events_day ON experience_events(day);
