const axios = require("axios");
const fs = require("fs");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// ONLY playlist ID
const PLAYLIST_ID = "3RagErmb9JKqOCuizMm0in";

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
            console.log("🔥 PLAYLIST UPDATED!");
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

setInterval(checkPlaylist, 5000);