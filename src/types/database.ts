export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise'
export type SkillCategory = 'prospecting' | 'discovery' | 'demo' | 'closing' | 'objection'
export type RecordingType = 'roleplay' | 'real_deal'
export type RecordingStatus = 'uploaded' | 'processing' | 'completed' | 'error'
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary'
export type MissionType = 'daily' | 'weekly' | 'challenge'
export type LeaderboardScope = 'global' | 'team' | 'industry'
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'alltime'

export type ProductProfile = {
  product_name: string
  unit_price_range: string
  sales_cycle_days: number
  decision_maker: string
  pain_points: string[]
  competitors: string[]
  custom_keywords: string[]
}

export type FeedbackScores = {
  overall: number
  opening: number
  needs_discovery: number
  proposal: number
  objection_handling: number
  closing: number
  talk_ratio_percent: number
  filler_word_count: number
}

export type IndustryInsights = {
  industry_specific_score: number
  used_effective_keywords: string[]
  missed_keywords: string[]
  custom_comments: string
}

export type LearningContent = {
  objective: string
  key_phrases: string[]
  bad_examples: string[]
  estimated_minutes: number
}

export type GameCondition = {
  type: 'recording_count' | 'score_above' | 'streak_days' | 'skill_category_complete' | 'team_rank' | 'feedback_count' | 'avg_score' | 'skill_view'
  threshold?: number
  rank?: number
  category?: string
}

export type Profile = {
  id: string
  user_id: string
  team_id: string | null
  full_name: string | null
  company_name: string | null
  industry_type: string
  product_profile: ProductProfile
  plan_type: PlanType
  plan_expires_at: string | null
  // 新フィールド（Grow Alike Sales AI）
  current_streak?: number
  longest_streak?: number
  plan?: string
  ai_coach_notes?: string | null
  weak_categories?: string[] | null
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  profile_id: string
  name: string
  description: string | null
  target_segment: 'smb' | 'mid' | 'enterprise' | 'all' | null
  target_industry: string | null
  target_role: string | null
  sales_method: 'inbound' | 'outbound' | 'both' | null
  sales_cycle_days: number | null
  deal_size_min: number | null
  deal_size_max: number | null
  ltv_avg: number | null
  contract_duration: string | null
  lead_sources: string[] | null
  competitors: string[] | null
  differentiators: string | null
  common_objections: string[] | null
  value_props: string | null
  ai_generated_points: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type QuizQuestion = {
  id: string
  product_id: string | null
  skill_category: string
  question_type: 'multiple_choice' | 'written' | 'voice' | 'case_study'
  difficulty: number
  question_text: string
  choices: { label: string; text: string }[] | null
  correct_answer: string | null
  explanation: string | null
  xp_reward: number
  created_at: string
}

export type AiRoleplaySession = {
  id: string
  profile_id: string
  product_id: string | null
  persona: string | null
  difficulty: number
  industry: string | null
  warmth: 'cold' | 'warm' | 'hot' | null
  scenario: string | null
  conversation: { role: 'user' | 'ai'; content: string; timestamp: string }[] | null
  duration_seconds: number | null
  overall_score: number | null
  feedback_summary: string | null
  strengths: string[] | null
  improvements: string[] | null
  skill_scores: Record<string, number> | null
  xp_earned: number
  status: 'active' | 'completed' | 'abandoned'
  started_at: string
  completed_at: string | null
}

export type SkillCurriculum = {
  id: string
  profile_id: string
  industry_type: string
  skill_name: string
  skill_category: SkillCategory
  difficulty_level: number
  learning_content: LearningContent
  is_completed: boolean
  generated_at: string
  updated_at: string
}

export type Recording = {
  id: string
  profile_id: string
  storage_path: string
  duration_seconds: number
  recording_type: RecordingType
  metadata: Record<string, unknown>
  status: RecordingStatus
  recorded_at: string
  created_at: string
}

export type AiFeedback = {
  id: string
  recording_id: string
  profile_id: string
  scores: FeedbackScores
  strengths: string[]
  improvements: string[]
  transcript_text: string | null
  industry_insights: IndustryInsights
  model_version: string
  generated_at: string
}

export type UsageStats = {
  id: string
  profile_id: string
  year_month: number
  total_recording_seconds: number
  recording_count: number
  feedback_count: number
  remaining_seconds: number
  updated_at: string
}

export type UserLevel = {
  id: string
  profile_id: string
  current_xp: number
  current_level: number
  xp_to_next_level: number
  total_xp_earned: number
  updated_at: string
}

export type Badge = {
  id: string
  badge_key: string
  name: string
  description: string | null
  icon_url: string | null
  rarity: BadgeRarity
  xp_reward: number
  condition: GameCondition
}

export type UserBadge = {
  id: string
  profile_id: string
  badge_id: string
  unlocked_at: string
  is_featured: boolean
  badge?: Badge
}

export type Mission = {
  id: string
  mission_key: string
  title: string
  mission_type: MissionType
  xp_reward: number
  condition: GameCondition
  is_active: boolean
}

export type UserMissionProgress = {
  id: string
  profile_id: string
  mission_id: string
  period_key: string
  current_value: number
  is_completed: boolean
  completed_at: string | null
  xp_claimed: boolean
  mission?: Mission
}
