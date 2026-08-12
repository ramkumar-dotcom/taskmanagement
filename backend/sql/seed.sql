-- Empty board structure only. No sample tasks.

INSERT INTO boards (id, name)
VALUES (1, 'My first board')
ON CONFLICT (id) DO NOTHING;

INSERT INTO columns (id, board_id, name, position)
VALUES
  (1, 1, 'To Do', 0),
  (2, 1, 'In Progress', 1),
  (3, 1, 'Done', 2)
ON CONFLICT (id) DO NOTHING;
