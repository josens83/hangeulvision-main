-- Seed achievement definitions (idempotent via ON CONFLICT DO NOTHING)
INSERT INTO "Achievement" (id, slug, name, description, icon, threshold)
VALUES
  ('ach_first_step',    'first_step',    'First Step',     'Learn your first word',         '🌱', 1),
  ('ach_quick_learner', 'quick_learner', 'Quick Learner',  'Learn 10 words',                '📖', 10),
  ('ach_bookworm',      'bookworm',      'Bookworm',       'Learn 50 words',                '📚', 50),
  ('ach_on_fire',       'on_fire',       'On Fire',        '3-day study streak',            '🔥', 3),
  ('ach_blazing',       'blazing',       'Blazing',        '7-day study streak',            '🔥', 7),
  ('ach_collector',     'collector',     'Collector',      'Bookmark 5 words',              '⭐', 5),
  ('ach_perfect',       'perfect_score', 'Perfect Score',  'Score 100% on a quiz',          '💯', 1),
  ('ach_master',        'master',        'Master',         'Master 50 words (21+ day interval)', '🏆', 50)
ON CONFLICT (slug) DO NOTHING;
