import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class MCPService {
  private readonly mcpServer: McpServer;
  private currentTransport: string = 'none';
  private initialized: boolean = false;

  constructor() {
    this.mcpServer = new McpServer({
      name: 'bmad-personal-vault',
      version: '1.0.0',
    });
    console.log('✅ MCP Server instance created');

    // Explicitly initialize resource handling by registering capabilities
    // This ensures resources/list handler is set up before connect()
    // Without this, McpServer won't handle resources/list requests
    this.initializeResourceHandling();
  }

  private initializeResourceHandling(): void {
    // Register a dummy resource and immediately remove it to trigger handler initialization
    // This is a workaround for McpServer's lazy handler registration
    const dummy = this.mcpServer.registerResource(
      'initialization-placeholder',
      'internal://init',
      {},
      async () => ({ contents: [] }),
    );
    dummy.remove();
  }

  async startStdio(): Promise<void> {
    try {
      const transport = new StdioServerTransport();
      await this.mcpServer.connect(transport);
      this.currentTransport = 'stdio';
      this.initialized = true;
      console.log('✅ MCP Server connected via stdio transport');
    } catch (error) {
      console.error(
        '❌ Failed to start MCP Server with stdio transport:',
        error,
      );
      throw error;
    }
  }

  getStatus(): {
    isInitialized: boolean;
    transport: string;
    serverName: string;
  } {
    return {
      isInitialized: this.initialized,
      transport: this.currentTransport,
      serverName: 'bmad-personal-vault',
    };
  }

  // Test-only method to access the internal server for InMemoryTransport testing
  getServer(): McpServer {
    return this.mcpServer;
  }
}

export const mcpService = new MCPService();
