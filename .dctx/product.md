# Product Requirements Document: TaxPrep Study App

## Overview

A personal study application that ingests a full law school textbook (PDF) and generates dynamic, interactive assessments tied to the source material. Built for a law student preparing for Corporate Tax (Subchapter C).

## Problem Statement

Law school tax courses require active recall and application, not passive reading. Existing resources (CALI, E&Es) are generic and not tied to the student's actual textbook. Students need a tool that:
- Generates practice questions directly from their assigned readings
- Offers multiple question formats (MC, short answer, fill-in-the-blank)
- Provides detailed explanations in the style of "Examples & Explanations" books
- Tracks progress and surfaces weak areas

## Core User Stories

1. **As a user**, I can upload a PDF textbook and have it parsed into searchable, structured chapters/sections.
2. **As a user**, I can select a chapter or page range and generate a quiz with my chosen question types.
3. **As a user**, I can answer questions and receive immediate feedback with detailed explanations.
4. **As a user**, I can see my progress (chapters studied, accuracy rates, weak areas).
5. **As a user**, I can revisit questions I got wrong via spaced repetition.
6. **As a user**, I can ask for an "E&E-style" explanation of any concept in my textbook.

---

## Feature Specifications

### Feature 1: PDF Ingestion & Parsing
DONE ALREADY

UI
  - Chapter number/title
  - Section title (if applicable)
  - Page number(s)
  - Sequential order
- 
- Display table of contents view after processing


### Feature 2: Quiz Generation Engine

**Description:** User selects content (by chapter, section, or page range) and question types. App generates a quiz dynamically using an LLM.

**Requirements:**
- Selection options:
  - Entire chapter
  - Specific section within chapter
  - Custom page range (e.g., "pages 45-60")
  - "Weak areas" (auto-selected from past wrong answers)
- Question type options (multi-select):
  - Multiple choice (4 options)
  - Short answer (1-3 sentence response)
  - Fill-in-the-blank (key terms removed)
  - Issue spotter (mini fact pattern + "what issues?")
  - True/False with explanation required
- Number of questions: user selects 5, 10, 15, 20, or custom
- Difficulty selector: Basic / Intermediate / Exam-level
- Generated questions must:
  - Be directly tied to source material (include page reference)
  - Cover different concepts within the selected range (no repeats)
  - Include correct answer + distractor logic for MC
  - Be stored for later review

**Technical Notes:**
- Retrieve relevant chunks from vector DB based on selection
- Construct prompt with chunks + question type + difficulty
- LLM call (Claude API recommended) with structured output (JSON)
- Parse response into question objects
- Store generated questions with metadata (source pages, type, difficulty, timestamp)

**Prompt Template Example (MC):**
```
You are generating a law school quiz question for a Corporate Tax course.

Source Material (from pages {page_range}):
"""
{chunk_text}
"""

Generate a multiple choice question at {difficulty} level.
- Question should test understanding, not mere recall
- Include 4 options (A-D) with one correct answer
- Distractors should be plausible but clearly wrong to someone who understands the material
- Include a brief explanation of why the correct answer is right and why each distractor is wrong

Output as JSON:
{
  "question": "...",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
  "correct_answer": "A",
  "explanation": "...",
  "source_pages": [45, 46]
}
```

---

### Feature 3: Answer Evaluation & Feedback

**Description:** User submits answers. App evaluates correctness and provides detailed, E&E-style explanations.

**Requirements:**
- Multiple choice: immediate correct/incorrect feedback
- Short answer / issue spotter: LLM evaluation against rubric
  - Identify key points the answer should contain
  - Score as: Complete / Partial / Missed
  - Explain what was missing or incorrect
- Fill-in-the-blank: fuzzy match (handle typos, synonyms)
- All question types: show detailed explanation after answer
- Explanation format (E&E style):
  - Restate the rule/concept
  - Explain the analysis step-by-step
  - Connect back to source material with page reference
  - Offer a "test tip" or common mistake to avoid
- Option to "flag" question for later review
- Option to "explain more" → deeper dive on the concept

**Technical Notes:**
- MC/Fill-in-blank: deterministic evaluation
- Short answer: LLM call with student answer + model answer + rubric
- Store all answers with evaluation results

