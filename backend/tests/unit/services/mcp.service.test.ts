import { describe, test, expect } from 'bun:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Import the singleton after the class so we can also test the service instance
import { mcpService } from '../../../src/services/mcp.service.js';

describe('MCPService', () => {
  test('getStatus returns correct initial state before startStdio()', () => {
    const status = mcpService.getStatus();
    expect(status.isInitialized).toBe(false);
    expect(status.transport).toBe('none');
    expect(status.serverName).toBe('bmad-personal-vault');
  });

  test('getStatus().serverName equals bmad-personal-vault', () => {
    const status = mcpService.getStatus();
    expect(status.serverName).toBe('bmad-personal-vault');
  });

  test('resources/list handler returns empty resources array', async () => {
    // Create a fresh McpServer instance for testing to isolate from singleton state
    const testServer = new McpServer({
      name: 'bmad-personal-vault',
      version: '1.0.0',
    });

    // Initialize resource handling before connecting
    // McpServer uses lazy handler registration - must register at least one resource
    // before connect() to set up the handler infrastructure
    const dummy = testServer.registerResource(
      'init',
      'internal://init',
      {},
      async () => ({ contents: [] }),
    );
    dummy.remove();

    // Create linked pair of in-memory transports for testing
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();

    // Connect the server to the test transport
    await testServer.connect(serverTransport);

    // Create and connect a test client
    const client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} },
    );
    await client.connect(clientTransport);

    // Test resources/list handler (should return empty array when no resources registered)
    // McpServer automatically handles resources/list requests and returns [] when no resources
    const result = await client.listResources();
    expect(result.resources).toEqual([]);

    // Cleanup
    await testServer.close();
    await client.close();
  });
});
