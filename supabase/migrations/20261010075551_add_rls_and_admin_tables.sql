/*
# BizAgent OS — RLS Policies + Admin Tables

Adds RLS policies to all 13 existing tables and creates 3 admin tables.
*/

-- PROFILES
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- BUSINESSES
DROP POLICY IF EXISTS "select_businesses" ON businesses;
CREATE POLICY "select_businesses" ON businesses FOR SELECT TO authenticated USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = businesses.id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_businesses" ON businesses;
CREATE POLICY "insert_businesses" ON businesses FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "update_businesses" ON businesses;
CREATE POLICY "update_businesses" ON businesses FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = businesses.id AND business_members.user_id = auth.uid())) WITH CHECK (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = businesses.id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_businesses" ON businesses;
CREATE POLICY "delete_businesses" ON businesses FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- BUSINESS_MEMBERS
DROP POLICY IF EXISTS "select_business_members" ON business_members;
CREATE POLICY "select_business_members" ON business_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_members.business_id AND b.owner_id = auth.uid()));
DROP POLICY IF EXISTS "insert_business_members" ON business_members;
CREATE POLICY "insert_business_members" ON business_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_members.business_id AND b.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_business_members" ON business_members;
CREATE POLICY "update_business_members" ON business_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_members.business_id AND b.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_members.business_id AND b.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_business_members" ON business_members;
CREATE POLICY "delete_business_members" ON business_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM businesses b WHERE b.id = business_members.business_id AND b.owner_id = auth.uid()));

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "select_subscriptions" ON subscriptions;
CREATE POLICY "select_subscriptions" ON subscriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = subscriptions.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_subscriptions" ON subscriptions;
CREATE POLICY "insert_subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid()));
DROP POLICY IF EXISTS "update_subscriptions" ON subscriptions;
CREATE POLICY "update_subscriptions" ON subscriptions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid()));
DROP POLICY IF EXISTS "delete_subscriptions" ON subscriptions;
CREATE POLICY "delete_subscriptions" ON subscriptions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = subscriptions.business_id AND b.owner_id = auth.uid()));

-- AGENTS
DROP POLICY IF EXISTS "select_agents" ON agents;
CREATE POLICY "select_agents" ON agents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = agents.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_agents" ON agents;
CREATE POLICY "insert_agents" ON agents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = agents.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_agents" ON agents;
CREATE POLICY "update_agents" ON agents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = agents.business_id AND business_members.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = agents.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_agents" ON agents;
CREATE POLICY "delete_agents" ON agents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = agents.business_id AND b.owner_id = auth.uid()));

-- KNOWLEDGE_SOURCES
DROP POLICY IF EXISTS "select_knowledge_sources" ON knowledge_sources;
CREATE POLICY "select_knowledge_sources" ON knowledge_sources FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_sources.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_knowledge_sources" ON knowledge_sources;
CREATE POLICY "insert_knowledge_sources" ON knowledge_sources FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_sources.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_knowledge_sources" ON knowledge_sources;
CREATE POLICY "update_knowledge_sources" ON knowledge_sources FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_sources.business_id AND business_members.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_sources.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_knowledge_sources" ON knowledge_sources;
CREATE POLICY "delete_knowledge_sources" ON knowledge_sources FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_sources.business_id AND business_members.user_id = auth.uid()));

-- KNOWLEDGE_CHUNKS
DROP POLICY IF EXISTS "select_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "select_knowledge_chunks" ON knowledge_chunks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_chunks.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "insert_knowledge_chunks" ON knowledge_chunks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_chunks.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "update_knowledge_chunks" ON knowledge_chunks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_chunks.business_id AND business_members.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_chunks.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "delete_knowledge_chunks" ON knowledge_chunks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = knowledge_chunks.business_id AND business_members.user_id = auth.uid()));

-- CONVERSATIONS
DROP POLICY IF EXISTS "select_conversations" ON conversations;
CREATE POLICY "select_conversations" ON conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_conversations" ON conversations;
CREATE POLICY "insert_conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_conversations" ON conversations;
CREATE POLICY "update_conversations" ON conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_conversations" ON conversations;
CREATE POLICY "delete_conversations" ON conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- MESSAGES
DROP POLICY IF EXISTS "select_messages" ON messages;
CREATE POLICY "select_messages" ON messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_messages" ON messages;
CREATE POLICY "insert_messages" ON messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_messages" ON messages;
CREATE POLICY "update_messages" ON messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_messages" ON messages;
CREATE POLICY "delete_messages" ON messages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()));

