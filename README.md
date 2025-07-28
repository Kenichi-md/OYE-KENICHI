```js
// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'kenichi-xd' })
});

client.on('qr', (qr) => {
    console.log('QR Code:', qr);
});

client.on('authenticated', (session) => {
    console.log('Authenticated with session:', session);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', message => {
    if(message.body.toLowerCase() === 'hi') {
        message.reply('Hello from Kenichi-XD bot!');
    }
});

client.initialize();
```