---

### Feature 4: Progress Tracking & Analytics

**Description:** Dashboard showing study progress, performance trends, and weak areas.

**Requirements:**
- Overview stats:
  - Total questions answered
  - Overall accuracy rate
  - Time spent studying (optional)
- By chapter:
  - % of chapter covered (questions generated from those pages)
  - Accuracy rate per chapter
  - Visual indicator (green/yellow/red)
- Weak areas identification:
  - Topics/sections with <70% accuracy
  - Questions missed 2+ times
  - Auto-generate "weak area quiz" from these
- History:
  - Past quizzes with scores
  - Individual question review (see your answer vs. correct)
- Streak/consistency tracker (optional, gamification)

**Technical Notes:**
- Store all quiz attempts and answers
- Aggregate queries for stats
- Weak area algorithm: track by chapter + section + concept tags (LLM can tag questions on generation)

---

### Feature 5: Spaced Repetition System

**Description:** Automatically resurface missed questions at optimal intervals.

**Requirements:**
- Questions enter SRS queue when answered incorrectly
- Scheduling algorithm (SM-2 or simplified version):
  - First review: 1 day
  - If correct: 3 days → 7 days → 14 days → 30 days
  - If incorrect: reset to 1 day
- Daily "review" session option (pulls due cards)
- Remove from queue after 3 consecutive correct answers
- User can manually add any question to SRS

**Technical Notes:**
- Store per-question SRS data: next_review_date, interval, ease_factor
- Daily cron or on-app-open check for due reviews

---

### Feature 6: Bar Prep-Style Progress Tracker

**Description:** A comprehensive visual progress system modeled after Barbri/Themis that shows mastery across the entire textbook at a glance. Not just "did you read it" but "can you perform on it."

**Requirements:**

#### 6.1 Course Overview Dashboard
- Full textbook visualization showing all chapters as progress bars
- Each chapter bar shows:
  - Completion percentage (questions attempted vs. available content)
  - Mastery color coding:
    - Gray: Not started (0% attempted)
    - Red: Needs work (<60% accuracy)
    - Yellow: Developing (60-79% accuracy)
    - Green: Proficient (80-89% accuracy)
    - Blue/Gold: Mastered (90%+ accuracy with sufficient volume)
  - Click to expand → section-level breakdown
- Overall course progress ring/percentage at top
- "Exam Readiness Score" (weighted algorithm based on coverage + accuracy)

#### 6.2 Chapter Deep-Dive View
- Expandable view for each chapter showing:
  - Section-by-section progress bars
  - Key concepts identified with individual mastery indicators
  - Recent activity (last quiz date, last score)
  - Trend arrow (improving ↑, declining ↓, stable →)
  - "Weak spots" flagged within chapter
- Recommended next action: "Review §351 boot rules" or "Ready for full chapter quiz"

#### 6.3 Mastery Calculation Logic
- **Coverage Score (40% of mastery):**
  - % of chapter's content that has been quizzed on
  - Requires questions from different sections, not just one area
- **Accuracy Score (40% of mastery):**
  - Weighted recent performance (last 5 attempts weighted more heavily)
  - By question type (exam-level questions weighted higher)
- **Retention Score (20% of mastery):**
  - SRS performance on this chapter's content
  - Decay factor: mastery decreases if not reviewed in 14+ days

#### 6.4 Exam Readiness Score
- Algorithm combines:
  - Overall coverage (have you touched every chapter?)
  - Average mastery across all chapters
  - Weak area penalty (any chapter <60% drags score down disproportionately)
  - Recency factor (studied recently vs. weeks ago)
- Display as:
  - Percentage score (0-100)
  - Qualitative label: "Not Ready" / "Getting There" / "On Track" / "Exam Ready"
  - Comparison to target (e.g., "15% below your goal")

#### 6.5 Progress Milestones & Streaks
- Milestone badges:
  - "First Chapter Mastered"
  - "50% Coverage"
  - "All Chapters Attempted"
  - "100 Questions Answered"
  - "7-Day Streak"
- Study streak counter (consecutive days with activity)
- Weekly goal setting: "Complete 3 chapters this week"
- Progress toward goal visualization

