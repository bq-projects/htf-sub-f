# BizAgent OS — Testing

## Test Environment
- Browser: Chrome/Edge (latest)
- Supabase: Cloud-hosted PostgreSQL
- AI Models: Qwen3-4B via Ollama, Google Gemini, ElevenLabs

## Test Cases

### 1. Authentication
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| AUTH-01 | User registration | Go to /register, fill form, submit | Account created, redirected to onboarding | ✅ Pass |
| AUTH-02 | User login | Go to /login, enter credentials | Logged in, redirected to dashboard | ✅ Pass |
| AUTH-03 | Invalid login | Enter wrong password | Error message shown | ✅ Pass |
| AUTH-04 | Sign out | Click sign out | Redirected to landing page | ✅ Pass |

### 2. Business Onboarding
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| ONBOARD-01 | Step 1: Business info | Fill name, industry, description | Can proceed to step 2 | ✅ Pass |
| ONBOARD-02 | Step 2: Products | Fill products and audience | Can proceed to step 3 | ✅ Pass |
| ONBOARD-03 | Step 3: Brand | Select tone, colors, social links | Can proceed to step 4 | ✅ Pass |
| ONBOARD-04 | Step 4: Plan selection | Select Free plan | Business, subscription, agent created | ✅ Pass |

### 3. Knowledge Base
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| KB-01 | Add text knowledge | Add manual text entry | Source created, chunks indexed | ✅ Pass |
| KB-02 | Add URL | Enter website URL | Content extracted, chunks created | ✅ Pass |
| KB-03 | Upload file | Upload .txt file | File stored, text extracted | ✅ Pass |
| KB-04 | Delete source | Click delete | Source and chunks removed | ✅ Pass |
| KB-05 | Reprocess | Click reprocess | Chunks re-created | ✅ Pass |

### 4. AI Chat
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| CHAT-01 | New conversation | Click new chat | Empty conversation created | ✅ Pass |
| CHAT-02 | Send message | Type and send | User message stored, AI responds | ✅ Pass (with Qwen) |
| CHAT-03 | Knowledge grounding | Ask about products | Response uses uploaded knowledge | ✅ Pass (with Qwen) |
| CHAT-04 | Copy response | Click copy | Content copied to clipboard | ✅ Pass |
| CHAT-05 | Delete conversation | Click delete | Conversation removed | ✅ Pass |
| CHAT-06 | AI unavailable | No Ollama running | Graceful error message shown | ✅ Pass |

### 5. Marketing Studio
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| MKT-01 | Generate post | Select platform, fill form | Content generated | ✅ Pass (with Gemini) |
| MKT-02 | Copy content | Click copy | Content copied | ✅ Pass |
| MKT-03 | Regenerate | Click regenerate | New content generated | ✅ Pass |

### 6. Admin Panel
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| ADM-01 | Admin login | Go to /sadmin, enter credentials | Admin dashboard shown | ✅ Pass |
| ADM-02 | View payments | Go to payments tab | All payment proofs listed | ✅ Pass |
| ADM-03 | Approve payment | Click approve | Subscription activated | ✅ Pass |
| ADM-04 | Reject payment | Click reject | Payment marked rejected | ✅ Pass |
| ADM-05 | Edit plan | Go to plans tab, edit, save | Plan config updated | ✅ Pass |
| ADM-06 | View businesses | Go to businesses tab | All businesses listed | ✅ Pass |

### 7. Subscription & Pricing
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| SUB-01 | View pricing | Go to /pricing | All plans displayed from database | ✅ Pass |
| SUB-02 | Upload payment | Select paid plan, upload screenshot | Payment proof submitted | ✅ Pass |
| SUB-03 | View subscription | Go to /subscription | Current plan and history shown | ✅ Pass |

### 8. Security
| ID | Test | Steps | Expected | Status |
|----|------|-------|----------|--------|
| SEC-01 | RLS isolation | Try accessing other business data | Access denied by RLS | ✅ Pass |
| SEC-02 | Unauthenticated access | Try /dashboard without login | Redirected to login | ✅ Pass |
| SEC-03 | Admin auth | Try /sadmin without credentials | Login screen shown | ✅ Pass |
| SEC-04 | SSRF protection | Add private IP URL to knowledge | Request blocked | ✅ Pass |

## Testing Notes

- AI features (chat, marketing, voiceover) require corresponding API keys/model endpoints to be configured
- Without Ollama/Qwen running, chat returns a graceful error message
- Without GEMINI_API_KEY, marketing generation falls back to Qwen if available
- Without ELEVENLABS_API_KEY, voiceover shows configuration message
- All database operations are secured with RLS policies
- Admin authentication uses server-side edge function with service role key
