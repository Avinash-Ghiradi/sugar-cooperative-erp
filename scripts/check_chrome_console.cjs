const { spawn } = require('child_process');

async function checkConsole() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--disable-gpu',
    '--no-sandbox',
    'https://avinash-ghiradi.github.io/sugar-cooperative-erp/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9333/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('sugar-cooperative-erp')) || tabs[0];
    console.log('Target tab:', tab.url);

    if (tab && tab.webSocketDebuggerUrl) {
      const ws = new WebSocket(tab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
        ws.send(JSON.stringify({ id: 4, method: 'Network.enable' }));
        // Reload page to catch all startup logs
        setTimeout(() => {
          ws.send(JSON.stringify({ id: 5, method: 'Page.reload' }));
        }, 500);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[Console]', msg.params.type, ...msg.params.args.map(a => a.value || a.description));
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('[EXCEPTION]', msg.params.exceptionDetails.text, msg.params.exceptionDetails.exception?.description);
        } else if (msg.method === 'Log.entryAdded') {
          console.log('[BrowserLog]', msg.params.entry.level, msg.params.entry.text);
        } else if (msg.method === 'Network.loadingFailed') {
          console.error('[NetworkFailed]', msg.params.errorText, msg.params.canceled);
        }
      };

      await new Promise(r => setTimeout(r, 5000));
      ws.close();
    }
  } catch (err) {
    console.error('CDP Error:', err);
  } finally {
    chrome.kill();
  }
}

checkConsole();
