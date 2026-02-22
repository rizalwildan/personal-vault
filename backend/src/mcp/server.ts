import { mcpService } from '../services/mcp.service.js';

try {
  await mcpService.startStdio();
} catch (error) {
  console.error('❌ Failed to start MCP Server:', error);
  process.exit(1);
}
