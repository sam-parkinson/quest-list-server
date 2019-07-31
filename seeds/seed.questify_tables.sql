BEGIN;

TRUNCATE
  questify_tasks,
  questify_quests,
  questify_users
  RESTART IDENTITY CASCADE;

INSERT INTO questify_users (user_name, password)
VALUES
  ('macbeth', '$2a$12$db3cpqVVG0STgG9Sgcrm1eUkf2jrpk18ugM6mSD7IhZ98xetjGC2W'),
  ('hamlet', '$2a$12$R8S.hliCBJYFfdNG4epE9Of1UXQrqV4tkjKY678E4ngN3NwX1W64q');

INSERT INTO questify_quests (quest_name, quest_desc, user_id)
VALUES
  (
    'Become king of Scotland',
    'Description of a quest',
    1
  ),
  (
    'Do laundry',
    'Description of a quest',
    1
  ),
  (
    'Mope about',
    'Description of a quest',
    2
  ),
  (
    'Solve father''s murder',
    'Description of a quest',
    2
  );

INSERT INTO questify_tasks (
  task_name,
  task_desc,
  quest_id,
  user_id,
)
VALUES
  (
    'Task name',
    'Task description',
    1,
    1
  ),
  (
    'Task name',
    'Task description',
    1,
    1
  ),
  (
    'Task name',
    'Task description',
    2,
    1
  ),
  (
    'Task name',
    'Task description',
    2,
    1
  ),
  (
    'Task name',
    'Task description',
    3,
    2
  ),
  (
    'Task name',
    'Task description',
    4,
    2
  );

COMMIT;