# Obsidian Capture Skill

Custom OpenCode skill untuk capture seluruh conversation session ke Obsidian vault.

## 📋 Setup

**Location**: `C:\Users\nauval\.config\opencode\skills\obsidian-capture\SKILL.md`

**Config**: Already registered in `opencode.json`

```json
"skills": {
    "obsidian-capture": {
        "description": "Capture entire OpenCode session to Obsidian vault as markdown",
        "trigger": "/obsidian-capture"
    }
}
```

---

## 🚀 Usage

### **Trigger dengan Slash Command:**

```
/obsidian-capture
```

### **Atau Natural Language:**

```
capture this session to obsidian
```

```
save our conversation to my vault
```

---

## 📝 Output Format

Skill akan membuat markdown note dengan struktur:

```markdown
# OpenCode Session - 2026-07-20

**Topic**: Design System Refactor
**Date**: 2026-07-20 15:53
**Duration**: ~4 hours
**Status**: Completed

---

## Summary
[Brief summary of session]

## Discussion
[Organized by topic]

## Files Modified
- path/to/file.tsx - changes

## Commands Executed
```bash
command list
```

## Key Code Changes
[Important code snippets]

## Action Items
- [ ] Task 1
- [ ] Task 2

## Next Steps
[What's next]

## Tags
#opencode #sintak-erp #design-system
```

---

## 📂 Save Location

Default: `SINTAK-ERP/Sessions/Session-YYYY-MM-DD-Topic.md`

Skill will intelligently choose folder based on context.

---

## ✨ Features

- ✅ **Auto-summarize** conversation
- ✅ **Extract key decisions** and outcomes
- ✅ **List modified files** with descriptions
- ✅ **Capture commands** executed
- ✅ **Add action items** for follow-up
- ✅ **Tag appropriately** for searching
- ✅ **Smart filename** generation

---

## 🎯 Use Cases

### 1. End of Work Session
```
/obsidian-capture
# Saves full session log for reference
```

### 2. Document Decisions
```
capture our architecture discussion to obsidian
# Saves key decisions and reasoning
```

### 3. Create Meeting Notes
```
save this conversation as meeting notes
# Formats as structured meeting doc
```

### 4. Track Progress
```
/obsidian-capture
# Regular snapshots of project progress
```

---

## 🔧 Testing

**Restart OpenCode** untuk load skill:
```bash
/exit
opencode
```

**Test skill:**
```
/obsidian-capture
```

Agent akan:
1. Analyze conversation history
2. Format as structured markdown
3. Generate filename
4. Save to Obsidian vault
5. Confirm with location

---

## 💡 Tips

- Use `/obsidian-capture` at end of productive sessions
- Skill focuses on **decisions** and **outcomes**, not full transcript
- Generated notes are **searchable** via Obsidian tags
- Can be edited/enhanced in Obsidian after capture
- Works with any OpenCode session (coding, planning, debugging)

---

## 🔄 How It Works

1. **Skill triggered** → OpenCode loads SKILL.md instructions
2. **Agent analyzes** → Reviews conversation history
3. **Format markdown** → Structures content with headings
4. **Generate filename** → Creates descriptive name
5. **Save via MCP** → Uses obsidian tool to write file
6. **Confirm** → Reports success with location

---

## 📚 Example Output

```
📝 Capturing session to Obsidian...

✅ Session captured successfully!

📁 Saved to: SINTAK-ERP/Sessions/Session-2026-07-20-Design-System.md

📊 Summary:
- Design system refactor completed
- 634 color changes, 60+ components standardized
- Obsidian integration configured
- 20+ files modified

Full conversation with code changes and action items 
saved to your vault.
```

---

**Created**: 2026-07-20  
**Status**: ✅ Ready to use  
**Restart OpenCode** to activate skill
