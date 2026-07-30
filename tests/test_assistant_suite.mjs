import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '../build/index.js');

const targetEngineId = 'tes';

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
  name: 'test-assistant-suite',
  version: '1.0.0'
}, {
  capabilities: {}
});

async function run() {
  console.log(`🌌 Testing comprehensive Assistant options via MCP on app "${targetEngineId}"...\n`);
  await client.connect(transport);

  console.log('--- 1. CONFIGURING ALL ASSISTANT OPTIONS (Customize System Instruction, Web Grounding, Location, Banned Phrases, Retention) ---');
  const resUpdate = await client.callTool({
    name: 'gemini_enterprise_manage_assistant',
    arguments: {
      action: 'update',
      engine_id: targetEngineId,
      system_instruction: 'Sei un assistente AI specializzato per Lepida e Maggioli.',
      enable_web_grounding: true,
      web_grounding_type: 'ENTERPRISE_WEB_SEARCH',
      default_web_search_state: true,
      enable_location_context: true,
      banned_phrases: ['testbannedphrase', 'parolaproibita'],
      chat_history_retention_days: 90
    }
  });
  console.log('✅ Update Result:', JSON.parse(resUpdate.content[0].text).message);

  console.log('\n--- 2. VERIFYING ASSISTANT OPTIONS (action: "get") ---');
  const resGet1 = await client.callTool({
    name: 'gemini_enterprise_manage_assistant',
    arguments: { action: 'get', engine_id: targetEngineId }
  });
  const get1Data = JSON.parse(resGet1.content[0].text).assistant_options;
  console.log('======================================================');
  console.log('          ASSISTANT CONFIGURATION STATUS');
  console.log('======================================================');
  console.log('System Instruction Mode  :', get1Data.additional_llm_system_instructions.mode);
  console.log('System Instruction Text  :', get1Data.additional_llm_system_instructions.instruction);
  console.log('Web Grounding Enabled    :', get1Data.enable_web_grounding.enabled ? '✅ ENABLED' : '❌ DISABLED');
  console.log('Web Grounding Type       :', get1Data.enable_web_grounding.grounding_type);
  console.log('Default Web Search State :', get1Data.default_web_search_state.enabled ? '✅ ENABLED' : '❌ DISABLED');
  console.log('Location Context         :', get1Data.enable_location_context.enabled ? '✅ ENABLED' : '❌ DISABLED');
  console.log('Banned Phrases Count     :', get1Data.banned_phrases.count, `(${get1Data.banned_phrases.phrases.join(', ')})`);
  console.log('Chat History Retention   :', `${get1Data.chat_history_retention_period.days} days`);
  console.log('======================================================');

  console.log('\n--- 3. TESTING RESET / USE DEFAULT (use_default_system_instruction: true, disable_all_assistant_features: true) ---');
  await client.callTool({
    name: 'gemini_enterprise_manage_assistant',
    arguments: {
      action: 'update',
      engine_id: targetEngineId,
      use_default_system_instruction: true,
      disable_all_assistant_features: true,
      chat_history_retention_days: 60
    }
  });

  console.log('\n--- 4. VERIFYING RESET STATUS (action: "get") ---');
  const resGet2 = await client.callTool({
    name: 'gemini_enterprise_manage_assistant',
    arguments: { action: 'get', engine_id: targetEngineId }
  });
  const get2Data = JSON.parse(resGet2.content[0].text).assistant_options;
  console.log('System Instruction Mode  :', get2Data.additional_llm_system_instructions.mode);
  console.log('Web Grounding Enabled    :', get2Data.enable_web_grounding.enabled ? '✅ ENABLED' : '❌ DISABLED');
  console.log('Chat History Retention   :', `${get2Data.chat_history_retention_period.days} days`);

  await client.close();
  console.log('\n🎉 Assistant MCP Tool Test Suite Completed Successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Test Error:', err);
  process.exit(1);
});
