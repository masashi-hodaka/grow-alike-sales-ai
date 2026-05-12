-- ============================================================
-- Grow Alike Sales AI - DB Migration 002
-- 新機能テーブル追加・既存テーブル拡張
-- ※ Supabase SQL Editor で「New query」→ 貼り付け→「Run」
-- ============================================================

-- -------------------------------------------------------
-- 1. products テーブル（複数商材管理）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  target_segment    TEXT CHECK (target_segment IN ('smb','mid','enterprise','all')),
  target_industry   TEXT,
  target_role       TEXT,
  sales_method      TEXT CHECK (sales_method IN ('inbound','outbound','both')),
  sales_cycle_days  INT,
  deal_size_min     INT,
  deal_size_max     INT,
  ltv_avg           INT,
  contract_duration TEXT,
  lead_sources      TEXT[],
  competitors       TEXT[],
  differentiators   TEXT,
  common_objections TEXT[],
  value_props       TEXT,
  ai_generated_points TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products_own" ON products;
CREATE POLICY "products_own" ON products
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -------------------------------------------------------
-- 2. quiz_questions テーブル（AI生成問題）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID REFERENCES products(id) ON DELETE SET NULL,
  skill_category TEXT NOT NULL,
  question_type  TEXT NOT NULL CHECK (question_type IN ('multiple_choice','written','voice','case_study')),
  difficulty     INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  question_text  TEXT NOT NULL,
  choices        JSONB,
  correct_answer TEXT,
  explanation    TEXT,
  xp_reward      INT DEFAULT 10,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_questions_read" ON quiz_questions;
CREATE POLICY "quiz_questions_read" ON quiz_questions
  FOR SELECT USING (TRUE);

-- -------------------------------------------------------
-- 3. quiz_answers テーブル（ユーザー回答履歴）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct  BOOLEAN,
  score       INT,
  ai_feedback TEXT,
  xp_earned   INT DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quiz_answers_own" ON quiz_answers;
CREATE POLICY "quiz_answers_own" ON quiz_answers
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -------------------------------------------------------
-- 4. ai_roleplay_sessions テーブル（AIロープレ）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_roleplay_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  persona          TEXT,
  difficulty       INT DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  industry         TEXT,
  warmth           TEXT CHECK (warmth IN ('cold','warm','hot')),
  scenario         TEXT,
  conversation     JSONB,
  duration_seconds INT,
  overall_score    INT CHECK (overall_score BETWEEN 0 AND 100),
  feedback_summary TEXT,
  strengths        TEXT[],
  improvements     TEXT[],
  skill_scores     JSONB,
  xp_earned        INT DEFAULT 0,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active','completed','abandoned')),
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

ALTER TABLE ai_roleplay_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roleplay_own" ON ai_roleplay_sessions;
CREATE POLICY "roleplay_own" ON ai_roleplay_sessions
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -------------------------------------------------------
-- 5. learning_sessions テーブル（学習セッション管理）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type     TEXT NOT NULL CHECK (session_type IN ('quiz','roleplay','recording','skill_study')),
  product_id       UUID REFERENCES products(id) ON DELETE SET NULL,
  duration_seconds INT DEFAULT 0,
  xp_earned        INT DEFAULT 0,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ
);

ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "learning_sessions_own" ON learning_sessions;
CREATE POLICY "learning_sessions_own" ON learning_sessions
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -------------------------------------------------------
-- 6. streak_logs テーブル（連続学習日数）
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS streak_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL,
  UNIQUE(profile_id, log_date)
);

ALTER TABLE streak_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "streak_own" ON streak_logs;
CREATE POLICY "streak_own" ON streak_logs
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- -------------------------------------------------------
-- 7. profiles テーブル拡張
-- -------------------------------------------------------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name       TEXT,
  ADD COLUMN IF NOT EXISTS current_streak  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan            TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS ai_coach_notes  TEXT,
  ADD COLUMN IF NOT EXISTS weak_categories TEXT[];

-- -------------------------------------------------------
-- 8. user_levels テーブル拡張
-- -------------------------------------------------------
ALTER TABLE user_levels
  ADD COLUMN IF NOT EXISTS weekly_xp     INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_week_xp  INT DEFAULT 0;

-- -------------------------------------------------------
-- 9. 新バッジ追加（既存の badge_key・condition 構造に合わせる）
--    ※ badge_key は badges テーブルのユニーク列
-- -------------------------------------------------------
INSERT INTO badges (badge_key, name, description, icon_url, rarity, xp_reward, condition)
VALUES
  ('roleplay_master',     'ロープレマスター',        '30回AIロープレ達成',           '🎭', 'rare',      100,  '{"type":"roleplay_count","threshold":30}'),
  ('roleplay_perfect',    'パーフェクトスコア',      'ロープレで満点（100点）獲得',  '💯', 'epic',      200,  '{"type":"roleplay_perfect","threshold":1}'),
  ('quiz_king',           'クイズキング',             '100問正解達成',               '🧠', 'rare',      150,  '{"type":"quiz_correct","threshold":100}'),
  ('streak_7',            '連続学習7日',              '7日連続学習達成',             '🔥', 'common',     50,  '{"type":"streak_days","threshold":7}'),
  ('streak_30',           '連続学習30日',             '30日連続学習達成',            '🔥', 'epic',      300,  '{"type":"streak_days","threshold":30}'),
  ('product_master',      '商材マスター',             '商材を3つ登録',               '📦', 'rare',      100,  '{"type":"recording_count","threshold":3}'),
  ('weakness_overcome',   '弱点克服',                 '弱点カテゴリでA評価達成',     '⬆️', 'rare',      150,  '{"type":"skill_view","threshold":1}'),
  ('growth_top',          '成長率トップ',             '週間成長率ランキング1位',      '📈', 'legendary', 500,  '{"type":"team_rank","rank":1}'),
  ('mission_complete',    'ミッションコンプリート',   '月間全ミッション達成',        '✅', 'epic',      250,  '{"type":"recording_count","threshold":10}'),
  ('feedback_10',         'フィードバッカー',         '10回AIフィードバック受領',    '🤖', 'common',     80,  '{"type":"feedback_count","threshold":10}')
ON CONFLICT (badge_key) DO NOTHING;

-- -------------------------------------------------------
-- 10. 新ミッション追加（既存の mission_key・condition 構造に合わせる）
-- -------------------------------------------------------
INSERT INTO missions (mission_key, title, mission_type, xp_reward, condition, is_active)
VALUES
  ('quiz_daily_5',        'クイズ5問チャレンジ',      'daily',     50,  '{"type":"recording_count","threshold":5}',  TRUE),
  ('roleplay_debut',      'ロープレデビュー',          'daily',     80,  '{"type":"recording_count","threshold":1}',  TRUE),
  ('weakness_weekly',     '弱点カテゴリ克服',          'weekly',   150,  '{"type":"recording_count","threshold":3}',  TRUE),
  ('product_study',       '商材学習セッション',        'weekly',   200,  '{"type":"recording_count","threshold":3}',  TRUE),
  ('streak_challenge',    '連続学習チャレンジ',        'weekly',   300,  '{"type":"streak_days","threshold":7}',      TRUE)
ON CONFLICT (mission_key) DO NOTHING;

-- -------------------------------------------------------
-- 11. インデックス追加
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_profile       ON products(profile_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_profile   ON quiz_answers(profile_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question  ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_roleplay_profile       ON ai_roleplay_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_streak_profile_date    ON streak_logs(profile_id, log_date);
