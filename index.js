const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const PLAYLIST_ID = "0pnPGNqeKlsfRxfABJIJgP";

// Track the state as a JavaScript object instead of a raw string
let oldState = null;

async function getToken() {
    // Corrected to use a standard URL-encoded body string for Axios compatibility
    const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        method: "post",
        headers: {
            "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
        },
        data: "grant_type=client_credentials"
    };

    const response = await axios(authOptions);
    return response.data.access_token;
}

async function sendTelegramMessage(message) {
    try {
        await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                chat_id: CHAT_ID,
                text: message
            }
        );
        console.log("Telegram message sent");
    } catch (err) {
        console.error("Telegram Error:", err.response?.data || err.message);
    }
}

async function checkPlaylist() {
    try {
        console.log("Checking playlist...");
        const token = await getToken();

        const response = await axios.get(
            `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // Gather only what you care about tracking
        const currentState = {
            snapshot: response.data.snapshot_id,
            name: response.data.name,
            description: response.data.description,
            tracks: response.data.tracks.total
        };

        // First run initialization
      if (!oldState) {
    oldState = currentState;
    return;
}

        // Build precise change logs
        let changes = [];

        if (oldState.name !== currentState.name) {
            changes.push(`📝 Name changed to: "${currentState.name}" (was "${oldState.name}")`);
        }
        if (oldState.description !== currentState.description) {
            changes.push(`ℹ️ Description updated.`);
        }
        if (oldState.tracks !== currentState.tracks) {
            changes.push(`🎵 Tracks count changed: ${oldState.tracks} ➡️ ${currentState.tracks}`);
        }
        // Catch-all for reordered songs or internal playlist updates
        if (oldState.snapshot !== currentState.snapshot && changes.length === 0) {
            changes.push(`🔄 Playlist tracks were reordered or modified.`);
        }

        // If changes happened, notify Telegram
        if (changes.length > 0) {
            console.log("Playlist updated:", changes);
            
            const msg = `🔥 PLAYLIST UPDATED!\n\n${changes.join("\n")}`;
            await sendTelegramMessage(msg);

            // Update oldState to the new current reality
            oldState = currentState;
        }

    } catch (err) {
        if (err.response?.status === 429) {
            console.warn("Spotify rate limited. Skipping this interval.");
            return;
        }
        console.error("Error:", err.response?.data || err.message);
    }
}

async function start() {
    try {
        await sendTelegramMessage("✅ Render bot started");
        await checkPlaylist();
        
        // Polling interval safely wrapped inside start
        setInterval(checkPlaylist, 60000);
    } catch (err) {
        console.error("Failed to start application:", err.message);
    }
}

start();