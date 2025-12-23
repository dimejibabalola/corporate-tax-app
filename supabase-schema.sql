-- ============================================================================
-- TaxPrep Supabase Schema
-- Run this SQL in your Supabase SQL Editor to create all tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STRUCTURE TABLES
-- ============================================================================

-- Textbooks
CREATE TABLE IF NOT EXISTS textbooks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_pages INTEGER NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

-- Parts
CREATE TABLE IF NOT EXISTS parts (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- Chapters
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id) ON DELETE CASCADE,
  part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- Sections
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapters(id) ON DELETE CASCADE,
  letter TEXT NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- Subsections
CREATE TABLE IF NOT EXISTS subsections (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- SubSubsections
CREATE TABLE IF NOT EXISTS subsubsections (
  id TEXT PRIMARY KEY,
  textbook_id TEXT REFERENCES textbooks(id) ON DELETE CASCADE,
  subsection_id TEXT REFERENCES subsections(id) ON DELETE CASCADE,
  letter TEXT NOT NULL,
  title TEXT NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL
);

-- ============================================================================
-- TEXTBOOK CONTENT
-- ============================================================================

-- Textbook Pages (main content from JSON import)
CREATE TABLE IF NOT EXISTS textbook_pages (
  id TEXT PRIMARY KEY,
  page_number INTEGER NOT NULL,
  chapter_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  content TEXT NOT NULL,
  starts_new_section BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_textbook_pages_chapter ON textbook_pages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_textbook_pages_section ON textbook_pages(section_id);
CREATE INDEX IF NOT EXISTS idx_textbook_pages_number ON textbook_pages(page_number);

-- Page Footnotes
CREATE TABLE IF NOT EXISTS page_footnotes (
  id TEXT PRIMARY KEY,
  page_id TEXT REFERENCES textbook_pages(id) ON DELETE CASCADE,
  footnote_number INTEGER NOT NULL,
  text TEXT NOT NULL
);

-- ============================================================================
-- QUIZ ENGINE
-- ============================================================================

-- Questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  textbook_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  section_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('MC', 'SHORT_ANSWER', 'FILL_BLANK', 'ISSUE_SPOTTER', 'TRUE_FALSE')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('basic', 'intermediate', 'exam')),
  question TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  acceptable_answers TEXT[],
  model_answer TEXT,
  key_points TEXT[],
  fact_pattern TEXT,
  issues JSONB,
  explanation TEXT NOT NULL,
  source_pages INTEGER[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  textbook_id TEXT NOT NULL,
  chapter_id TEXT,
  section_id TEXT,
  question_ids TEXT[] NOT NULL,
  score DECIMAL,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_chapter ON quiz_attempts(chapter_id);

-- Answers
CREATE TABLE IF NOT EXISTS answers (
  id TEXT PRIMARY KEY,
  quiz_attempt_id TEXT REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  score TEXT CHECK (score IN ('full', 'partial', 'minimal', 'miss')),
  feedback TEXT,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROGRESS TRACKING
-- ============================================================================

-- Chapter Progress
CREATE TABLE IF NOT EXISTS chapter_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  textbook_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  coverage_score DECIMAL DEFAULT 0,
  accuracy_score DECIMAL DEFAULT 0,
  retention_score DECIMAL DEFAULT 0,
  mastery_score DECIMAL DEFAULT 0,
  mastery_level TEXT DEFAULT 'NOT_STARTED' CHECK (mastery_level IN ('NOT_STARTED', 'NEEDS_WORK', 'DEVELOPING', 'PROFICIENT', 'MASTERED')),
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_progress(user_id);

-- Section Progress
CREATE TABLE IF NOT EXISTS section_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  mastery_score DECIMAL DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

-- ============================================================================
-- SPACED REPETITION (SRS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS srs_cards (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  next_review_at TIMESTAMPTZ NOT NULL,
  interval_days INTEGER DEFAULT 1,
  ease_factor DECIMAL DEFAULT 2.5,
  consecutive_correct INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_cards_next_review ON srs_cards(user_id, next_review_at);

-- ============================================================================
-- GAMIFICATION
-- ============================================================================

-- Streaks
CREATE TABLE IF NOT EXISTS streaks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE NOT NULL
);

-- Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id TEXT PRIMARY KEY,
  milestone_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  chapters_studied TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);

-- ============================================================================
-- ACTIVITY LOGGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('LOGIN', 'VIEW_TEXTBOOK', 'START_QUIZ', 'GENERATE_QUIZ', 'COMPLETE_QUIZ', 'READ_CHAPTER', 'COURSE_RESET', 'STUDY_SESSION')),
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);

-- ============================================================================
-- ENHANCED READER
-- ============================================================================

-- Annotations
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('highlight', 'underline')),
  color TEXT NOT NULL CHECK (color IN ('yellow', 'green', 'blue', 'pink', 'orange')),
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  selected_text TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_annotations_user_section ON annotations(user_id, section_id);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  page_number INTEGER,
  title TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- Reading Progress
CREATE TABLE IF NOT EXISTS reading_progress (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  check_prompts_seen INTEGER DEFAULT 0,
  check_prompts_flagged INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress(user_id);

-- Check Prompt Responses
CREATE TABLE IF NOT EXISTS check_prompt_responses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('revealed', 'got_it', 'need_review')),
  responded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search History
CREATE TABLE IF NOT EXISTS search_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE textbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE srs_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_prompt_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own textbooks" ON textbooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own textbooks" ON textbooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own textbooks" ON textbooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own textbooks" ON textbooks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz_attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quiz_attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quiz_attempts" ON quiz_attempts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chapter_progress" ON chapter_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chapter_progress" ON chapter_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chapter_progress" ON chapter_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own section_progress" ON section_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own section_progress" ON section_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own section_progress" ON section_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own srs_cards" ON srs_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own srs_cards" ON srs_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own srs_cards" ON srs_cards FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own study_sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study_sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study_sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity_logs" ON activity_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity_logs" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own annotations" ON annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own annotations" ON annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annotations" ON annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own annotations" ON annotations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookmarks" ON bookmarks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reading_progress" ON reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reading_progress" ON reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reading_progress" ON reading_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own check_prompt_responses" ON check_prompt_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own check_prompt_responses" ON check_prompt_responses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own search_history" ON search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own search_history" ON search_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public read access for shared content (textbook structure, questions)
CREATE POLICY "Anyone can view textbook pages" ON textbook_pages FOR SELECT USING (true);
CREATE POLICY "Anyone can view parts" ON parts FOR SELECT USING (true);
CREATE POLICY "Anyone can view chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Anyone can view sections" ON sections FOR SELECT USING (true);
CREATE POLICY "Anyone can view subsections" ON subsections FOR SELECT USING (true);
CREATE POLICY "Anyone can view subsubsections" ON subsubsections FOR SELECT USING (true);
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Anyone can view page_footnotes" ON page_footnotes FOR SELECT USING (true);

-- ============================================================================
-- Done! Your Supabase database is ready.
-- ============================================================================
