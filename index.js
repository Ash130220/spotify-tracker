const axios = require("axios");
require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

const PLAYLIST_ID = "0pnPGNqeKlsfRxfABJIJgP";

let previousState = null;

async function getSpotifyToken() {

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

                "Content-Type":
                    "application/x-www-form-urlencoded"
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
            "Telegram error:",
            err.response?.data || err.message
        );
    }
}

async function checkPlaylist() {

    try {

        console.log("Checking playlist...");

        const token = await getSpotifyToken();

        const response = await axios.get(
            `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}`,

            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const playlist = response.data;

        // COMPLETE PLAYLIST STATE
        const currentState = JSON.stringify({
            name: playlist.name,
            description: playlist.description,
            tracks: playlist.tracks.total,
            snapshot: playlist.snapshot_id
        });

        // FIRST RUN
        if (previousState === null) {

            previousState = currentState;

            console.log("Initial playlist saved");

            return;
        }

        // DETECT CHANGE
        if (previousState !== currentState) {

            console.log("PLAYLIST UPDATED");

            await sendTelegramMessage(
                "🔥 PLAYLIST UPDATED!"
            );

            previousState = currentState;
        }

    } catch (err) {

        if (err.response?.status === 429) {

            console.log(
                "Spotify rate limited"
            );

            return;
        }

        console.log(
            "Error:",
            err.response?.data || err.message
        );
    }
}

async function start() {

    // BOT ONLINE MESSAGE
    await sendTelegramMessage(
        "✅ Render bot started"
    );

    // FIRST CHECK
    await checkPlaylist();

    // CHECK EVERY 1 MINUTE
    setInterval(checkPlaylist, 60000);
}

start();