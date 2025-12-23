// Supabase Database Types
// Auto-generated types for the TaxPrep database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      textbooks: {
        Row: {
          id: string
          user_id: string
          title: string
          file_name: string
          total_pages: number
          upload_date: string
          processed: boolean
        }
        Insert: {
          id: string
          user_id: string
          title: string
          file_name: string
          total_pages: number
          upload_date?: string
          processed?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          file_name?: string
          total_pages?: number
          upload_date?: string
          processed?: boolean
        }
      }
      parts: {
        Row: {
          id: string
          textbook_id: string
          number: string
          title: string
          start_page: number
          end_page: number
        }
        Insert: {
          id: string
          textbook_id: string
          number: string
          title: string
          start_page: number
          end_page: number
        }
        Update: {
          id?: string
          textbook_id?: string
          number?: string
          title?: string
          start_page?: number
          end_page?: number
        }
      }
      chapters: {
        Row: {
          id: string
          textbook_id: string
          part_id: string
          number: number
          title: string
          start_page: number
          end_page: number
        }
        Insert: {
          id: string
          textbook_id: string
          part_id: string
          number: number
          title: string
          start_page: number
          end_page: number
        }
        Update: {
          id?: string
          textbook_id?: string
          part_id?: string
          number?: number
          title?: string
          start_page?: number
          end_page?: number
        }
      }
      sections: {
        Row: {
          id: string
          textbook_id: string
          chapter_id: string
          letter: string
          title: string
          start_page: number
          end_page: number
        }
        Insert: {
          id: string
          textbook_id: string
          chapter_id: string
          letter: string
          title: string
          start_page: number
          end_page: number
        }
        Update: {
          id?: string
          textbook_id?: string
          chapter_id?: string
          letter?: string
          title?: string
          start_page?: number
          end_page?: number
        }
      }
      subsections: {
        Row: {
          id: string
          textbook_id: string
          section_id: string
          number: number
          title: string
          start_page: number
          end_page: number
        }
        Insert: {
          id: string
          textbook_id: string
          section_id: string
          number: number
          title: string
          start_page: number
          end_page: number
        }
        Update: {
          id?: string
          textbook_id?: string
          section_id?: string
          number?: number
          title?: string
          start_page?: number
          end_page?: number
        }
      }
      subsubsections: {
        Row: {
          id: string
          textbook_id: string
          subsection_id: string
          letter: string
          title: string
          start_page: number
          end_page: number
        }
        Insert: {
          id: string
          textbook_id: string
          subsection_id: string
          letter: string
          title: string
          start_page: number
          end_page: number
        }
        Update: {
          id?: string
          textbook_id?: string
          subsection_id?: string
          letter?: string
          title?: string
          start_page?: number
          end_page?: number
        }
      }
      textbook_pages: {
        Row: {
          id: string
          page_number: number
          chapter_id: string
          section_id: string
          section_title: string
          content: string
          starts_new_section: boolean
        }
        Insert: {
          id: string
          page_number: number
          chapter_id: string
          section_id: string
          section_title: string
          content: string
          starts_new_section?: boolean
        }
        Update: {
          id?: string
          page_number?: number
          chapter_id?: string
          section_id?: string
          section_title?: string
          content?: string
          starts_new_section?: boolean
        }
      }
      questions: {
        Row: {
          id: string
          textbook_id: string
          chapter_id: string
          section_id: string | null
          type: string
          difficulty: string
          question: string
          options: Json | null
          correct_answer: string | null
          acceptable_answers: string[] | null
          model_answer: string | null
          key_points: string[] | null
          fact_pattern: string | null
          issues: Json | null
          explanation: string
          source_pages: number[]
          created_at: string
        }
        Insert: {
          id: string
          textbook_id: string
          chapter_id: string
          section_id?: string | null
          type: string
          difficulty: string
          question: string
          options?: Json | null
          correct_answer?: string | null
          acceptable_answers?: string[] | null
          model_answer?: string | null
          key_points?: string[] | null
          fact_pattern?: string | null
          issues?: Json | null
          explanation: string
          source_pages: number[]
          created_at?: string
        }
        Update: {
          id?: string
          textbook_id?: string
          chapter_id?: string
          section_id?: string | null
          type?: string
          difficulty?: string
          question?: string
          options?: Json | null
          correct_answer?: string | null
          acceptable_answers?: string[] | null
          model_answer?: string | null
          key_points?: string[] | null
          fact_pattern?: string | null
          issues?: Json | null
          explanation?: string
          source_pages?: number[]
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          textbook_id: string
          chapter_id: string | null
          section_id: string | null
          question_ids: string[]
          score: number | null
          total_questions: number
          correct_count: number | null
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          textbook_id: string
          chapter_id?: string | null
          section_id?: string | null
          question_ids: string[]
          score?: number | null
          total_questions: number
          correct_count?: number | null
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          textbook_id?: string
          chapter_id?: string | null
          section_id?: string | null
          question_ids?: string[]
          score?: number | null
          total_questions?: number
          correct_count?: number | null
          started_at?: string
          completed_at?: string | null
        }
      }
      answers: {
        Row: {
          id: string
          quiz_attempt_id: string
          question_id: string
          user_answer: string
          is_correct: boolean | null
          score: string | null
          feedback: string | null
          answered_at: string
        }
        Insert: {
          id: string
          quiz_attempt_id: string
          question_id: string
          user_answer: string
          is_correct?: boolean | null
          score?: string | null
          feedback?: string | null
          answered_at?: string
        }
        Update: {
          id?: string
          quiz_attempt_id?: string
          question_id?: string
          user_answer?: string
          is_correct?: boolean | null
          score?: string | null
          feedback?: string | null
          answered_at?: string
        }
      }
      chapter_progress: {
        Row: {
          id: string
          user_id: string
          textbook_id: string
          chapter_id: string
          coverage_score: number
          accuracy_score: number
          retention_score: number
          mastery_score: number
          mastery_level: string
          questions_attempted: number
          questions_correct: number
          last_activity_at: string
        }
        Insert: {
          id: string
          user_id: string
          textbook_id: string
          chapter_id: string
          coverage_score?: number
          accuracy_score?: number
          retention_score?: number
          mastery_score?: number
          mastery_level?: string
          questions_attempted?: number
          questions_correct?: number
          last_activity_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          textbook_id?: string
          chapter_id?: string
          coverage_score?: number
          accuracy_score?: number
          retention_score?: number
          mastery_score?: number
          mastery_level?: string
          questions_attempted?: number
          questions_correct?: number
          last_activity_at?: string
        }
      }
      section_progress: {
        Row: {
          id: string
          user_id: string
          chapter_id: string
          section_id: string
          questions_attempted: number
          questions_correct: number
          mastery_score: number
          last_activity_at: string
        }
        Insert: {
          id: string
          user_id: string
          chapter_id: string
          section_id: string
          questions_attempted?: number
          questions_correct?: number
          mastery_score?: number
          last_activity_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          chapter_id?: string
          section_id?: string
          questions_attempted?: number
          questions_correct?: number
          mastery_score?: number
          last_activity_at?: string
        }
      }
      srs_cards: {
        Row: {
          id: string
          user_id: string
          question_id: string
          next_review_at: string
          interval_days: number
          ease_factor: number
          consecutive_correct: number
          last_reviewed_at: string | null
        }
        Insert: {
          id: string
          user_id: string
          question_id: string
          next_review_at: string
          interval_days?: number
          ease_factor?: number
          consecutive_correct?: number
          last_reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          next_review_at?: string
          interval_days?: number
          ease_factor?: number
          consecutive_correct?: number
          last_reviewed_at?: string | null
        }
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_activity_date: string
        }
        Insert: {
          id: string
          user_id: string
          current_streak?: number
          longest_streak?: number
          last_activity_date: string
        }
        Update: {
          id?: string
          user_id?: string
          current_streak?: number
          longest_streak?: number
          last_activity_date?: string
        }
      }
      milestones: {
        Row: {
          id: string
          milestone_id: string
          user_id: string
          earned_at: string
        }
        Insert: {
          id: string
          milestone_id: string
          user_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          milestone_id?: string
          user_id?: string
          earned_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          questions_answered: number
          chapters_studied: string[]
        }
        Insert: {
          id: string
          user_id: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          questions_answered?: number
          chapters_studied?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          ended_at?: string | null
          duration_minutes?: number | null
          questions_answered?: number
          chapters_studied?: string[]
        }
      }
      activity_logs: {
        Row: {
          id: number
          user_id: string
          type: string
          details: string | null
          timestamp: string
        }
        Insert: {
          id?: number
          user_id: string
          type: string
          details?: string | null
          timestamp?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: string
          details?: string | null
          timestamp?: string
        }
      }
      annotations: {
        Row: {
          id: string
          user_id: string
          section_id: string
          type: string
          color: string
          start_offset: number
          end_offset: number
          selected_text: string
          note: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          section_id: string
          type: string
          color: string
          start_offset: number
          end_offset: number
          selected_text: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          type?: string
          color?: string
          start_offset?: number
          end_offset?: number
          selected_text?: string
          note?: string | null
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          section_id: string
          chapter_id: string
          page_number: number | null
          title: string
          note: string | null
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          section_id: string
          chapter_id: string
          page_number?: number | null
          title: string
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          chapter_id?: string
          page_number?: number | null
          title?: string
          note?: string | null
          created_at?: string
        }
      }
      reading_progress: {
        Row: {
          id: string
          user_id: string
          section_id: string
          chapter_id: string
          completed: boolean
          check_prompts_seen: number
          check_prompts_flagged: number
          time_spent_seconds: number
          last_read_at: string
        }
        Insert: {
          id: string
          user_id: string
          section_id: string
          chapter_id: string
          completed?: boolean
          check_prompts_seen?: number
          check_prompts_flagged?: number
          time_spent_seconds?: number
          last_read_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          chapter_id?: string
          completed?: boolean
          check_prompts_seen?: number
          check_prompts_flagged?: number
          time_spent_seconds?: number
          last_read_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
