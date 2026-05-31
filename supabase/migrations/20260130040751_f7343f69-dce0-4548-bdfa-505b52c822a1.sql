-- Restore user roles for existing users
-- arunkavali.tech@gmail.com gets admin, others get analyst
INSERT INTO user_roles (user_id, role) VALUES 
('3410d824-33ce-4769-b87c-e098d3250c25', 'admin'),
('9c615840-563a-480d-9bce-28ff551dcabd', 'analyst'),
('4ee11bd7-6acd-4cf8-abdc-888c4660e53e', 'analyst'),
('05586365-8765-42ca-aef9-21d5b9153083', 'analyst'),
('4bdf8800-181e-410e-bb8e-58a92460ad17', 'analyst')
ON CONFLICT (user_id) DO NOTHING;