#### 6.6 Heat Map View
- Alternative visualization: textbook as grid/heat map
- Each cell = section or concept
- Color intensity = mastery level
- Instantly see "cold spots" (red/gray areas)
- Click any cell → jump to quiz or explanation for that content

#### 6.7 Time-Based Analytics
- Study time logged per session
- Estimated time to exam readiness based on current pace
- "At your current pace, you'll complete the textbook in X days"
- Recommended daily study time to hit target date
- Calendar view: past study sessions + planned review dates

#### 6.8 Comparative Progress (Optional)
- If multiple textbooks/courses: side-by-side progress
- "You're stronger in Corporate Tax than SALT" type insights

**Data Model Additions:**

```
ChapterProgress
{
  id: uuid,
  chapter_id: uuid,
  coverage_score: float (0-1),
  accuracy_score: float (0-1),
  retention_score: float (0-1),
  mastery_score: float (0-1, computed),
  mastery_level: enum(NOT_STARTED, NEEDS_WORK, DEVELOPING, PROFICIENT, MASTERED),
  questions_attempted: int,
  questions_correct: int,
  last_activity: timestamp,
  trend: enum(IMPROVING, DECLINING, STABLE),
  updated_at: timestamp
}

ConceptMastery
{
  id: uuid,
  chapter_id: uuid,
  concept_tag: string,
  mastery_score: float,
  question_count: int,
  last_tested: timestamp
}

StudySession
{
  id: uuid,
  start_time: timestamp,
  end_time: timestamp,
  chapters_studied: [uuid],
  questions_answered: int,
  duration_minutes: int
}

ExamReadiness
{
  id: uuid,
  calculated_at: timestamp,
  overall_score: float,
  coverage_component: float,
  accuracy_component: float,
  weak_area_penalty: float,
  recency_factor: float,
  readiness_level: enum(NOT_READY, GETTING_THERE, ON_TRACK, EXAM_READY)
}

StudyGoal
{
  id: uuid,
  target_date: date,
  target_readiness: float,
  weekly_chapter_goal: int,
  daily_question_goal: int,
  created_at: timestamp
}
```

**UI Components:**

1. **Progress Sidebar (Always Visible)**
   - Compact view: overall %, mini chapter bars
   - Expand for full dashboard
   - Quick stats: streak, questions today, weak areas count

2. **Full Progress Dashboard**
   - Top: Exam Readiness Score (big number + ring chart)
   - Middle: Chapter grid with progress bars
   - Bottom: Recent activity, upcoming reviews, recommendations

3. **Chapter Progress Card**
   - Progress bar with mastery color
   - Section breakdown (expandable)
   - Stats: X questions, Y% accuracy, last studied Z
   - Action buttons: "Quiz This Chapter" / "Review Weak Spots"

4. **Heat Map Modal**
   - Grid visualization of entire textbook
   - Toggle between: mastery view, recency view, coverage view
   - Hover for details, click to act

5. **Goal Setting Modal**
   - Set exam date
   - Set target readiness score
   - App calculates required daily/weekly pace
   - Adjust and commit

---

### Feature 7: On-Demand Explanations

**Description:** User can highlight/select any portion of their textbook and request an E&E-style explanation.

**Requirements:**
- Browse textbook by chapter/page within app
- Select text or page range
- Request options:
  - "Explain this simply"
  - "Give me a flowchart"
  - "How does this connect to [other concept]?"
  - "What's a good hypo for this?"
  - "What are common exam mistakes here?"
- Response in E&E style:
  - Start with the basic rule
  - Build up with examples
  - Address nuances and exceptions
  - Provide memory hooks or frameworks
- Save explanations to personal "notes" collection

**Technical Notes:**
- Retrieve selected chunk + surrounding context
- LLM call with appropriate prompt based on request type
- For flowcharts: generate Mermaid syntax, render in app

---

## Data Models

### Textbook
```
{
  id: uuid,
  title: string,
  upload_date: timestamp,
  total_pages: int,
  chapters: [Chapter]
}
```

### Chapter
```
{
  id: uuid,
  textbook_id: uuid,
  number: int,
  title: string,
  start_page: int,
  end_page: int,
  sections: [Section]
}
```

