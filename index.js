// index.js — KENICHI‑XD WhatsApp Bot
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const path = require('path')

// Load environment variables from config.js
const { BOT_NAME, OWNER_NUMBER } = require('./config')

// Authentication state
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state
  })

  // connection updates
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
        startBot()
      } else {
        console.log('Logged out — delete session folder and retry')
      }
    }
    console.log('Connecting...', connection)
  })

  sock.ev.on('creds.update', saveCreds)

  // load all plugins (commands)
  const pluginsDir = path.join(__dirname, 'plugins')
  fs.readdirSync(pluginsDir).forEach(file => {
    require(path.join(pluginsDir, file))(sock)
  })

  console.log(`${BOT_NAME} is now running!`)
}

startBot()
