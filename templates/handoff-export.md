You are about to hand off this session to another AI coding tool.

Generate a structured handoff document and save it as `handoff.md` in the project root.
Follow this schema EXACTLY — do not skip any section:

---

# 🤝 Context Handoff

## Meta
- **exported_at**: [current ISO 8601 timestamp]
- **exported_from**: [name of the current tool, e.g. claude-code]
- **session_id**: [generate a short random ID, e.g. a8f3c1]

## Project
- **name**: [project/repo name]
- **stack**: [comma-separated list of main technologies]
- **root**: [absolute path to project root]
- **package_manager**: [npm / pnpm / yarn / pip / etc]

## Current Task
[One clear paragraph describing what we are working on right now.
Be specific — include feature name, module, endpoint, etc.]

## Progress
[Checklist format. Mark done items [x] and pending [ ].]
- [x] Example: installed dependency X
- [ ] Example: fix the redirect URI bug
- [ ] Example: wire session to navbar

## Active Files
[List every file that is relevant or was modified this session.
Format: path — one-line description]
- src/auth.ts — NextAuth config, modified
- prisma/schema.prisma — Account/Session models added

## Blocker
[Describe the current error or blocker precisely.
Include the exact error message if there is one.
Write "None" if everything is clear.]

## Key Decisions
[Bullet list of architectural or technical decisions made this session.
The next AI must not reverse these without flagging first.]
- Using Prisma adapter (not JWT) so sessions persist in DB
- Keeping pages router only for /api routes

## Environment
[Anything the next AI needs to know about the environment.]
- Node version: 20.x
- Relevant env vars needed: AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- Local dev command: npm run dev (runs on port 3000)

## Next Steps
[Ordered list. Item 1 is the immediate next action.]
1. Fix redirect URI mismatch in Google Cloud Console
2. Test full login flow end to end
3. Add session user to navbar component

## For the Next AI
[Direct, imperative instructions. Be blunt.]
- Read all Active Files before doing anything.
- Fix the blocker first (see above).
- Do NOT switch from Prisma adapter to JWT strategy.
- Do NOT refactor unrelated code.
- Ask before making any changes outside the listed Active Files.

---

After writing handoff.md, respond with exactly:

✅ handoff.md written to project root.
Switch to your next tool and run /handoff-load to continue.

Summary:
- Task: [one line]
- Next step: [one line]
- Blocker: [one line or "None"]