### Chunk
```
{
  id: uuid,
  textbook_id: uuid,
  chapter_id: uuid,
  section_id: uuid (nullable),
  content: text,
  page_numbers: [int],
  sequence_order: int,
  embedding: vector(1536)
}
```

### Question
```
{
  id: uuid,
  chunk_ids: [uuid],
  type: enum(MC, SHORT_ANSWER, FILL_BLANK, ISSUE_SPOTTER, TRUE_FALSE),
  difficulty: enum(BASIC, INTERMEDIATE, EXAM),
  question_text: text,
  options: json (nullable, for MC),
  correct_answer: text,
  explanation: text,
  source_pages: [int],
  concept_tags: [string],
  created_at: timestamp
}
```

### QuizAttempt
```
{
  id: uuid,
  quiz_date: timestamp,
  chapter_id: uuid (nullable),
  page_range: string (nullable),
  question_ids: [uuid],
  score: float,
  time_spent: int (seconds)
}
```

### Answer
```
{
  id: uuid,
  question_id: uuid,
  quiz_attempt_id: uuid,
  user_answer: text,
  is_correct: boolean,
  partial_credit: float (nullable),
  feedback: text,
  answered_at: timestamp
}
```

### SRSCard
```
{
  id: uuid,
  question_id: uuid,
  next_review: date,
  interval: int (days),
  ease_factor: float,
  consecutive_correct: int
}
```

---

## UI/UX Specifications

### Screens

1. **Home/Dashboard**
   - Upload textbook CTA (if none uploaded)
   - **Exam Readiness Score** (prominent, top of page)
   - Quick stats (questions answered, accuracy, streak)
   - **Mini progress tracker** (chapter bars at a glance)
   - "Continue studying" → last chapter or weak areas
   - "Daily review" → SRS due cards
   - Chapter list with progress indicators

2. **Progress Tracker (Full View)**
   - **Exam Readiness ring** with score and label
   - Target date and pace indicator
   - **Full chapter grid** with progress bars and mastery colors
   - Expandable sections within each chapter
   - **Heat map toggle** for alternative visualization
   - Weak areas summary with direct action buttons
   - Time analytics: study time, estimated completion
   - Streaks and milestones display

3. **Textbook Browser**
   - Left sidebar: chapter/section navigation
   - Main area: textbook content (paginated or scrollable)
   - Selection tools: highlight to explain, select range for quiz
   - Top bar: search within textbook

3. **Quiz Configuration**
   - Select scope (chapter, section, pages, weak areas)
   - Toggle question types
   - Select quantity and difficulty
   - "Generate Quiz" button

4. **Quiz Taking**
   - One question per screen
   - Question type indicator
   - Answer input (radio buttons for MC, text area for short answer, etc.)
   - "Submit Answer" → immediate feedback
   - Progress bar (3/10 questions)
   - "Next Question" after reviewing feedback

5. **Quiz Results**
   - Score summary
   - Question-by-question breakdown
   - Option to retry wrong questions
   - Add wrong questions to SRS
   - Return to dashboard

6. **Explanation View**
   - Source text displayed
   - E&E explanation below
   - Flowchart render (if requested)
   - "Save to notes" button
   - Related concepts links

7. **Progress/Analytics**
   - Charts: accuracy over time, by chapter
   - Weak areas list
   - Time spent
   - SRS stats (cards due, mastered)

8. **Settings**
   - API key input (if self-hosted)
   - Default quiz preferences
   - SRS intervals customization
   - Export data

---

## Technical Architecture

### Recommended Stack

**Frontend:**
- React or Next.js
- Tailwind CSS for styling
- Recharts or Chart.js for analytics
- Mermaid.js for flowchart rendering

**Backend:**
- Next.js API routes (if using Next) or Express.js
- SQLite (local) or Postgres (deployed) for structured data
- Vector database: 
  - Local: ChromaDB or LanceDB
  - Cloud: Pinecone, Supabase pgvector, or Weaviate

**PDF Processing:**
- `pdf-parse` or `pdfjs-dist` for text extraction
- `tesseract.js` for OCR fallback


