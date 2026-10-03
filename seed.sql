-- Seed Users
-- Password for admin@example.com is "admin123"
-- Password for student@example.com is "student123"
INSERT INTO users (name, email, password, role) VALUES
('DevOps Admin', 'admin@example.com', '$2a$10$1rS6I2y/Gx9z7zQanl.DO.41IXOQSv9c6q7Qg3MmXc.eAJ.fnAina', 'admin'),
('DevOps Student', 'student@example.com', '$2a$10$LEe8kErA52ax4I.mYsyK3.ZLfWC4dnPShjIv.GxFLfcVhAiQnoNG6', 'user');

-- Seed 12 Products
INSERT INTO products (name, description, price, image) VALUES
(
    'Mechanical RGB Keyboard',
    'Custom tactile mechanical keyboard with hot-swappable switches, PBT keycaps, and customizable RGB backlighting.',
    129.99,
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
),
(
    'Wireless Noise-Canceling Headphones',
    'Premium over-ear studio headphones featuring active noise cancellation and 40-hour battery life for uninterrupted coding.',
    199.50,
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
),
(
    'Ergonomic Developer Chair',
    'Full mesh ergonomic office chair with adjustable lumbar support, 3D armrests, and recline lock.',
    289.00,
    'https://images.unsplash.com/photo-1580481077195-c328ad4f4f79?w=600&auto=format&fit=crop&q=80'
),
(
    'Ultra-Wide 34-Inch Curved Monitor',
    'WQHD 144Hz curved display offering maximum desktop real estate for multiple terminal windows and IDEs.',
    449.99,
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80'
),
(
    'Minimalist Aluminum Laptop Stand',
    'Sturdy ventilated desktop riser designed for MacBook and laptops up to 17 inches.',
    39.99,
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80'
),
(
    'DevOps Engineer Cotton Hoodie',
    'Heavyweight organic cotton hoodie with subtle terminal git branch motif on the sleeve. Maximum comfort during deploys.',
    54.99,
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
),
(
    'Precision Wireless Ergonomic Mouse',
    'High-accuracy optical sensor mouse with customizable thumb buttons and dual wireless Bluetooth/2.4G connectivity.',
    79.99,
    'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80'
),
(
    'Smart Insulated Coffee Tumbler',
    'Temperature-controlled 16oz stainless steel mug that keeps your coffee at the exact drinking temperature for 3 hours.',
    45.00,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
),
(
    'Studio USB Condenser Microphone',
    'Crisp cardioid polar pattern USB microphone with pop filter and zero-latency headphone monitoring.',
    89.95,
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80'
),
(
    '4K HDR Streaming Webcam',
    'Ultra HD 60fps web camera with AI autofocus and dual noise-reducing stereo microphones.',
    119.00,
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=600&auto=format&fit=crop&q=80'
),
(
    'Extended Desk Mat (Wool Felt & Leather)',
    'Water-resistant non-slip extra large desk pad for smooth mouse tracking and clean workspace aesthetics.',
    29.99,
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
),
(
    'Portable External SSD 1TB',
    'Superfast NVMe speeds up to 1050 MB/s in a rugged, shock-resistant pocket-sized aluminum casing.',
    109.99,
    'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80'
);
