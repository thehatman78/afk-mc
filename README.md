# Minecraft AFK Bot (mineflayer)

A simple, reliable AFK bot for Minecraft Java Edition servers. It logs in, wanders
around a little (jump/walk/look) so it doesn't get auto-kicked for inactivity, and
automatically reconnects if it's disconnected or kicked.

## Files
- `index.js` — the bot
- `config.json` — all settings (server, username, anti-AFK behavior, chat)
- `package.json` — dependencies (mineflayer)

## Configure it
Open `config.json` and edit:

```json
{
  "host": "your.server.ip",
  "port": 25565,
  "username": "AFKBot",
  "auth": "offline"
}
```

- `auth`: `"offline"` works for cracked/offline-mode servers or servers where any
  username is accepted. Use `"microsoft"` only if the server requires a premium
  Microsoft account login (mineflayer will print a device-code link in the console
  the first time — you'd complete that login once, and it caches the token).
- `antiAfk`: toggle jump/walk/look-around and how often (in seconds) it acts.
- `chatMessages`: optional — periodically sends a message in chat (off by default).

You can also override the connection settings with environment variables instead
of editing the file — useful since Falix lets you set env vars in the panel:
`MC_HOST`, `MC_PORT`, `MC_USERNAME`, `MC_PASSWORD`, `MC_AUTH`.

## Running it on Falix Nodes

Falix Nodes supports generic Node.js/"Application" servers (the same panel type
used for Discord bots), which is what you'll use here:

1. **Create a new server/app** in the Falix panel and choose the **Node.js**
   (or "Generic App"/"Application") egg/type — not a Minecraft server type.
2. **Upload the files.** Use the panel's file manager to upload `index.js`,
   `package.json`, and `config.json` into the server's root directory (or connect
   via the panel's built-in SFTP and drag them in).
3. **Edit `config.json`** directly in the panel's file editor with your target
   server's IP, port, and the username you want the bot to log in as.
4. **Set the startup command** (in the Startup tab, if it's not automatic):
   ```
   npm install && node index.js
   ```
   Some panels split this into a separate "install"/"build" step and a "start"
   command — if so, put `npm install` in the install step and `node index.js`
   (or `npm start`) in the start command.
5. **Start the server/app.** Watch the console — you should see:
   ```
   Connecting to your.server.ip:25565 as "AFKBot"...
   Successfully logged in.
   Bot has spawned in the world.
   ```
6. Leave it running. If the Minecraft server restarts or the bot gets disconnected,
   it will automatically try to reconnect every `reconnectDelaySeconds` (default 10s).

## Notes & good practice
- Check the target server's rules before running an AFK bot on it — many servers
  explicitly forbid or restrict AFK farming/bots, and admins can ban accounts that
  violate that.
- Only run this against servers you own or have permission to use it on.
- If the server requires a real Microsoft account (premium/online-mode) and you
  set `"auth": "microsoft"`, the very first login will print a short code and a
  `https://microsoft.com/link` URL in the console — open that in a browser once
  to authorize; mineflayer caches the resulting token afterward so you won't have
  to repeat this on every restart (as long as your Falix storage persists between
  restarts).
- Node version: needs Node.js 16+. If Falix's Node.js egg lets you pick a version,
  choose 18 or 20 for best compatibility with mineflayer.
