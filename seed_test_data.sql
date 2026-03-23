-- Insert test users if they don't exist
INSERT INTO users (name, email, password_hash, role) VALUES
('Alice', 'alice@test.com', 'hash1', 'buyer'),
('Bob', 'bob@test.com', 'hash2', 'seller'),
('Charlie', 'charlie@test.com', 'hash3', 'seller')
ON CONFLICT (email) DO NOTHING;

-- Insert test vehicles
INSERT INTO vehicles (user_id, make, model, year, price, mileage_hours, condition, status, description, image_url) VALUES
(2, 'Honda', 'CRF250R', 2021, '7899.00', 120, 'used', 'available', 'Dirt bike', '["https://example.com/1.jpg"]'),
(2, 'Yamaha', 'YZ450F', 2022, '9499.00', 80, 'used', 'available', 'Motocross', '["https://example.com/2.jpg"]'),
(3, 'Polaris', 'Sportsman', 2020, '6999.00', 200, 'used', 'available', 'ATV', '["https://example.com/3.jpg"]');

-- Insert test listings with geocoded locations
INSERT INTO listings (vehicle_id, seller_id, type, start_price, reserve_price, buy_now_price, current_price, start_time, end_time, status, views_count, location, latitude, longitude) VALUES
(8, 6, 'auction', '7899.00', '8500.00', '9200.00', '7899.00', NOW(), NOW() + INTERVAL '7 days', 'active', 12, '79 Lucas Terrace NW, Calgary, AB', '51.0405', '-114.1455'),
(9, 6, 'auction', '9499.00', '10300.00', '11200.00', '9499.00', NOW(), NOW() + INTERVAL '7 days', 'active', 21, 'University of Calgary, Calgary, AB', '51.1604', '-114.1323'),
(10, 7, 'fixed', '6999.00', '6999.00', '6999.00', '6999.00', NOW(), NOW() + INTERVAL '7 days', 'active', 9, 'Airdrie, AB', '51.2967', '-113.9899');
