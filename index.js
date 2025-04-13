require('dotenv').config();
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const chalk = require("chalk");
const { OpenAI } = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(chalk.green(`Message from ${from}: ${body}`));

        if (body.toLowerCase() === "hi" || body.toLowerCase() === "hello") {
            await sock.sendMessage(from, { text: `Hello! Ami ${process.env.BOT_NAME}. How can I assist you, ${process.env.OWNER_NAME}?` });
        }

        if (body.startsWith(".ai")) {
            const prompt = body.slice(3).trim();
            if (!prompt) return sock.sendMessage(from, { text: "Please provide a prompt after .ai" });

            try {
                const response = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }]
                });

                const reply = response.choices[0].message.content;
                await sock.sendMessage(from, { text: reply });
            } catch (err) {
                console.error(err);
                await sock.sendMessage(from, { text: "AI response failed." });
            }
        }

        if (body.toLowerCase() === ".ping") {
            await sock.sendMessage(from, { text: "Pong!" });
        }

        if (body.toLowerCase() === ".owner") {
            await sock.sendMessage(from, { text: `Owner: ${process.env.OWNER_NAME}` });
        }
    });

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed. Reconnecting:", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log(chalk.blue("Bot is now connected"));
        }
    });
}

startBot();