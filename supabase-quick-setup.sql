-- Quick Setup: Essential Tables for Corporate Tax App
-- Copy this entire file and paste into Supabase SQL Editor

-- Textbook Pages (main content)
CREATE TABLE IF NOT EXISTS textbook_pages (
  id TEXT PRIMARY KEY,
  page_number INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  starts_new_section BOOLEAN DEFAULT FALSE
);

-- Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  textbook_id TEXT,
  part_id TEXT,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  textbook_id TEXT,
  chapter_id TEXT REFERENCES chapters(id),
  letter TEXT NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  textbook_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  section_id TEXT,
  type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  acceptable_answers TEXT[],
  model_answer TEXT,
  key_points TEXT[],
  explanation TEXT NOT NULL,
  source_pages INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  textbook_id TEXT NOT NULL,
  chapter_id TEXT,
  question_ids TEXT[] NOT NULL,
  score DECIMAL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Answers
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  quiz_attempt_id TEXT REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  feedback TEXT,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapter Progress
CREATE TABLE IF NOT EXISTS chapter_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  textbook_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  coverage_score DECIMAL DEFAULT 0,
  accuracy_score DECIMAL DEFAULT 0,
  mastery_score DECIMAL DEFAULT 0,
  mastery_level TEXT DEFAULT 'NOT_STARTED',
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

-- Reading Progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_spent_seconds INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

-- Annotations
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE NOT NULL
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_textbook_pages_chapter ON textbook_pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_textbook_pages_section ON textbook_pages(section_id);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_progress(user_id);

-- Enable Row Level Security
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users access own quiz_attempts" ON quiz_attempts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own answers" ON answers FOR ALL USING (quiz_attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = auth.uid()));
CREATE POLICY "Users access own chapter_progress" ON chapter_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own reading_progress" ON reading_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own annotations" ON annotations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own streaks" ON streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users access own activity_logs" ON activity_logs FOR ALL USING (auth.uid() = user_id);

-- Public read for content tables
CREATE POLICY "Public read textbook_pages" ON textbook_pages FOR SELECT USING (true);
CREATE POLICY "Public read chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public read sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Public read questions" ON questions FOR SELECT USING (true);

SELECT 'All tables created successfully!' as status;
