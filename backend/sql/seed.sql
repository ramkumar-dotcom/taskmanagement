-- =============================================================================
-- SEED DATA
-- Sample rows so the board is not empty the first time you open it.
-- =============================================================================

INSERT INTO boards (id, name)
VALUES (1, 'My first board')
ON CONFLICT (id) DO NOTHING;

INSERT INTO columns (id, board_id, name, position)
VALUES
  (1, 1, 'To Do', 0),
  (2, 1, 'In Progress', 1),
  (3, 1, 'Done', 2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, column_id, title, description, position)
VALUES
  (1, 1, 'Read the README', 'Open README.md — it explains the 3 pieces.', 0),
  (2, 1, 'Add another task', 'Type in the box under To Do and click Add task.', 1),
  (3, 2, 'Explore the API', 'Open http://localhost:4000/api/health in your browser.', 0),
  (4, 3, 'Create the project folder', 'Boilerplate is already here — you did it.', 0)
ON CONFLICT (id) DO NOTHING;
