// ==UserScript==
// @name         Notion curl generator
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Generate button to copy curl command (profiles) or prompt (companies)
// @match        https://www.linkedin.com/in/*
// @match        https://www.linkedin.com/company/*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/curl-notion-button.js
// @downloadURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/curl-notion-button.js
// ==/UserScript==

(function() {
    'use strict';

    const DATABASE_MAP = {
        "data":   "22e55f06ce9080d7a223cd3ae3ced0a1",
        "fran":   "eb77a7297f6a4c45abaf4421021e47fb",
        "victor": "eb77a7297f6a4c45abaf4421021e47fb"
    };

    const DATABASE_OPTIONS = Object.keys(DATABASE_MAP);

    const companyPrompt = `
**Quick company filter for LinkedIn networking**

Goal: Find USA/Canada/Australia & Europe & Singapore & Latin America scale-ups (50-5000 employees) with real data problems and budget authority I can connect with.

Company: [company_name]
LinkedIn: [company_url]

1. 50-5000 employees? YES/NO
2. Tech/product company? YES/NO (not agency/consultancy)
3. USA/Canada/Australia & Europe & Singapore & Latin America based? YES/NO
4. Has data infrastructure needs? YES/NO (SaaS, fintech, e-commerce, marketplace = yes)
5. Fast-moving culture? YES/NO (startup/scale-up, not enterprise)

**Decision:**
- 5 YES → TARGET
- 4 YES → INVESTIGATE (check their data team, posts, job openings)
- ≤3 YES → SKIP


Return:
1. Decision
2. Description with next format: [company_name] ([industry] [scaleup | tech company | etc] based on [location]
    `;

    function getButtonsContainer() {
        const container = document.querySelectorAll('[data-view-name="profile-primary-message"]')[1]?.parentElement
            || document.querySelectorAll('[aria-label="More actions"]')[1]?.parentElement?.parentElement
            || document.querySelectorAll('[data-view-name="profile-overflow-button"]')[1]
            || document.querySelectorAll('.pv-recent-activity-top-card__profile-actions')[0]
            || document.querySelector('.org-top-card-actions')
            || document.querySelector('.org-top-card-primary-actions')

        if (!container) {
            console.error("❌ Container not found for buttons.");
            alert("❌ Error: Container not found for buttons.");
            throw new Error("Container not found for buttons");
        }
        return container;
    }

    function addButton() {
        const container = getButtonsContainer();
        // Check if button already added
        if (container.parentElement.querySelector('.curl-notion-btn')) return;

        // Create new button
        const newBtn = document.createElement("button");
        newBtn.innerText = "Copy Notion curl to create page 🚀";
        newBtn.className = "curl-notion-btn";
        newBtn.style.margin = "8px";
        newBtn.style.padding = "4px 8px";
        newBtn.style.border = "1px solid #0a66c2";
        newBtn.style.borderRadius = "12px";
        newBtn.style.background = "white";
        newBtn.style.color = "#0a66c2";
        newBtn.style.cursor = "pointer";
        newBtn.style.fontWeight = "bold";

        newBtn.addEventListener("click", () => generateCurl());

        container.parentElement.appendChild(newBtn);
    }

    function addCompanyButton() {
        const container = getButtonsContainer();
        // Check if button already added
        if (container.querySelector('.company-prompt-btn')) return;

        // Get company name
        const companyNameEl = document.querySelector('.org-top-card-summary__title')
            || document.querySelector('h1.top-card-layout__title')
            || document.querySelector('.org-top-card__primary-content h1');

        if (!companyNameEl) {
            alert("❌ Error: Company name not found on page.");
            return;
        }

        const companyName = companyNameEl.textContent.trim();

        // Create new button
        const newBtn = document.createElement("button");
        newBtn.innerText = "Copy company prompt 🏢";
        newBtn.title = companyName;
        newBtn.className = "company-prompt-btn";
        newBtn.style.margin = "8px";
        newBtn.style.padding = "4px 8px";
        newBtn.style.border = "1px solid #0a66c2";
        newBtn.style.borderRadius = "12px";
        newBtn.style.background = "white";
        newBtn.style.color = "#0a66c2";
        newBtn.style.cursor = "pointer";
        newBtn.style.fontWeight = "bold";

        newBtn.addEventListener("click", () => generateCompanyPrompt(companyName));

        container.appendChild(newBtn);
    }

    function generateCompanyPrompt(companyName) {
        const finalPrompt = companyPrompt
            .replace("[company_name]", companyName)
            .replace("[company_url]", window.location.href);

        navigator.clipboard.writeText(finalPrompt.trim()).then(() => {
            alert("✅ Company prompt copied!");
        }).catch(err => {
            console.error("Failed to copy to clipboard", err);
            alert("❌ Failed to copy to clipboard. See console for details.");
        });
    }

    function generateCurl() {
        let apiKey = GM_getValue("NOTION_API_KEY");
        if (!apiKey) {
            apiKey = prompt("Enter your NOTION_API_KEY:");
            if (!apiKey) return;
            GM_setValue("NOTION_API_KEY", apiKey);
        }

        let userId = GM_getValue("NOTION_USER_ID");
        if (!userId) {
            userId = prompt("Enter your NOTION_USER_ID:");
            if (!userId) return;
            GM_setValue("NOTION_USER_ID", userId);
        }

        let db = prompt(`Enter database (${DATABASE_OPTIONS.join(", ")})`, "data");
        if (!DATABASE_OPTIONS.includes(db)) db = "data";
        const NOTION_PARENT_ID = DATABASE_MAP[db];

        const path = window.location.pathname; // e.g. "/in/alfonsoalcantara/recent-activity/all/"
        let name = "Unknown";
        let profileUrl = "Unknown"

        const match = path.match(/\/in\/([^\/]+)/);
        if (match && match[1]) {
            name = decodeURIComponent(match[1]);
            profileUrl = window.location.origin + "/in/" + match[1];
        }

        const curl = `
curl -X POST https://api.notion.com/v1/pages \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Notion-Version: 2022-06-28" \\
  -H "Content-Type: application/json" \\
  -d '{
    "parent": { "database_id": "${NOTION_PARENT_ID}" },
    "properties": {
        "Name": { "title": [{ "text": { "content": "${name}" }}] },
        "Linkedin url": { "url": "${profileUrl}" },
        "Owner": { "people": [{ "id": "${userId}" }] }
    }
  }' | jq -r '.url' | xargs open
`.trim();

        navigator.clipboard.writeText(curl.trim()).then(() => {
            alert("✅ Command copied!");
        }).catch(err => {
            console.error("Failed to copy to clipboard", err);
            alert("❌ Failed to copy to clipboard. See console for details.");
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
            console.log("Triggering add button to copy curls to create notion page");
            addButton();
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
            console.log("Triggering add button to copy company prompt");
            addCompanyButton();
        }
    });

    console.log("✅ Button to copy curls/prompts loaded (profiles and companies)");

})();