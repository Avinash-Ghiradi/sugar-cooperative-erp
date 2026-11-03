const fs = require('fs');
const lines = fs.readFileSync('C:/Users/New/.gemini/antigravity/brain/09c94240-fca2-4544-9ada-6347d9444fbf/.system_generated/logs/transcript.jsonl', 'utf8').split('\n');

for (const line of lines) {
  try {
    const obj = JSON.parse(line.trim());
    if (obj.step_index === 4353) {
      console.log('Step 4353 tools:');
      console.log(JSON.stringify(obj.tool_calls, null, 2));
    }
  } catch(e) {}
}