-- CAMPAIGNS
DROP POLICY IF EXISTS "select_campaigns" ON campaigns;
CREATE POLICY "select_campaigns" ON campaigns FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = campaigns.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_campaigns" ON campaigns;
CREATE POLICY "insert_campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_campaigns" ON campaigns;
CREATE POLICY "update_campaigns" ON campaigns FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_campaigns" ON campaigns;
CREATE POLICY "delete_campaigns" ON campaigns FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- GENERATED_CONTENT
DROP POLICY IF EXISTS "select_generated_content" ON generated_content;
CREATE POLICY "select_generated_content" ON generated_content FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = generated_content.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_generated_content" ON generated_content;
CREATE POLICY "insert_generated_content" ON generated_content FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_generated_content" ON generated_content;
CREATE POLICY "update_generated_content" ON generated_content FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_generated_content" ON generated_content;
CREATE POLICY "delete_generated_content" ON generated_content FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- VOICEOVER_GENERATIONS
DROP POLICY IF EXISTS "select_voiceover_generations" ON voiceover_generations;
CREATE POLICY "select_voiceover_generations" ON voiceover_generations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = voiceover_generations.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_voiceover_generations" ON voiceover_generations;
CREATE POLICY "insert_voiceover_generations" ON voiceover_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_voiceover_generations" ON voiceover_generations;
CREATE POLICY "update_voiceover_generations" ON voiceover_generations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_voiceover_generations" ON voiceover_generations;
CREATE POLICY "delete_voiceover_generations" ON voiceover_generations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- USAGE_EVENTS
DROP POLICY IF EXISTS "select_usage_events" ON usage_events;
CREATE POLICY "select_usage_events" ON usage_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM business_members WHERE business_members.business_id = usage_events.business_id AND business_members.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_usage_events" ON usage_events;
CREATE POLICY "insert_usage_events" ON usage_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_usage_events" ON usage_events;
CREATE POLICY "update_usage_events" ON usage_events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_usage_events" ON usage_events;
CREATE POLICY "delete_usage_events" ON usage_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- ADMIN TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS plan_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text UNIQUE NOT NULL,
  plan_name text NOT NULL,
  price_pkr integer NOT NULL DEFAULT 0,
  price_usd numeric(10,2) DEFAULT 0,
  billing_period text DEFAULT 'monthly',
  max_businesses integer DEFAULT 1,
  max_knowledge_files integer DEFAULT 3,
  max_generations integer DEFAULT 20,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE plan_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_plan_config" ON plan_config;
CREATE POLICY "select_plan_config" ON plan_config FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key text NOT NULL,
  screenshot_url text NOT NULL,
  amount_pkr integer,
  transaction_id text,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payment_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_payment_proofs" ON payment_proofs;
CREATE POLICY "select_payment_proofs" ON payment_proofs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_payment_proofs" ON payment_proofs;
CREATE POLICY "insert_payment_proofs" ON payment_proofs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_payment_proofs" ON payment_proofs;
CREATE POLICY "update_payment_proofs" ON payment_proofs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_payment_proofs" ON payment_proofs;
CREATE POLICY "delete_payment_proofs" ON payment_proofs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_user ON payment_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_proofs_status ON payment_proofs(status);

-- Seed default plans
INSERT INTO plan_config (plan_key, plan_name, price_pkr, price_usd, billing_period, max_businesses, max_knowledge_files, max_generations, features, sort_order)
VALUES
  ('free', 'Free', 0, 0, 'monthly', 1, 3, 20, '["1 Business Workspace","1 AI Agent","3 Knowledge Files","20 AI Generations/month","Basic AI Chat","Basic Marketing Content"]'::jsonb, 0),
  ('pro', 'Pro', 2000, 12, 'monthly', 3, 20, 100, '["Up to 3 Business Workspaces","20 Knowledge Files","100 AI Generations/month","Advanced Marketing Content","Event Marketing","Ad Creative Generation","ElevenLabs Voiceover Access"]'::jsonb, 1),
  ('business', 'Business', 5000, 30, 'monthly', 10, 100, 500, '["Multiple Business Workspaces","100 Knowledge Files","500 AI Generations/month","Team Collaboration","Advanced Business Agents","Premium Creative Tools","Advanced Reporting","Priority Integrations"]'::jsonb, 2)
ON CONFLICT (plan_key) DO NOTHING;

-- Seed admin user (password: HASHIR54321@m)
INSERT INTO admin_users (email, password_hash, role)
VALUES ('owner@haqgroup.site', 'QkFTRTY0OkhBU0hJUjU0MzIxQG0=', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-files', 'knowledge-files', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-proofs
DROP POLICY IF EXISTS "upload_payment_proofs" ON storage.objects;
CREATE POLICY "upload_payment_proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'payment-proofs');
DROP POLICY IF EXISTS "view_payment_proofs" ON storage.objects;
CREATE POLICY "view_payment_proofs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'payment-proofs');
DROP POLICY IF EXISTS "delete_payment_proofs" ON storage.objects;
CREATE POLICY "delete_payment_proofs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'payment-proofs');

-- Storage policies for knowledge-files
DROP POLICY IF EXISTS "upload_knowledge_files" ON storage.objects;
CREATE POLICY "upload_knowledge_files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'knowledge-files');
DROP POLICY IF EXISTS "view_knowledge_files" ON storage.objects;
CREATE POLICY "view_knowledge_files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'knowledge-files');
DROP POLICY IF EXISTS "delete_knowledge_files" ON storage.objects;
CREATE POLICY "delete_knowledge_files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'knowledge-files');