# Obsidian Integration untuk OpenCode

## ✅ Status: WORKING

**Method**: Direct filesystem access via MCP  
**Setup Date**: 2026-07-20  
**Last Test**: 2026-07-20 15:50 WIB

---

## 📋 Setup Summary

OpenCode mengakses Obsidian vault langsung sebagai folder markdown menggunakan filesystem MCP server.

**Config:**
```json
"obsidian": {
    "type": "local",
    "command": [
        "npx",
        "@modelcontextprotocol/server-filesystem",
        "C:/Users/nauval/Documents/Obsidian Vault"
    ],
    "enabled": true
}
```

**Vault Location:** `C:\Users\nauval\Documents\Obsidian Vault`

---

## 🚀 Usage

### Start OpenCode:
```bash
opencode
```

### Example Prompts:

**List files:**
```
use obsidian to list markdown files in the SINTAK-ERP folder
```

**Read note:**
```
use obsidian to read "SINTAK-ERP/README.md"
```

**Search:**
```
use obsidian to search for files containing "design"
```

**Create note:**
```
use obsidian to create "SINTAK-ERP/Notes.md" with content "test"
```

**Append:**
```
use obsidian to append to "SINTAK-ERP/README.md": 
- New item added via OpenCode
```

---

## 💡 Why Filesystem Method?

**Pros:**
- ✅ Simple & reliable
- ✅ No plugin needed
- ✅ No SSL/auth issues
- ✅ Works offline
- ✅ Full file operations

**Cons:**
- ❌ Cannot execute Obsidian commands
- ❌ Cannot open notes in Obsidian UI

**Verdict:** Best for automation & note management (90% use cases)

---

## 🔧 Troubleshooting

**MCP not loaded:**
```bash
/exit
opencode
```

**Wrong path:**
Verify in config: `C:/Users/nauval/Documents/Obsidian Vault`

---

## 📚 Available Operations

- Read/write markdown files
- Search by name/content
- List directories
- Create/delete files
- Move/rename files
- Get file metadata

---

**Status**: ✅ Tested & Working  
**No additional setup required**
