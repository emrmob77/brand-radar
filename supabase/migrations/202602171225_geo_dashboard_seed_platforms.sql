insert into public.platforms (name, slug, icon_url, metadata)
values
  ('ChatGPT', 'chatgpt', 'https://cdn.simpleicons.org/openai', '{"provider":"OpenAI"}'::jsonb),
  ('Perplexity', 'perplexity', 'https://cdn.simpleicons.org/perplexity', '{"provider":"Perplexity"}'::jsonb),
  ('Google AI Overviews', 'google-ai-overviews', 'https://cdn.simpleicons.org/google', '{"provider":"Google"}'::jsonb),
  ('Claude', 'claude', 'https://cdn.simpleicons.org/anthropic', '{"provider":"Anthropic"}'::jsonb),
  ('Bing Copilot', 'bing-copilot', 'https://cdn.simpleicons.org/microsoftbing', '{"provider":"Microsoft"}'::jsonb)
on conflict (slug)
do update set
  name = excluded.name,
  icon_url = excluded.icon_url,
  metadata = excluded.metadata,
  active = true;
