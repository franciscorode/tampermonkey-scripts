// ==UserScript==
// @name         LinkedIn Reactions Scraper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Scrape LinkedIn reactions modal users until a specific username, store & print JSON
// @author       You
// @match        https://www.linkedin.com/in/*/recent-activity/all/
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
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

    function countPostReactions() {
        const buttons = document.querySelectorAll('button[data-reaction-details]');
        buttons.forEach(btn => {
            const postDiv = btn.closest('.feed-shared-update-v2');
            if (!postDiv) return;
            const urn = postDiv.getAttribute('data-urn');
            if (!urn) return;
            console.log("urn: ", urn)

            // retrieve stored usernames array
            const key = `scraped_users_${urn}`;
            const stored = GM_getValue(key, null);
            let users = [];
            try {
                users = stored ? JSON.parse(stored) : [];
            } catch(err) {
                console.warn(`Could not parse GM data for ${key}:`, err);
            }
            const count = users.length;
            console.log("count: ", count)

            // see if we already added a badge
            let badge = btn.querySelector('.reaction-count-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'reaction-count-badge';
                badge.style.marginLeft = '6px';
                badge.style.padding = '2px 6px';
                badge.style.background = '#0073b1';
                badge.style.color = '#fff';
                badge.style.borderRadius = '12px';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = '500';
                btn.appendChild(badge);
            }
            badge.textContent = count;

            let realReactionsElement = postDiv.querySelector('.social-details-social-counts__social-proof-fallback-number');
            if (!realReactionsElement) {
                // counts come in different element when comes without (n & x reacted..)
                realReactionsElement = postDiv.querySelector('.social-details-social-counts__reactions-count');
            };
            const realReactionsNumber = parseInt(realReactionsElement.textContent);
            let icon = btn.querySelector('.update-icon');
            if (!icon && count < realReactionsNumber) {
                icon = document.createElement('span');
                icon.className = 'update-icon';
                icon.textContent = '🔄';
                icon.style.marginLeft = '4px';
                btn.appendChild(icon);
            }
        });
    }

    function openUserListMinimal(users) {
        const TARGET_AUDIENCE_KEYWORDS = [
            "data engineer","dataops"," etl ","data engineering","bigdata",
            "big data","data analyst"," BI ","business intelligence",
            "data architect","data governance","data modeling","data management",
            " CDO ","Head of data","VP of data"," CTO ","Data manager","Director of Data",
            "databricks","snowflake","bigquery"," dbt ","spark","power bi","tableau",
            "data visualization","data pipeline","lakehouse","data lake","data warehouse", "Datawarehouse", "datalake",
            "ingeniero de datos", "engenheiro de dados", "data analysis", "Airflow", "Engenheira de Dados",
            "Data Quality", "data platform", "Ingeniería de Datos", "Data Steward", "Data Visualisation", "data analytics",
            "BI Engineer"

        ].map(k => k.toLowerCase());

        const DOUBT_TARGET_AUDIENCE_KEYWORDS = [
            "engineer","software","architecture","data","cloud", "analyst","developer",
            "devops", " IT ", " TI ", " sql ","python",
            "consultant", "azure", " aws ", " gcp ", "google cloud", "analytics",
            "machine learning", "ml engineer", "analista", "Governance", "Data enthusiast"
        ].map(k => k.toLowerCase());

        const isTarget = (user) =>
            TARGET_AUDIENCE_KEYWORDS.some(k => (user.description || "").toLowerCase().includes(k));
        const isDoubtTarget = (user) =>
            DOUBT_TARGET_AUDIENCE_KEYWORDS.some(k => (user.description || "").toLowerCase().includes(k));

        const targetUsers = users.filter(isTarget);
        const doubtTargetUsers = users.filter(u => !isTarget(u) && isDoubtTarget(u));
        const otherUsers  = users.filter(u => !isTarget(u) && !isDoubtTarget(u));

        const win = window.open("", "_blank");
        const doc = win.document;

        document.title = "Scraped Users";

        const body = doc.body;
        body.style.backgroundColor = "#fff"; // forces white background
        const hTarget = doc.createElement("h3");
        hTarget.textContent = "🎯 Target Audience To Follow";
        body.appendChild(hTarget);

        const ulTarget = doc.createElement("ul");
        ulTarget.style.listStyle = "none";
        ulTarget.style.padding = "0";
        targetUsers.forEach(u => {
            const li = doc.createElement("li");

            const a = doc.createElement("a");
            a.href = u.link;
            a.target = "_blank";
            a.textContent = u.username;

            const br = doc.createElement("br");
            const small = doc.createElement("small");
            small.textContent = u.description;

            li.appendChild(a);
            li.appendChild(br);
            li.appendChild(small);

            ulTarget.appendChild(li);
        });
        body.appendChild(ulTarget);


        const hDoubt = doc.createElement("h3");
        hDoubt.textContent = "❓ Doubt Users";
        body.appendChild(hDoubt);

        const ulDoubt = doc.createElement("ul");
        ulDoubt.style.listStyle = "none";
        ulDoubt.style.padding = "0";
        doubtTargetUsers.forEach(u => {
            const li = doc.createElement("li");

            const a = doc.createElement("a");
            a.href = u.link;
            a.target = "_blank";
            a.textContent = u.username;

            const br = doc.createElement("br");
            const small = doc.createElement("small");
            small.textContent = u.description;

            li.appendChild(a);
            li.appendChild(br);
            li.appendChild(small);

            ulDoubt.appendChild(li);
        });
        body.appendChild(ulDoubt);


        const hOther = doc.createElement("h3");
        hOther.textContent = "👥 Other Users";
        body.appendChild(hOther);

        const ulOther = doc.createElement("ul");
        ulOther.style.listStyle = "none";
        ulOther.style.padding = "0";
        otherUsers.forEach(u => {
            const li = doc.createElement("li");

            const a = doc.createElement("a");
            a.href = u.link;
            a.target = "_blank";
            a.textContent = u.username;

            const br = doc.createElement("br");
            const small = doc.createElement("small");
            small.textContent = u.description;

            li.appendChild(a);
            li.appendChild(br);
            li.appendChild(small);

            ulOther.appendChild(li);
        });
        body.appendChild(ulOther);

        // 📋 Add raw JSON at the end
        const pre = doc.createElement("pre");
        pre.textContent = JSON.stringify(otherUsers);
        body.appendChild(pre);
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


    function getUsersAroundTarget(targetUsername) {
        const modalContent = document.querySelector('.artdeco-modal');
        const items = [...modalContent.querySelectorAll('.artdeco-list__item')];
        console.log(`User items: ${items.length}`);

        const beforeTarget = [];
        const afterTarget = [];
        let foundTarget = false;

        for (const item of items) {
            let nameElem = item.querySelector('span[dir]');
            if (!nameElem) {
                // company item
                nameElem = item.querySelector('.artdeco-entity-lockup__title');
            }
            const descElem = item.querySelector('.artdeco-entity-lockup__caption');
            const linkElem = item.querySelector('a[href*="/in/"]');

            const username = nameElem?.textContent.trim();

            if (!username) continue;

            const user = {
                username,
                description: descElem?.textContent.trim() || '',
                link: linkElem ? linkElem.href : ''
            };

            if (!foundTarget) {
                beforeTarget.push(user);
            } else {
                afterTarget.push(user);
            }

            if (username === targetUsername) {
                foundTarget = true;
            }
        }

        return {
            before: beforeTarget,
            after: afterTarget
        };
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

        const allUsers = getUsersAroundTarget(TARGET_USERNAME);
        const alreadyStored = getStoredUsernames(postId);

        const noConnectionUsers = allUsers.after
        const connectionUsers = allUsers.before

        let newNoConnectionUsers = noConnectionUsers.filter(u => !alreadyStored.includes(u.username));
        let newConnectionUsers = connectionUsers.filter(u => !alreadyStored.includes(u.username));

        console.log("New no connected users that reacted: ", newNoConnectionUsers.length)
        console.log("New already connected users that reacted: ", newConnectionUsers.length)

        // Exclude last 3 users before targetUsername if new users is › 5 (very recent reactors)
        if (newNoConnectionUsers.length > 5) {
            console.log(`Excluding last 3 users before target.`);
            newNoConnectionUsers = newNoConnectionUsers.slice(0, newNoConnectionUsers.length - 3);
        }
        // TODO analyze if new users › 50 then ignore 20?

        if (newNoConnectionUsers.length === 0 && newConnectionUsers.length === 0) {
            console.log("No new users found.");
        } else {
            console.log("New users found:", newNoConnectionUsers.length + newConnectionUsers.length);
            const updatedUsernames = [...alreadyStored, ...newNoConnectionUsers.map(u => u.username), ...newConnectionUsers.map(u => u.username)];
            storeUsernames(postId, updatedUsernames);
        }

        openUserListMinimal(newNoConnectionUsers)
    }

    console.log("✅ LinkedIn reactions tracker loaded");
    // Add a keyboard shortcut: Ctrl+Shift+N
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'n') {
            console.log("Triguering scrapeLinkedInReactions()");
            run()
        }
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
            console.log("Triguering countPostReactions()");
            countPostReactions()
        }
    });
})();