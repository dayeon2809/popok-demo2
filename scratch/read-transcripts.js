
const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\dayeo\\.gemini\\antigravity-ide\\brain';

function searchLogs() {
  if (!fs.existsSync(brainDir)) {
    console.log('Brain directory does not exist at ' + brainDir);
    return;
  }

  const dirs = fs.readdirSync(brainDir);
  console.log('Conversation folders found:', dirs);

  for (const dir of dirs) {
    const logPath = path.join(brainDir, dir, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(logPath)) {
      console.log(`Reading log from: ${logPath}`);
      const content = fs.readFileSync(logPath, 'utf8');
      const lines = content.split('\n');
      console.log(`Log has ${lines.length} lines.`);

      // Let's search for tool calls to replace_file_content or write_to_file
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.tool_calls) {
            for (const tc of obj.tool_calls) {
              if (tc.name === 'replace_file_content' || tc.name === 'write_to_file' || tc.name === 'multi_replace_file_content') {
                const args = tc.args || {};
                const target = args.TargetFile || args.Target;
                if (target && (target.includes('CompanyClientView') || target.includes('CompanyArtists') || target.includes('CompanyUpcomingPerformances'))) {
                  console.log(`Found tool call: ${tc.name} for ${target} in conversation ${dir}`);
                  // print a bit of details
                  console.log('Description:', args.Description || args.Instruction);
                  if (args.CodeContent) {
                    console.log('CodeContent length:', args.CodeContent.length);
                  }
                  if (args.ReplacementContent) {
                    console.log('ReplacementContent length:', args.ReplacementContent.length);
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }
}

searchLogs();
