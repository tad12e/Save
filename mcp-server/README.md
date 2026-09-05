# Save MCP Server

Model Context Protocol (MCP) server for **Save** — connect your AI assistants (Claude Desktop, Cursor, Zed, Antigravity) directly to your saved clips, articles, and bookmarks.

---

## Capabilities

With the Save MCP Server, your AI assistant can:
- 🔍 **`search_clips`**: Semantic search across all your bookmarks, notes, and research using pgvector embeddings and keyword search.
- 📋 **`list_clips`**: Browse clips by Action Intent (`apply`, `learn`, `buy`, `attend`, `hire`, `track`, `other`) or source platform (`x_twitter`, `reddit`, `youtube`, `github`, etc.).
- 📖 **`get_clip`**: Inspect structured metadata, AI summary, deadline dates, and tags for any clip.
- 📄 **`read_clip_content`**: Read the **full extracted article or webpage text** for comprehensive reasoning, deep dives, and citations.
- 💾 **`save_clip`**: Save any link or excerpt directly to your vault from your AI conversation.
- ✏️ **`update_clip`**: Tag, reclassify, or attach notes to clips.

---

## Quickstart

### 1. Generate an API Key
Generate an API key from the Save web app under **Settings > API Keys & MCP**, or via the API:
```bash
curl -X POST http://localhost:8000/api/v1/users/api-keys/ \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Claude Desktop"}'
```
You will receive a key like `save_live_a1b2c3d4e5f6...`.

---

### 2. Configure Claude Desktop

Add this configuration to your Claude Desktop config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "save": {
      "command": "uvx",
      "args": ["--from", "path/to/Save/mcp-server", "save-mcp"],
      "env": {
        "SAVE_API_KEY": "save_live_your_api_key_here",
        "SAVE_API_URL": "http://localhost:8000/api/v1"
      }
    }
  }
}
```

Or when running from a Python virtual environment:
```json
{
  "mcpServers": {
    "save": {
      "command": "python",
      "args": ["-m", "save_mcp.server"],
      "env": {
        "SAVE_API_KEY": "save_live_your_api_key_here",
        "SAVE_API_URL": "http://localhost:8000/api/v1"
      }
    }
  }
}
```

---

### 3. Configure Cursor

In Cursor:
1. Go to **Settings > Features > MCP**.
2. Click **+ Add New MCP Server**.
3. Set:
   - **Name**: `Save`
   - **Type**: `command`
   - **Command**: `uvx --from path/to/Save/mcp-server save-mcp`
   - **Environment Variables**:
     - `SAVE_API_KEY`: `save_live_...`
     - `SAVE_API_URL`: `http://localhost:8000/api/v1`

---

## Development & Local Testing

Install the package in editable mode:
```bash
cd Save/mcp-server
pip install -e .
```

Run the server directly via stdio:
```bash
SAVE_API_KEY=save_live_... python -m save_mcp.server
```
