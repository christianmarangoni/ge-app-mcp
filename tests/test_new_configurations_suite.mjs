import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '../build/index.js');

const targetEngineId = 'demo_1779954482924'; // Sandbox test app "demo"

const transport = new StdioClientTransport({
  command: 'node',
  args: [serverPath],
  env: {
    ...process.env,
    PATH: `/opt/homebrew/bin:${process.env.PATH}`,
    GCP_PROJECT: 'rootprj-377111',
    GCP_LOCATION: 'global',
    GCP_COLLECTION: 'default_collection',
    GOOGLE_CLOUD_QUOTA_PROJECT: 'rootprj-377111',
    MCP_SCOPES: 'search,admin,billing',
  }
});

const client = new Client({
  name: 'test-new-configurations-suite',
  version: '1.0.0'
}, {
  capabilities: {}
});

async function run() {
  console.log('🌌 Starting New Configurations Test Suite on sandbox app "demo"...');
  await client.connect(transport);
  console.log('✅ Connected to MCP Server!\n');

  let createdControlId = null;

  // TEST 1: Feature Management
  try {
    console.log('--- [1/4] Testing gemini_enterprise_manage_features (get) ---');
    const res = await client.callTool({
      name: 'gemini_enterprise_manage_features',
      arguments: { action: 'get', engine_id: targetEngineId }
    });
    console.log('Feature Management Get Output:');
    console.log(res.content[0].text);
  } catch (err) {
    console.error('❌ Feature Management get failed:', err.message || err);
  }

  // TEST 2: Search UI & Pinned Link
  try {
    console.log('\n--- [2/4] Testing gemini_enterprise_manage_search_ui (get & pinned link) ---');
    const resGet = await client.callTool({
      name: 'gemini_enterprise_manage_search_ui',
      arguments: { action: 'get', engine_id: targetEngineId }
    });
    console.log('Search UI Controls Output:');
    console.log(resGet.content[0].text);

    console.log('\nTesting pinned link creation...');
    const linkId = `test-pinned-${Date.now()}`;
    const resPinned = await client.callTool({
      name: 'gemini_enterprise_manage_search_ui',
      arguments: {
        action: 'manage_pinned_link',
        engine_id: targetEngineId,
        pinned_link: {
          link_id: linkId,
          title: 'Test Shortcut Link',
          uri: 'https://example.com/test-shortcut'
        }
      }
    });
    console.log('Pinned Link Creation Output:');
    console.log(resPinned.content[0].text);
    createdControlId = linkId;
  } catch (err) {
    console.error('❌ Search UI test failed:', err.message || err);
  }

  // TEST 3: Assistant & Prompt Chips
  try {
    console.log('\n--- [3/4] Testing gemini_enterprise_manage_assistant (get) ---');
    const resAssistant = await client.callTool({
      name: 'gemini_enterprise_manage_assistant',
      arguments: { action: 'get', engine_id: targetEngineId }
    });
    console.log('Assistant Config Output:');
    console.log(resAssistant.content[0].text);
  } catch (err) {
    console.error('❌ Assistant test failed:', err.message || err);
  }

  // TEST 4: Observability
  try {
    console.log('\n--- [4/4] Testing gemini_enterprise_manage_observability (get) ---');
    const resObs = await client.callTool({
      name: 'gemini_enterprise_manage_observability',
      arguments: { action: 'get', engine_id: targetEngineId }
    });
    console.log('Observability Output:');
    console.log(resObs.content[0].text);
  } catch (err) {
    console.error('❌ Observability test failed:', err.message || err);
  }

  // CLEANUP: Delete temporary test control if created
  if (createdControlId) {
    console.log(`\n--- Cleaning up temporary test control "${createdControlId}" ---`);
    try {
      await client.callTool({
        name: 'gemini_enterprise_manage_controls',
        arguments: {
          action: 'delete',
          engine_id: targetEngineId,
          control_id: createdControlId
        }
      });
      console.log(`✅ Temporary control "${createdControlId}" deleted cleanly.`);
    } catch (err) {
      console.error('Cleanup warning:', err.message || err);
    }
  }

  console.log('\n🏁 New Configurations Test Suite Completed Successfully!');
  await client.close();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal Test Suite Failure:', err);
  process.exit(1);
});
