Read the file `handoff.md` from the project root.

This is a session handoff from another AI coding tool.
The previous AI exported its full session context into this file.

Your job:

1. Read handoff.md completely.

2. Read every file listed under "Active Files" in handoff.md.
   Do this silently — do not narrate each file read.

3. Respond with a brief confirmation:

   ✅ Context loaded from [exported_from] session [session_id]
   
   **Project**: [name] — [stack]
   **Task**: [current task, one line]
   **Blocker**: [blocker or "None"]
   **I'll start with**: [Next Steps item #1]

4. Then immediately begin working on Next Steps item #1.

Rules:
- Do NOT ask for clarification before reading the files.
- Do NOT change anything listed as a Key Decision without flagging it first.
- Do NOT refactor code outside the scope of the current task.
- Follow "For the Next AI" instructions exactly.
- If handoff.md does not exist: "❌ No handoff.md found. Ask the previous AI to run /handoff-export first."
