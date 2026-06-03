const mineflayer = require('mineflayer');
const express = require('express');

// ==========================================
// 1. EXPRESS SERVER (Keeps Render Awake)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('AFK Bot Status: Online and Active.');
});

app.listen(PORT, () => {
    console.log(`Web server listening on port ${PORT}`);
});

// ==========================================
// 2. MINECRAFT BOT CONFIGURATION
// ==========================================
const config = {
    host: 'thehatman78.aternos.me', // Replace with your server IP
    port: 25565,                      // Replace if server uses custom port
    username: 'im_bot',         // Your bot's Minecraft username/email
    version: false                   // 'false' auto-detects server version
};

function startBot() {
    console.log('Connecting to Minecraft server...');
    const bot = mineflayer.createBot(config);

    // Anti-AFK interval variable
    let afkInterval;

    bot.on('spawn', () => {
        console.log('Bot successfully spawned in the server!');
        
        // Anti-AFK Routine: Rotates and jumps every 20 seconds to prevent kicks
        afkInterval = setInterval(() => {
            if (!bot.entity) return;
            
            // Look a random direction
            const yaw = Math.random() * Math.PI * 2;
            const pitch = (Math.random() - 0.5) * Math.PI;
            bot.look(yaw, pitch);
            
            // Jump
            bot.setControlState('jump', true);
            setTimeout(() => bot.setControlState('jump', false), 500);
        }, 20000); 
    });

    // Error logging
    bot.on('error', (err) => console.log(`Error: ${err.message}`));

    // ==========================================
    // 3. AUTO-RECONNECT LOGIC
    // ==========================================
    bot.on('end', (reason) => {
        console.log(`Disconnected from server. Reason: ${reason}`);
        clearInterval(afkInterval);
        
        console.log('Attempting reconnection in 15 seconds...');
        setTimeout(() => {
            startBot();
        }, 15000);
    });
}

// Fire up the bot
startBot();
