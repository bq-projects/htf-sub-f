export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  industry: string | null;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  contact_email: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  products_services: string | null;
  target_audience: string | null;
  preferred_language: string;
  brand_colors: { primary?: string; secondary?: string } | null;
  brand_tone: string | null;
  business_goals: string | null;
  social_links: Record<string, string> | null;
  onboarding_complete: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  preferred_language: string;
  response_style: string;
  tone: string;
  instructions: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeSource {
  id: string;
  business_id: string;
  name: string;
  source_type: string;
  file_url: string | null;
  url: string | null;
  raw_text: string | null;
  status: string;
  chunk_count: number;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeChunk {
  id: string;
  knowledge_source_id: string;
  business_id: string;
  content: string;
  chunk_index: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  business_id: string;
  user_id: string;
  agent_id: string | null;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  business_id: string;
  role: string;
  content: string;
  citations: Citation[] | null;
  model_used: string | null;
  created_at: string;
}

export interface Citation {
  source: string;
  content: string;
}

export interface GeneratedContent {
  id: string;
  business_id: string;
  campaign_id: string | null;
  user_id: string;
  type: string;
  platform: string | null;
  title: string | null;
  content: string;
  metadata: Record<string, unknown> | null;
  model_used: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  business_id: string;
  user_id: string;
  name: string;
  type: string;
  status: string;
  event_details: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface VoiceoverGeneration {
  id: string;
  business_id: string;
  user_id: string;
  campaign_id: string | null;
  script_text: string;
  voice_id: string | null;
  voice_name: string | null;
  language: string;
  audio_url: string | null;
  status: string;
  duration_seconds: number | null;
  error_message: string | null;
  created_at: string;
}

export interface UsageEvent {
  id: string;
  business_id: string;
  user_id: string;
  type: string;
  model_used: string | null;
  tokens_used: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PlanConfig {
  id: string;
  plan_key: string;
  plan_name: string;
  price_pkr: number;
  price_usd: number;
  billing_period: string;
  max_businesses: number;
  max_knowledge_files: number;
  max_generations: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentProof {
  id: string;
  business_id: string | null;
  user_id: string;
  plan_key: string;
  screenshot_url: string;
  amount_pkr: number | null;
  transaction_id: string | null;
  status: string;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const PLAN_LIMITS: Record<string, { max_knowledge_files: number; max_generations: number; max_businesses: number }> = {
  free: { max_knowledge_files: 3, max_generations: 20, max_businesses: 1 },
  pro: { max_knowledge_files: 20, max_generations: 100, max_businesses: 3 },
  business: { max_knowledge_files: 100, max_generations: 500, max_businesses: 10 },
};
