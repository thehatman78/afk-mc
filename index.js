const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');

// ---- Load config ----
const configPath = path.join(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Allow overriding config via environment variables (handy on Falix Nodes,
// where you can set env vars in the panel instead of editing files).
config.host = process.env.MC_HOST || config.host;
config.port = process.env.MC_PORT ? parseInt(process.env.MC_PORT) : config.port;
config.username = process.env.MC_USERNAME || config.username;
config.password = process.env.MC_PASSWORD || config.password;
config.auth = process.env.MC_AUTH || config.auth;

let bot;
let antiAfkInterval;
let chatInterval;
let reconnectTimeout;

function log(msg) {
  const time = new Date().toISOString().replace('T', ' ').substring(0, 19);
  console.log(`[${time}] ${msg}`);
}

function createBot() {
  log(`Connecting to ${config.host}:${config.port} as "${config.username}"...`);

  const options = {
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth === 'microsoft' ? 'microsoft' : 'offline',
  };

  // Only set version if explicitly specified; otherwise mineflayer auto-detects.
  if (config.version) options.version = config.version;

  // Only needed for cracked/offline auth with a password on servers that support it (rare).
  if (config.password) options.password = config.password;

  bot = mineflayer.createBot(options);

  bot.on('login', () => {
    log('Successfully logged in.');
  });

  bot.on('spawn', () => {
    log('Bot has spawned in the world.');
    startAntiAfk();
    startChatLoop();
  });

  bot.on('kicked', (reason) => {
    log(`Kicked from server: ${JSON.stringify(reason)}`);
    cleanupIntervals();
    if (config.autoReconnectOnKick) scheduleReconnect();
  });

  bot.on('end', (reason) => {
    log(`Disconnected from server. Reason: ${reason || 'unknown'}`);
    cleanupIntervals();
    if (config.reconnect) scheduleReconnect();
  });

  bot.on('error', (err) => {
    log(`Error: ${err.message}`);
    // 'end' will usually fire after this and trigger reconnect logic.
  });

  bot.on('death', () => {
    log('Bot died, respawning...');
    bot.respawn();
  });

  // Optional: log chat messages to console, useful for debugging.
  bot.on('message', (jsonMsg) => {
    const text = jsonMsg.toString();
    if (text.trim().length > 0) {
      log(`[CHAT] ${text}`);
    }
  });
}

function startAntiAfk() {
  if (!config.antiAfk.enabled) return;
  const intervalMs = Math.max(5, config.antiAfk.intervalSeconds || 20) * 1000;

  antiAfkInterval = setInterval(() => {
    if (!bot || !bot.entity) return;

    try {
      if (config.antiAfk.lookAround) {
        const yaw = Math.random() * Math.PI * 2 - Math.PI;
        const pitch = (Math.random() * 0.6) - 0.3;
        bot.look(yaw, pitch, true);
      }

      if (config.antiAfk.jump) {
        bot.setControlState('jump', true);
        setTimeout(() => {
          if (bot) bot.setControlState('jump', false);
        }, 400);
      }

      if (config.antiAfk.walk) {
        const directions = ['forward', 'back', 'left', 'right'];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        bot.setControlState(dir, true);
        setTimeout(() => {
          if (bot) bot.setControlState(dir, false);
        }, 600);
      }
    } catch (err) {
      log(`Anti-AFK action failed: ${err.message}`);
    }
  }, intervalMs);
}

function startChatLoop() {
  if (!config.chatMessages || !config.chatMessages.enabled) return;
  const intervalMs = Math.max(1, config.chatMessages.intervalMinutes || 30) * 60 * 1000;
  const messages = config.chatMessages.messages || [];
  if (messages.length === 0) return;

  chatInterval = setInterval(() => {
    if (!bot) return;
    const msg = messages[Math.floor(Math.random() * messages.length)];
    bot.chat(msg);
    log(`Sent chat message: "${msg}"`);
  }, intervalMs);
}

function cleanupIntervals() {
  if (antiAfkInterval) clearInterval(antiAfkInterval);
  if (chatInterval) clearInterval(chatInterval);
  antiAfkInterval = null;
  chatInterval = null;
}

function scheduleReconnect() {
  if (reconnectTimeout) return; // already scheduled
  const delayMs = Math.max(3, config.reconnectDelaySeconds || 10) * 1000;
  log(`Reconnecting in ${delayMs / 1000} seconds...`);
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    createBot();
  }, delayMs);
}

// Basic safety net so the whole process doesn't crash silently.
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.stack || err.message}`);
});

createBot();
