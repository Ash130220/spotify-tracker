const axios = require("axios");
const fs = require("fs");

require("dotenv").config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

console.log("CLIENT_ID =", CLIENT_ID);
console.log("CLIENT_SECRET =", CLIENT_SECRET);
// ONLY playlist ID
const PLAYLIST_ID = "0pnPGNqeKlsfRxfABJIJgP";

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
    await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
            chat_id: CHAT_ID,
            text: message
        }
    );
}

async function checkPlaylist() {
    try {
        const token = await getToken();

        const response = await axios.get(
            `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const newSnapshot = response.data.snapshot_id;

        let oldSnapshot = "";

        if (fs.existsSync("data.json")) {
            const data = JSON.parse(
                fs.readFileSync("data.json", "utf8")
            );

            oldSnapshot = data.snapshot || "";
        }

        // print ONLY if changed
        if (oldSnapshot && oldSnapshot !== newSnapshot) {
            await sendTelegramMessage("🔥 PLAYLIST UPDATED!");
        }

        // save snapshot
        fs.writeFileSync(
            "data.json",
            JSON.stringify(
                { snapshot: newSnapshot },
                null,
                2
            )
        );

    } catch (err) {
        console.log(err.response?.data || err.message);
    }
}

checkPlaylist();

sendTelegramMessage("TEST MESSAGE");

setInterval(checkPlaylist, 60000);