-- Initial Seed Data for Stations
INSERT INTO stations (station_name, location, latitude, longitude, aquifer_type, critical_threshold_m, safe_decline_limit, installed_date, is_active) VALUES
('DWLR-101', 'Northwestern Basin - Zone A', 28.613900, 77.209000, 'Confined', 25.50, 0.150, '2022-04-12', 1),
('DWLR-202', 'Central Valley - Zone B', 22.572600, 88.363900, 'Unconfined', 18.20, 0.200, '2023-01-15', 1),
('DWLR-303', 'Eastern Plains - Sector C', 19.076000, 72.877700, 'Alluvial', 12.00, 0.100, '2023-06-20', 1),
('DWLR-402', 'Coastal Shelf - Zone D', 13.082700, 80.270700, 'Perched', 35.00, 0.250, '2021-11-01', 1),
('DWLR-505', 'Central Valley - Sector E', 12.971600, 77.594600, 'Confined', 40.00, 0.300, '2022-08-10', 1);

-- Note: User and readings seed are handled dynamically in backend initialization to properly hash passwords and set realistic relative timestamps.