**Deployment:**
- Vercel (if Next.js)
- Railway or Render for backend
- Local-first option: Electron wrapper for desktop app

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                     │
├─────────────────────────────────────────────────────────┤
│  Dashboard │ Textbook │ Quiz │ Explanations │ Progress  │
└─────────────────────────┬───────────────────────────────┘
                          │ API Calls
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend (Next.js API)                  │
├─────────────────────────────────────────────────────────┤
│  PDF Parser │ Quiz Generator │ Answer Evaluator │ SRS   │
└──────┬──────────────┬────────────────┬──────────────────┘
       │              │                │
       ▼              ▼                ▼
┌────────────┐ ┌─────────────┐ ┌──────────────┐
│  SQLite/   │ │  Vector DB  │ │ 
│  Postgres  │ │  (ChromaDB) │ │              │
└────────────┘ └─────────────┘ └──────────────┘
```

---


### Quiz
- `POST /api/quiz/generate` - Generate quiz from selection
- `POST /api/quiz/{id}/submit` - Submit quiz answers
- `GET /api/quiz/{id}/results` - Get quiz results

### SRS
- `GET /api/srs/due` - Get cards due for review
- `POST /api/srs/review` - Submit review results

### Explanations
- `POST /api/explain` - Request explanation for selected content

### Progress & Readiness
- `GET /api/progress/stats` - Get overall stats
- `GET /api/progress/chapters` - Get per-chapter progress with mastery scores
- `GET /api/progress/chapters/{id}` - Get detailed chapter progress with sections
- `GET /api/progress/readiness` - Get Exam Readiness Score breakdown
- `GET /api/progress/heatmap` - Get heat map data for visualization
- `POST /api/progress/goals` - Set study goals (exam date, target score)
- `GET /api/progress/goals` - Get current goals and pace status
- `GET /api/progress/streaks` - Get streak and milestone data
- `POST /api/progress/session` - Log study session start/end

---

## MVP vs. Full Version

### MVP (Build First)
- PDF upload and basic parsing (chapter detection)
- Quiz generation: MC and short answer only
- Basic feedback with explanations
- **Basic progress tracking: chapter completion %, overall accuracy**
- **Simple progress bars per chapter (no mastery colors yet)**
- Single textbook support

### V2 Additions
- **Full bar-prep style progress tracker:**
  - Mastery color coding (gray/red/yellow/green/blue)
  - Exam Readiness Score with algorithm
  - Heat map visualization
  - Section-level breakdown within chapters
- Advanced question types (issue spotters, fill-in-blank)
- Spaced repetition system integrated with progress
- On-demand explanations with flowcharts
- Weak areas auto-detection

### V3 / Nice-to-Have
- **Goal setting with pace calculator**
- **Milestone badges and streaks**
- **Time tracking and "estimated completion" predictions**
- Multiple textbook support (side-by-side progress)
- Collaborative features (share quizzes)
- Audio explanations (TTS or generated)
- Mobile app
- Integration with NotebookLM for audio

---

## Known Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| PDF text extraction quality varies | Implement OCR fallback; allow manual text paste as backup |
| Chapter detection isn't always accurate | Provide manual chapter boundary editor |
| Long PDFs exceed context limits | Chunk content; use vector search for relevant retrieval |
| Question quality inconsistency | Strong prompts with examples; regenerate option |
| Cost of API calls | Cache generated questions; batch operations |

---

## Success Metrics

- Can successfully upload and parse an 800-page tax textbook
- Generates relevant, accurate quiz questions from any chapter
- Explanations are helpful and E&E-quality
- **Progress tracker accurately reflects mastery (not just completion)**
- **Exam Readiness Score feels meaningful and motivating**
- **Heat map instantly reveals weak areas**
- Student uses it regularly throughout the semester
- Measurable improvement in weak areas over time
- **Student can set exam date and track pace toward goal**

---

## Notes for AI Code Assistant

When implementing this app:


3. **Test with real textbook content early** - academic/legal text has unique formatting
4. **Keep the UI simple** - this is a study tool, not a product launch
5. **Prioritize the quiz flow** - that's the core value; other features are secondary
6. **Store everything** - you'll want the data for improving prompts and tracking progress

The user is a law student who knows what they want. Trust the spec, build iteratively, and optimize the prompts based on output quality.