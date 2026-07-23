# Obsidian Capture - Problem-Solving Knowledge Base

## 🎯 Purpose

Skill ini **bukan hanya** mencatat conversation, tapi **membangun knowledge base** untuk troubleshooting masa depan.

---

## 💡 Konsep

**Setiap kali solve problem → Capture ke Obsidian**

Hasilnya:
- 📚 Living troubleshooting documentation
- 🔍 Searchable by error/keyword
- ⚡ Instant solution untuk problem serupa
- 🧠 Team knowledge tidak hilang

---

## 🎯 Real Example: Session Hari Ini

### Problem 1: Obsidian MCP SSL Error

**Symptoms**: 
```
SSE error: self signed certificate
```

**Tried**:
1. ❌ Remote MCP → SSL issue
2. ❌ Local MCP + npm bridge → Connection closed
3. ✅ Filesystem MCP → Works!

**Solution**:
```json
"obsidian": {
    "type": "local",
    "command": ["npx", "@modelcontextprotocol/server-filesystem", 
                "C:/Users/nauval/Documents/Obsidian Vault"]
}
```

**Keywords**: `obsidian`, `mcp`, `ssl-error`, `self-signed-certificate`

**Future**: Kalau ada error SSL di MCP lagi → Search `#troubleshooting #ssl-error` → Langsung dapat solusi: "pakai filesystem MCP"

---

### Problem 2: Green vs Emerald Colors

**Symptoms**: 634 instances inconsistent

**Solution**: Mass replace via regex
```bash
(Get-Content) -replace 'bg-green-', 'bg-emerald-'
```

**Keywords**: `tailwind`, `colors`, `mass-replace`, `design-system`

**Future**: Kalau perlu mass replace colors lagi → Search `#mass-replace #tailwind` → Copy command

---

## 🔍 How to Use Knowledge Base

### Scenario: Error Serupa Terjadi Lagi

1. **Buka Obsidian**
2. **Search**: `#troubleshooting` + `[error keyword]`
3. **Find session note** dengan problem serupa
4. **Jump ke "Problems Encountered"** section
5. **Follow solution** yang sudah proven work
6. **Check "Gotchas"** untuk avoid pitfalls

### Example Search Queries:

```
#troubleshooting #ssl-error
→ Find: SSL certificate issues & solutions

#troubleshooting #mcp
→ Find: All MCP-related problems

#design-system #mass-replace
→ Find: Bulk refactoring techniques

#obsidian #integration
→ Find: Integration setup & configs
```

---

## 📊 Benefits Over Time

**After 10 sessions**:
- 10 problems documented
- 10 proven solutions
- Keywords indexed

**After 50 sessions**:
- 50+ problems solved & documented
- Patterns emerge
- Common solutions identified
- Troubleshooting time ↓ 80%

**After 100 sessions**:
- Comprehensive troubleshooting database
- Most problems have documented solutions
- New team members can self-serve
- Institutional knowledge preserved

---

## 🎯 Best Practices

### When to Capture:

✅ **DO capture**:
- After solving tricky bug
- After making architecture decision
- After setup/integration work
- After troubleshooting session
- After discovering gotchas

❌ **Don't need to capture**:
- Simple typo fixes
- Routine updates
- Quick questions

### What to Emphasize:

**Focus on**:
- 🐛 Problem symptoms (exact error messages)
- 🔍 Root cause (WHY it happened)
- ✅ Solution (step-by-step)
- 🏷️ Keywords (for searching)
- ⚠️ Gotchas (mistakes to avoid)

**Less important**:
- Full conversation transcript
- Every single message
- Routine commands

---

## 🚀 Usage

```
/obsidian-capture
```

Agent will:
1. Analyze conversation for problems & solutions
2. Extract root causes & decisions
3. Format as troubleshooting reference
4. Add searchable keywords
5. Save to: `SINTAK-ERP/Sessions/Session-YYYY-MM-DD-Topic.md`

---

## 📝 Example Output Structure

```markdown
## 🐛 Problems Encountered

### Problem 1: [Error Title]
**Symptoms**: [Exact error message]
**Root Cause**: [Why it happened]
**Solution**: [What fixed it]
**Result**: ✅ Fixed
**Keywords**: error-name, library, concept

Future Reference:
- Search for: [keywords]
- Similar to: [[Other Session]]
- Prevention: [How to avoid]
```

---

## 💡 Pro Tips

1. **Capture immediately** after solving - details fresh
2. **Be specific** with error messages - copy exact text
3. **Add keywords** liberally - easier to find later
4. **Link related notes** - build knowledge graph
5. **Review captures** monthly - identify patterns

---

## 🎉 Result

**Before**: Solve same problem multiple times, forget solution

**After**: Solve once → Document → Never solve again (just search)

---

**Status**: ✅ Ready  
**Restart OpenCode**: Required to activate  
**Test**: `/obsidian-capture`
