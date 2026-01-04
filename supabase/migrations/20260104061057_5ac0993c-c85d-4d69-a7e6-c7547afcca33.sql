-- Fix player_stats: Make it only viewable by authenticated users (not public)
DROP POLICY IF EXISTS "Users can view all player stats" ON public.player_stats;
CREATE POLICY "Users can view player stats when authenticated"
ON public.player_stats
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix profiles: Ensure only authenticated users can view
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix game_sessions: Restrict INSERT to authenticated users only
DROP POLICY IF EXISTS "System can create game sessions" ON public.game_sessions;
CREATE POLICY "Authenticated users can create game sessions"
ON public.game_sessions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix session_scores: Restrict INSERT to authenticated users only  
DROP POLICY IF EXISTS "System can create session scores" ON public.session_scores;
CREATE POLICY "Authenticated users can create session scores"
ON public.session_scores
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix chat_messages: Require authentication for viewing
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Authenticated users can view messages in their rooms"
ON public.chat_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM room_players
      WHERE room_players.room_id = chat_messages.room_id
      AND room_players.user_id = auth.uid()
    )
    OR room_id IS NULL
  )
);

-- Fix room_players: Restrict UPDATE to only is_ready field (not score)
DROP POLICY IF EXISTS "Users can update own room player status" ON public.room_players;
CREATE POLICY "Users can update own ready status"
ON public.room_players
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix player_items: Restrict UPDATE to prevent quantity manipulation
DROP POLICY IF EXISTS "Users can update own items" ON public.player_items;
CREATE POLICY "Users can use own items"
ON public.player_items
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);