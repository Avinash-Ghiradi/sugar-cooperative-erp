const { spawn } = require('child_process');

console.log('Testing chrome execution...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const proc = spawn(chromePath, [
  '--headless=new',
  '--dump-dom',
  '--virtual-time-budget=10000',
  'https://avinash-ghiradi.github.io/sugar-cooperative-erp/'
]);

let output = '';
let errOutput = '';

proc.stdout.on('data', d => { output += d.toString(); });
proc.stderr.on('data', d => { errOutput += d.toString(); });

proc.on('close', code => {
  console.log('Exited with code:', code);
  console.log('Output length:', output.length);
  if (output.includes('root') || output.includes('Shree')) {
    console.log('Page DOM captured successfully!');
  }
  if (errOutput) console.log('Stderr:', errOutput.slice(0, 500));
});
