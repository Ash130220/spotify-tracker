const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// ONLY playlist ID
const PLAYLIST_ID = "0pnPGNqeKlsfRxfABJIJgP";

let oldState = null;

async function getToken() {
    const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
            grant_type: "client_credentials"
        }),
        {
            headers: {
                Authorization:
                    "Basic " +
                    Buffer.from(
                        CLIENT_ID + ":" + CLIENT_SECRET
                    ).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

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

        console.log(
            "Telegram Error:",
            err.response?.data || err.message
        );
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

       const currentState = JSON.stringify({
    snapshot: response.data.snapshot_id,
    name: response.data.name,
    description: response.data.description,
    tracks: response.data.tracks.total
});

        // first run
        if (!oldState) {
            oldState = currentState;
            return;
        }

        // detect ANY change
   const changed = oldState !== currentState;
        if (changed) {

            console.log("Playlist updated");

            await sendTelegramMessage(
                "🔥 PLAYLIST UPDATED!"
            );

            oldState = currentState;
        }

    } catch (err) {

        if (err.response?.status === 429) {
            console.log("Spotify rate limited");
            return;
        }

        console.log(
            "Error:",
            err.response?.data || err.message
        );
    }
}

async function start() {

    await sendTelegramMessage(
        "✅ Render bot started"
    );

    await checkPlaylist();

    // 1 minute
    setInterval(checkPlaylist, 60000);
}

start();