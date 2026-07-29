import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '../build/index.js');

const targetEngineId = 'tes'; // Test sandbox engine "tes"

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
  name: 'test-feature-management-consolidated',
  version: '1.0.0'
}, {
  capabilities: {}
});

async function run() {
  console.log(`🌌 Starting Consolidated Feature Management & Model Availability Test Suite on app "${targetEngineId}"...\n`);
  await client.connect(transport);

  console.log('--- 1. ENABLING ALL GEMINI MODELS (enable_all_models: true) ---');
  const resEnableModels = await client.callTool({
    name: 'gemini_enterprise_manage_models',
    arguments: { action: 'update', engine_id: targetEngineId, enable_all_models: true }
  });
  console.log('✅ Result:', JSON.parse(resEnableModels.content[0].text).message);

  console.log('\n--- 2. ENABLING ALL 26 CORE FEATURES + CROSS DOMAIN (enable_all_features: true) ---');
  const resEnableFeatures = await client.callTool({
    name: 'gemini_enterprise_manage_features',
    arguments: { action: 'update', engine_id: targetEngineId, enable_all_features: true }
  });
  console.log('✅ Result:', JSON.parse(resEnableFeatures.content[0].text).message);

  console.log('\n--- 3. VERIFYING MODELS & FEATURES GET ACTION ---');
  const resGetModels = await client.callTool({
    name: 'gemini_enterprise_manage_models',
    arguments: { action: 'get', engine_id: targetEngineId }
  });
  const models = JSON.parse(resGetModels.content[0].text).model_availability;
  console.log('Models Enabled Count:', Object.values(models).filter(v => v === true).length, '/', Object.keys(models).length);

  const resGetFeatures = await client.callTool({
    name: 'gemini_enterprise_manage_features',
    arguments: { action: 'get', engine_id: targetEngineId }
  });
  const features = JSON.parse(resGetFeatures.content[0].text).features;
  console.log('Features Enabled Count:', Object.values(features).filter(v => v === true).length, '/', Object.keys(features).length);

  console.log('\n--- 4. RESTORING / DISABLING ALL AS REQUESTED BY USER (disable_all_models & disable_all_features) ---');
  await client.callTool({
    name: 'gemini_enterprise_manage_models',
    arguments: { action: 'update', engine_id: targetEngineId, disable_all_models: true }
  });
  await client.callTool({
    name: 'gemini_enterprise_manage_features',
    arguments: { action: 'update', engine_id: targetEngineId, disable_all_features: true }
  });
  console.log('✅ Successfully disabled all models and features after test completion.');

  await client.close();
  console.log('\n🎉 Consolidated Test Suite Completed Successfully!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Test Suite Error:', err);
  process.exit(1);
});
