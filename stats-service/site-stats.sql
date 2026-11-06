CREATE TABLE IF NOT EXISTS site_visits (site TEXT NOT NULL, day TEXT NOT NULL, visitor TEXT NOT NULL, event TEXT NOT NULL, PRIMARY KEY(site,event));
CREATE INDEX IF NOT EXISTS site_visits_day ON site_visits(site,day);
CREATE TABLE IF NOT EXISTS site_stats_meta (id INTEGER PRIMARY KEY, started TEXT NOT NULL);
INSERT OR IGNORE INTO site_stats_meta VALUES(1,datetime('now'));
