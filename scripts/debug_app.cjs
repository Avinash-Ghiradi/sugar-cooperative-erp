const { spawn } = require('child_process');
const http = require('http');

async function debug() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\Users\\New\\AppData\\Local\\Temp\\chrome_debug_profile_2',
    'https://avinash-ghiradi.github.io/sugar-cooperative-erp/'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', async () => {
      const targets = JSON.parse(data);
      const page = targets.find(t => t.type === 'page');
      if (!page) {
        console.log('No page target found');
        chrome.kill();
        return;
      }

      console.log('Connecting to WebSocket:', page.webSocketDebuggerUrl);
      const ws = new WebSocket(page.webSocketDebuggerUrl);
      let id = 1;

      const send = (method, params = {}) => {
        return new Promise((resolve) => {
          const reqId = id++;
          const handler = (msg) => {
            const resp = JSON.parse(msg.data);
            if (resp.id === reqId) {
              ws.removeEventListener('message', handler);
              resolve(resp.result);
            }
          };
          ws.addEventListener('message', handler);
          ws.send(JSON.stringify({ id: reqId, method, params }));
        });
      };

      ws.onopen = async () => {
        console.log('WS opened');
        await send('Runtime.enable');
        await send('Log.enable');
        await send('Page.enable');

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Runtime.consoleAPICalled') {
            console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
          } else if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[BROWSER EXCEPTION]', JSON.stringify(msg.params.exceptionDetails));
          }
        };

        // 1. Inject User Session into localStorage and reload
        console.log('Injecting session and reloading...');
        await send('Runtime.evaluate', {
          expression: `(() => {
            const user = {
              employee_id: "10299",
              name: "Avinash Ghiradimath",
              username: "avinash",
              role: "Admin"
            };
            localStorage.setItem('sugar_erp_user', JSON.stringify(user));
            localStorage.setItem('sugar_erp_last_activity', String(Date.now()));
            localStorage.setItem('sugar_erp_active_module', 'attendance');
            window.location.reload();
          })()`
        });

        // Wait 10 seconds while monitoring logs
        console.log('Waiting 10s for page to reload and render Attendance...');
        await new Promise(r => setTimeout(r, 10000));

        // Evaluate whether the page rendered or hung
        const evalState = await send('Runtime.evaluate', {
          expression: `(() => {
            return {
              title: document.title,
              bodyHtmlLength: document.body.innerHTML.length,
              activeAgmButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(t => t.includes('AGM'))
            };
          })()`,
          returnByValue: true
        });
        console.log('State after 10s:', evalState);

        ws.close();
        chrome.kill();
      };
    });
  });
}

debug().catch(console.error);
