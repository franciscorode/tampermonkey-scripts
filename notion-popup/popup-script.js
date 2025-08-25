// Map of database options to Notion database IDs
const DATABASE_MAP = {
    "data":   "22e55f06ce9080d7a223cd3ae3ced0a1",
    "fran":   "eb77a7297f6a4c45abaf4421021e47fb",
    "victor": "eb77a7297f6a4c45abaf4421021e47fb"
};

// Read URL parameters
const params = new URLSearchParams(window.location.search);
const name = params.get("name") || "Unknown";
const profileUrl = params.get("url") || "#";

// Fill HTML elements
document.getElementById("name").innerText = name;
const urlEl = document.getElementById("url");
urlEl.href = profileUrl;
urlEl.innerText = profileUrl;

document.getElementById("createBtn").addEventListener("click", async () => {
    const statusEl = document.getElementById("status");
    const selectedDb = document.getElementById("database").value;
    const NOTION_PARENT_ID = DATABASE_MAP[selectedDb];

    // Ask for Notion API key
    let apiKey = localStorage.getItem("NOTION_API_KEY");
    if (!apiKey) {
        apiKey = prompt("Enter your NOTION_API_KEY:");
        if (!apiKey) return;
        localStorage.setItem("NOTION_API_KEY", apiKey);
    }

    // Ask for Notion user ID
    let userId = localStorage.getItem("NOTION_USER_ID");
    if (!userId) {
        userId = prompt("Enter your NOTION_USER_ID:");
        if (!userId) return;
        localStorage.setItem("NOTION_USER_ID", userId);
    }

    statusEl.innerText = "Creating page...";

    try {
        const resp = await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({
                parent: { database_id: NOTION_PARENT_ID },
                properties: {
                    "Name": { "title": [{ "text": { "content": name }}]},
                    "Linkedin url": { "url": profileUrl },
                    "Owner": { "people": [{ "id": userId }] }
                }
            })
        });

        const data = await resp.json();
        if (data.url) {
            statusEl.innerHTML = `✅ Page created! <a href="${data.url}" target="_blank">Open it</a>`;
        } else {
            statusEl.innerText = "❌ Failed to create page: " + JSON.stringify(data);
        }
    } catch (e) {
        statusEl.innerText = "🚨 Error sending request: " + e.message;
        console.error(e);
    }
});
