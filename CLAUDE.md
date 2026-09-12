\# CLAUDE.md — Rules for this project



\## What this project is



Backend for a college thesis prototype (BS Computer Engineering, De La Salle

University). An AI-assisted app for a small Philippine eatery that takes pickup

orders through Facebook Page Messenger and posts promotions to the Facebook Page.



This repo is only what Meta App Review needs to see:



1\. A webhook that receives Messenger messages sent to the business Facebook Page

2\. Saving those messages to Supabase

3\. Sending an automatic reply back to the customer (Send API)

4\. Publishing a post to the Facebook Page



Out of scope: the mobile app UI, Gemini order extraction, the KPI dashboard,

follow-up scheduling, RAG. Other group members own those. Do not add them.



\## Who reads this code



A student still learning backend work, and later a thesis panel. The code must be

easy to read out loud and explain. If I cannot explain a line to a panel, it

should not be in the file.



\## Tech decisions (already made — do not change without asking)



\- Supabase Edge Functions (Deno + TypeScript) for the webhook and send logic

\- Supabase Postgres for storage

\- Graph API v26.0 — always use this version string in URLs

\- pg\_cron / Supabase Scheduled Functions for anything on a timer



\## Coding rules



\- TypeScript, but keep types minimal. A few type aliases. No generics, no utility

&#x20; types, no complex inference.

\- Keep each function file under about 150 lines. Split by feature.

\- Use async/await. No .then() chains.

\- Clear, boring names: pageAccessToken, senderId, messageText. No abbreviations.

\- No classes, no dependency injection, no service layers, no design patterns.

&#x20; Plain functions that each do one thing.

\- No clever one-liners. Two simple lines beat one smart line.

\- Comments explain why, not what.

\- Errors: plain try/catch plus a console.log of what failed.

\- Do not add dependencies without telling me why plain Deno cannot do it.



\## Webhook rules (these cause silent failures — follow exactly)



\- Deploy webhook functions with --no-verify-jwt. Meta does not send a JWT, and

&#x20; the default check makes the function return 401 and Meta marks it dead.

\- Read the raw body with await req.text() first, verify the X-Hub-Signature-256

&#x20; HMAC against that exact string, and only then JSON.parse it.

\- Return HTTP 200 as soon as the event is saved. Slow work happens after.

\- Store the Meta message id and ignore ids already saved. Meta re-sends events.

\- Handle messages, messaging\_postbacks, and messaging\_referrals. The referral one

&#x20; carries the ref from promotional m.me links, needed for campaign attribution.



\## Security rules (non-negotiable)



\- Never put tokens, app secrets, or API keys in code. Use supabase secrets set

&#x20; and read via Deno.env.get().

\- Never commit a .env. Keep a .env.example with empty values.

\- Never log a full message body or a raw customer Facebook ID.

\- Customer names are masked by design in this study. Do not store real names or

&#x20; profile data.



\## How to talk to me



\- Explain in simple English, like explaining to a classmate.

\- Before writing code, say in 2-3 sentences what you are about to do and why.

\- After writing code, give me the exact command to run and what I should see if

&#x20; it worked.

\- Warn me about beginner traps (wrong token, expired token, wrong API version,

&#x20; webhook not subscribed) and how to check each one.

\- Do not refactor files I did not ask about.

\- If something I ask for will fail Meta App Review, say so.



\## Secrets used



META\_VERIFY\_TOKEN     - random string I invent; also typed into Meta dashboard

META\_APP\_SECRET       - App Settings > Basic; verifies webhook signatures

PAGE\_ACCESS\_TOKEN     - token for the connected Facebook Page

SUPABASE\_URL

SUPABASE\_SERVICE\_ROLE\_KEY

