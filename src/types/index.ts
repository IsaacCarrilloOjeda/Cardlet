export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  streak: number
  created_at: string
  is_private: boolean
  role: 'student' | 'teacher' | 'admin'
  quiz_correct: number
  quiz_attempts: number
  last_study_date?: string | null
}

export interface DailyChallengeCard {
  id: string
  set_id: string
  front: string
  back: string
  set_title: string
}

export interface StudySet {
  id: string
  user_id: string | null
  title: string
  description: string | null
  subject: string | null
  is_public: boolean
  created_at: string
  card_count?: number
}

export interface Card {
  id: string
  set_id: string
  front: string
  back: string
  image_url: string | null
  difficulty: number
  created_at: string
}

export interface UserCardProgress {
  user_id: string
  card_id: string
  ease_factor: number
  interval: number
  next_review_at: string | null
  repetitions: number
}

export type ConfidenceRating = 'again' | 'hard' | 'good' | 'easy' | 'perfect'

export interface CardWithProgress extends Card {
  progress: UserCardProgress | null
}

export interface StudyMaterial {
  id: string
  title: string
  subject: string | null
  description: string | null
  file_url: string
  file_name: string
  file_size: number | null
  is_public: boolean
  created_at: string
}

export type FeedbackStatus = 'new' | 'seen' | 'resolved'

export interface Feedback {
  id: string
  user_id: string | null
  type: 'bug' | 'feature'
  message: string
  status: FeedbackStatus
  created_at: string
}

export interface AdminStats {
  totalUsers: number
  totalSets: number
  totalCards: number
  totalMaterials: number
  totalFeedback: number
  newFeedback: number
}
