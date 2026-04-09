-- Enable UUID extension if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  streak INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study sets table
CREATE TABLE IF NOT EXISTS study_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  set_id UUID REFERENCES study_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  image_url TEXT,
  difficulty INT DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User card progress table
CREATE TABLE IF NOT EXISTS user_card_progress (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  ease_factor FLOAT DEFAULT 2.5,
  interval INT DEFAULT 1,
  next_review_at TIMESTAMPTZ,
  repetitions INT DEFAULT 0,
  PRIMARY KEY (user_id, card_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_card_progress ENABLE ROW LEVEL SECURITY;

-- Policies
-- Profiles: users own their rows
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Study sets: owners can write, public readable
DROP POLICY IF EXISTS "Users can view own study sets" ON study_sets;
CREATE POLICY "Users can view own study sets" ON study_sets FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view public study sets" ON study_sets;
CREATE POLICY "Users can view public study sets" ON study_sets FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Users can insert own study sets" ON study_sets;
CREATE POLICY "Users can insert own study sets" ON study_sets FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own study sets" ON study_sets;
CREATE POLICY "Users can update own study sets" ON study_sets FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own study sets" ON study_sets;
CREATE POLICY "Users can delete own study sets" ON study_sets FOR DELETE USING (auth.uid() = user_id);

-- Cards: same as study sets
DROP POLICY IF EXISTS "Users can view cards in own sets" ON cards;
CREATE POLICY "Users can view cards in own sets" ON cards FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = cards.set_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can view cards in public sets" ON cards;
CREATE POLICY "Users can view cards in public sets" ON cards FOR SELECT USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = cards.set_id AND is_public = true)
);
DROP POLICY IF EXISTS "Users can insert cards in own sets" ON cards;
CREATE POLICY "Users can insert cards in own sets" ON cards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM study_sets WHERE id = cards.set_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can update cards in own sets" ON cards;
CREATE POLICY "Users can update cards in own sets" ON cards FOR UPDATE USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = cards.set_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "Users can delete cards in own sets" ON cards;
CREATE POLICY "Users can delete cards in own sets" ON cards FOR DELETE USING (
  EXISTS (SELECT 1 FROM study_sets WHERE id = cards.set_id AND user_id = auth.uid())
);

-- User card progress: users own their rows
DROP POLICY IF EXISTS "Users can view own progress" ON user_card_progress;
CREATE POLICY "Users can view own progress" ON user_card_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own progress" ON user_card_progress;
CREATE POLICY "Users can insert own progress" ON user_card_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own progress" ON user_card_progress;
CREATE POLICY "Users can update own progress" ON user_card_progress FOR UPDATE USING (auth.uid() = user_id);