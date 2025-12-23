import { supabase } from './client';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// HELPER: Get current user ID
// ============================================================================
async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
}

// ============================================================================
// TEXTBOOK PAGES
// ============================================================================

export async function getTextbookPages(chapterId: string) {
  const { data, error } = await supabase
    .from('textbook_pages')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('page_number');
  
  if (error) throw error;
  return data;
}

export async function getPagesBySectionId(sectionId: string) {
  const { data, error } = await supabase
    .from('textbook_pages')
    .select('*')
    .eq('section_id', sectionId)
    .order('page_number');
  
  if (error) throw error;
  return data;
}

export async function getPageByNumber(pageNumber: number) {
  const { data, error } = await supabase
    .from('textbook_pages')
    .select('*')
    .eq('page_number', pageNumber)
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// CHAPTERS & SECTIONS
// ============================================================================

export async function getChapters() {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .order('number');
  
  if (error) throw error;
  return data;
}

export async function getChapter(chapterId: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getSections(chapterId: string) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('letter');
  
  if (error) throw error;
  return data;
}

export async function getSection(sectionId: string) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('id', sectionId)
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// QUESTIONS
// ============================================================================

export async function getQuestions(filters?: {
  chapterId?: string;
  sectionId?: string;
  type?: string;
  difficulty?: string;
  limit?: number;
}) {
  let query = supabase.from('questions').select('*');
  
  if (filters?.chapterId) query = query.eq('chapter_id', filters.chapterId);
  if (filters?.sectionId) query = query.eq('section_id', filters.sectionId);
  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters?.limit) query = query.limit(filters.limit);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getRandomQuestions(chapterId: string, count: number, difficulty?: string) {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('chapter_id', chapterId);
  
  if (difficulty) query = query.eq('difficulty', difficulty);
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Shuffle and take random subset
  const shuffled = data?.sort(() => Math.random() - 0.5) || [];
  return shuffled.slice(0, count);
}

// ============================================================================
// QUIZ ATTEMPTS & ANSWERS
// ============================================================================

export async function createQuizAttempt(params: {
  textbookId: string;
  chapterId?: string;
  sectionId?: string;
  questionIds: string[];
  totalQuestions: number;
}) {
  const userId = await getUserId();
  const id = uuidv4();
  
  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      id,
      user_id: userId,
      textbook_id: params.textbookId,
      chapter_id: params.chapterId,
      section_id: params.sectionId,
      question_ids: params.questionIds,
      total_questions: params.totalQuestions,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function completeQuizAttempt(attemptId: string, score: number, correctCount: number) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .update({
      score,
      correct_count: correctCount,
      completed_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function saveAnswer(params: {
  quizAttemptId: string;
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  score?: 'full' | 'partial' | 'minimal' | 'miss';
  feedback?: string;
}) {
  const id = uuidv4();
  
  const { data, error } = await supabase
    .from('answers')
    .insert({
      id,
      quiz_attempt_id: params.quizAttemptId,
      question_id: params.questionId,
      user_answer: params.userAnswer,
      is_correct: params.isCorrect,
      score: params.score,
      feedback: params.feedback,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getQuizHistory(chapterId?: string) {
  const userId = await getUserId();
  
  let query = supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });
  
  if (chapterId) query = query.eq('chapter_id', chapterId);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export async function getChapterProgress(chapterId?: string) {
  const userId = await getUserId();
  
  let query = supabase
    .from('chapter_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (chapterId) query = query.eq('chapter_id', chapterId);
  
  const { data, error } = await query;
  if (error) throw error;
  return chapterId ? data?.[0] : data;
}

export async function updateChapterProgress(chapterId: string, updates: {
  coverageScore?: number;
  accuracyScore?: number;
  retentionScore?: number;
  masteryScore?: number;
  masteryLevel?: string;
  questionsAttempted?: number;
  questionsCorrect?: number;
}) {
  const userId = await getUserId();
  
  // Try to upsert
  const { data, error } = await supabase
    .from('chapter_progress')
    .upsert({
      id: `${userId}-${chapterId}`,
      user_id: userId,
      textbook_id: 'default',
      chapter_id: chapterId,
      coverage_score: updates.coverageScore,
      accuracy_score: updates.accuracyScore,
      retention_score: updates.retentionScore,
      mastery_score: updates.masteryScore,
      mastery_level: updates.masteryLevel,
      questions_attempted: updates.questionsAttempted,
      questions_correct: updates.questionsCorrect,
      last_activity_at: new Date().toISOString(),
    }, { onConflict: 'user_id,chapter_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getSectionProgress(sectionId: string) {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('section_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('section_id', sectionId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ============================================================================
// READING PROGRESS
// ============================================================================

export async function getReadingProgress(sectionId?: string) {
  const userId = await getUserId();
  
  let query = supabase
    .from('reading_progress')
    .select('*')
    .eq('user_id', userId);
  
  if (sectionId) query = query.eq('section_id', sectionId);
  
  const { data, error } = await query;
  if (error) throw error;
  return sectionId ? data?.[0] : data;
}

export async function updateReadingProgress(sectionId: string, chapterId: string, updates: {
  completed?: boolean;
  checkPromptsSeen?: number;
  checkPromptsFlagged?: number;
  timeSpentSeconds?: number;
}) {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('reading_progress')
    .upsert({
      id: `${userId}-${sectionId}`,
      user_id: userId,
      section_id: sectionId,
      chapter_id: chapterId,
      completed: updates.completed,
      check_prompts_seen: updates.checkPromptsSeen,
      check_prompts_flagged: updates.checkPromptsFlagged,
      time_spent_seconds: updates.timeSpentSeconds,
      last_read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,section_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// ANNOTATIONS & BOOKMARKS
// ============================================================================

export async function getAnnotations(sectionId?: string) {
  const userId = await getUserId();
  
  let query = supabase
    .from('annotations')
    .select('*')
    .eq('user_id', userId);
  
  if (sectionId) query = query.eq('section_id', sectionId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createAnnotation(params: {
  sectionId: string;
  type: 'highlight' | 'underline';
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
  startOffset: number;
  endOffset: number;
  selectedText: string;
  note?: string;
}) {
  const userId = await getUserId();
  const id = uuidv4();
  
  const { data, error } = await supabase
    .from('annotations')
    .insert({
      id,
      user_id: userId,
      section_id: params.sectionId,
      type: params.type,
      color: params.color,
      start_offset: params.startOffset,
      end_offset: params.endOffset,
      selected_text: params.selectedText,
      note: params.note,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteAnnotation(id: string) {
  const { error } = await supabase
    .from('annotations')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getBookmarks(chapterId?: string) {
  const userId = await getUserId();
  
  let query = supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId);
  
  if (chapterId) query = query.eq('chapter_id', chapterId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBookmark(params: {
  sectionId: string;
  chapterId: string;
  pageNumber?: number;
  title: string;
  note?: string;
}) {
  const userId = await getUserId();
  const id = uuidv4();
  
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      id,
      user_id: userId,
      section_id: params.sectionId,
      chapter_id: params.chapterId,
      page_number: params.pageNumber,
      title: params.title,
      note: params.note,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteBookmark(id: string) {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================================================
// STREAKS & GAMIFICATION
// ============================================================================

export async function getStreak() {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateStreak() {
  const userId = await getUserId();
  const today = new Date().toISOString().split('T')[0];
  
  const existing = await getStreak();
  
  if (!existing) {
    // Create new streak
    const { data, error } = await supabase
      .from('streaks')
      .insert({
        id: uuidv4(),
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  const lastDate = new Date(existing.last_activity_date);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let newStreak = existing.current_streak;
  if (diffDays === 1) {
    newStreak += 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  }
  
  const { data, error } = await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, existing.longest_streak),
      last_activity_date: today,
    })
    .eq('id', existing.id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getMilestones() {
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function awardMilestone(milestoneId: string) {
  const userId = await getUserId();
  
  // Check if already earned
  const { data: existing } = await supabase
    .from('milestones')
    .select('id')
    .eq('user_id', userId)
    .eq('milestone_id', milestoneId)
    .single();
  
  if (existing) return null; // Already earned
  
  const { data, error } = await supabase
    .from('milestones')
    .insert({
      id: uuidv4(),
      milestone_id: milestoneId,
      user_id: userId,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// STUDY SESSIONS
// ============================================================================

export async function startStudySession() {
  const userId = await getUserId();
  const id = uuidv4();
  
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      id,
      user_id: userId,
      questions_answered: 0,
      chapters_studied: [],
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function endStudySession(sessionId: string, questionsAnswered: number, chaptersStudied: string[]) {
  const startedAt = new Date(); // We'd need to fetch this from the session
  const now = new Date();
  const durationMinutes = Math.round((now.getTime() - startedAt.getTime()) / 60000);
  
  const { data, error } = await supabase
    .from('study_sessions')
    .update({
      ended_at: now.toISOString(),
      duration_minutes: durationMinutes,
      questions_answered: questionsAnswered,
      chapters_studied: chaptersStudied,
    })
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

export async function logActivity(type: string, details?: string) {
  const userId = await getUserId();
  
  const { error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: userId,
      type,
      details,
    });
  
  if (error) throw error;
}

// ============================================================================
// SRS CARDS
// ============================================================================

export async function getSRSCards(dueOnly: boolean = false) {
  const userId = await getUserId();
  
  let query = supabase
    .from('srs_cards')
    .select('*, questions(*)')
    .eq('user_id', userId);
  
  if (dueOnly) {
    query = query.lte('next_review_at', new Date().toISOString());
  }
  
  const { data, error } = await query.order('next_review_at');
  if (error) throw error;
  return data;
}

export async function updateSRSCard(questionId: string, correct: boolean) {
  const userId = await getUserId();
  
  const { data: existing } = await supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single();
  
  const now = new Date();
  let intervalDays = 1;
  let easeFactor = 2.5;
  let consecutiveCorrect = 0;
  
  if (existing) {
    easeFactor = existing.ease_factor;
    consecutiveCorrect = existing.consecutive_correct;
    
    if (correct) {
      consecutiveCorrect += 1;
      intervalDays = Math.round(existing.interval_days * easeFactor);
      easeFactor = Math.min(3.0, easeFactor + 0.1);
    } else {
      consecutiveCorrect = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }
  }
  
  const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('srs_cards')
    .upsert({
      id: existing?.id || uuidv4(),
      user_id: userId,
      question_id: questionId,
      next_review_at: nextReview.toISOString(),
      interval_days: intervalDays,
      ease_factor: easeFactor,
      consecutive_correct: consecutiveCorrect,
      last_reviewed_at: now.toISOString(),
    }, { onConflict: 'user_id,question_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
