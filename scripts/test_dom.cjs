const { spawn } = require('child_process');

async function testDom() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9335',
    '--disable-gpu',
    '--no-sandbox',
    'https://avinash-ghiradi.github.io/sugar-cooperative-erp/'
  ]);

  await new Promise(r => setTimeout(r, 4000));

  try {
    const listRes = await fetch('http://127.0.0.1:9335/json/list');
    const tabs = await listRes.json();
    const tab = tabs.find(t => t.url.includes('sugar-cooperative-erp')) || tabs[0];
    console.log('Tab URL:', tab.url);

    if (tab && tab.webSocketDebuggerUrl) {
      const ws = new WebSocket(tab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `JSON.stringify({
                rootLength: document.getElementById('root')?.innerHTML.length || 0,
                rootHtml: document.getElementById('root')?.innerHTML.substring(0, 300),
                bodyClasses: document.body.className,
                title: document.title
              })`
            }
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 2) {
          console.log('Evaluation response:', JSON.stringify(msg, null, 2));
        } else if (msg.method === 'Runtime.exceptionThrown') {
          console.error('EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
        }
      };

      await new Promise(r => setTimeout(r, 6000));
      ws.close();
    }
  } catch (err) {
    console.error('Test DOM Error:', err);
  } finally {
    chrome.kill();
  }
}

testDom();
