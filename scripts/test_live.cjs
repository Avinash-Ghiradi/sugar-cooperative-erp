const https = require('https');

https.get('https://avinash-ghiradi.github.io/sugar-cooperative-erp/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    const match = data.match(/src="([^"]*index[^"]*\.js)"/);
    console.log('Index JS src:', match ? match[1] : 'NOT FOUND');
    console.log('Full HTML:\n', data);
  });
});
