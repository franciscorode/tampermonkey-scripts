// ==UserScript==
// @name         LinkedIn Reactions Scraper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Scrape LinkedIn reactions modal users until a specific username, store & print JSON
// @author       You
// @match        https://www.linkedin.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
// ==/UserScript==

(function () {
    'use strict';

    let currentPostId = null;

    function setupReactionButtonListeners() {
        document.body.addEventListener('click', function (e) {
            const btn = e.target.closest('button[data-reaction-details]');
            if (btn) {
                const postDiv = btn.closest('.feed-shared-update-v2');
                if (postDiv) {
                    const urn = postDiv.getAttribute('data-urn');
                    if (urn) {
                        currentPostId = urn;
                        console.log("📄 Captured Post URN:", currentPostId);
                    }
                }
            }
        });
    }

    setupReactionButtonListeners();

    function getPostId() {
        if (!currentPostId) {
            console.error("⚠️ Post ID not captured yet. Please click the reactions button first.");
        }
        return currentPostId;
    }

    const TARGET_USERNAME = 'Francisco Rodeño Sanchez';

    async function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function openUserListMinimal(users) {
        const TARGET_AUDIENCE_KEYWORDS = [
            "data engineer","dataops","etl","data engineering","bigdata",
            "big data","analytics","data analyst","BI","business intelligence",
            "data architect","data governance","data modeling","data management",
            "CDO","Head of data","VP of data","CTO","Data manager","Director of Data",
            "databricks","snowflake","bigquery","dbt","spark","power bi","tableau",
            "data visualization","data pipeline","lakehouse","data lake","data warehouse",
            "ingeniero de datos","analista", "engenheiro de dados"
        ].map(k => k.toLowerCase());
    
        const isTarget = (user) => 
            TARGET_AUDIENCE_KEYWORDS.some(k => (user.description || "").toLowerCase().includes(k));
    
        const targetUsers = users.filter(isTarget);
        const otherUsers  = users.filter(u => !isTarget(u));
    
        const win = window.open("", "_blank");
    
        win.document.title = "Scraped Users";
    
        const body = win.document.body;
        const hTarget = win.document.createElement("h3");
        hTarget.textContent = "🎯 Target Audience To Follow";
        body.appendChild(hTarget);
    
        const ulTarget = win.document.createElement("ul");
        ulTarget.style.listStyle = "none";
        ulTarget.style.padding = "0";
        targetUsers.forEach(u => {
            const li = win.document.createElement("li");
            li.innerHTML = `<a href="${u.link}" target="_blank">${u.username}</a><br><small>${u.description}</small>`;
            ulTarget.appendChild(li);
        });
        body.appendChild(ulTarget);
    
        const hOther = win.document.createElement("h3");
        hOther.textContent = "👥 Other Users";
        body.appendChild(hOther);
    
        const ulOther = win.document.createElement("ul");
        ulOther.style.listStyle = "none";
        ulOther.style.padding = "0";
        otherUsers.forEach(u => {
            const li = win.document.createElement("li");
            li.innerHTML = `<a href="${u.link}" target="_blank">${u.username}</a><br><small>${u.description}</small>`;
            ulOther.appendChild(li);
        });
        body.appendChild(ulOther);
    }
    


    async function scrollToBottomUntilTarget() {
        const scrollContainer = document.querySelector(
            '.artdeco-modal__content ,social-details-reactors-modal__content'
        );
        if (!scrollContainer) {
            console.error("❌ Scrollable container not found.");
            return;
        }

        console.log("✅ Found scroll container:", scrollContainer);

        let previousHeight = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = 50;

        while (attempts < MAX_ATTEMPTS) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
            await sleep(1500);
            attempts++;
            console.log(`⬇️ Scrolled attempt #${attempts}`);

            const users = [...scrollContainer.querySelectorAll('.reactions-reactor-list-item')];
            const names = users.map(u => u.querySelector('span[dir]')?.textContent.trim());

            if (scrollContainer.scrollHeight === previousHeight) {
                console.log("📄 No more content to load.");
                break;
            }
            previousHeight = scrollContainer.scrollHeight;
        }
    }


    function getUsersUntilTarget(targetUsername) {
        const modalContent = document.querySelector('.artdeco-modal');
        const items = [...modalContent.querySelectorAll('.artdeco-list__item')];
        items.reverse(); // get last first (no connections)
        console.log(`User items: ${items.length}`);

        const results = [];
        for (const item of items) {
            const nameElem = item.querySelector('span[dir]');
            const descElem = item.querySelector('.artdeco-entity-lockup__caption');
            const linkElem = item.querySelector('a[href*="/in/"]');

            const username = nameElem?.textContent.trim();
            if (!username) continue;

            if (username === targetUsername) break;

            results.push({
                username,
                description: descElem?.textContent.trim() || '',
                link: linkElem ? linkElem.href : ''
            });
        }
        return results
    }

    function getStoredUsernames(postId) {
        const key = `scraped_users_${postId}`;
        const stored = GM_getValue(key, null);
        const users = stored ? JSON.parse(stored) : [];
        console.log(`User stored: ${users.length}`);
        return users
    }

    function storeUsernames(postId, usernames) {
        const key = `scraped_users_${postId}`;
        GM_setValue(key, JSON.stringify(usernames));
    }


    async function run() {
        const postId = getPostId();
        if (!postId) {
            console.error("Post ID not found.");
            return;
        }

        console.log(`Post ID: ${postId}`);

        await scrollToBottomUntilTarget();
        console.log("Done scroll");

        const allUsers = getUsersUntilTarget(TARGET_USERNAME);
        const alreadyStored = getStoredUsernames(postId);

        let newUsers = allUsers.filter(u => !alreadyStored.includes(u.username));

        // Exclude last 3 users before targetUsername if new users is › 5 (very recent reactors)
        if (newUsers.length > 5) {
            console.log(`Excluding last 3 users before target.`);
            newUsers = newUsers.slice(0, newUsers.length - 3);
        }
        // TODO analyze if new users › 50 then ignore 20?

        if (newUsers.length === 0) {
            console.log("No new users found.");
        } else {
            console.log("New users found:", newUsers);
            const updatedUsernames = [...alreadyStored, ...newUsers.map(u => u.username)];
            storeUsernames(postId, updatedUsernames);
        }

        openUserListMinimal(newUsers)
    }

    console.log("✅ Tampermonkey LinkedIn Reactions Scraper loaded");
    // Add a keyboard shortcut: Ctrl+Shift+N
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
            console.log("Triguering scrapeLinkedInReactions()");
            run()
        }
    });
})();