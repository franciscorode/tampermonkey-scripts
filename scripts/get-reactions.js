// ==UserScript==
// @name         LinkedIn Reactions Scraper
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Scrape LinkedIn reactions modal users until a specific username, store & print JSON
// @author       You
// @match        https://www.linkedin.com/in/*/recent-activity/all/
// @match        https://www.linkedin.com/posts/*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
// ==/UserScript==

(function () {
    'use strict';

    let currentPostId = null;

    const VICTOR_TARGET_AUDIENCE_KEYWORDS = [
        "data engineer","dataops"," etl ","data engineering","bigdata",
        "big data","data analyst"," BI ","business intelligence",
        "data architect","data governance","data modeling","data management",
        " CDO ","Head of data","VP of data"," CTO ","Data manager","Director of Data",
        "databricks","snowflake","bigquery"," dbt ","spark","power bi","tableau",
        "data visualization","data pipeline","lakehouse","data lake","data warehouse", "Datawarehouse", "datalake",
        "ingeniero de datos", "engenheiro de dados", "data analysis", "Airflow", "Engenheira de Dados",
        "Data Quality", "data platform", "Ingeniería de Datos", "Data Steward", "Data Visualisation", "data analytics",
        "BI Engineer", "Arquitectura de Datos", "Data Eng", "Analytics Engineer", "Data Enthusiast", 
        "Data & Analytics", "Analytics Engineer"
    ].map(k => k.toLowerCase());

    const VICTOR_DOUBT_TARGET_AUDIENCE_KEYWORDS = [
        "engineer","software","architecture","data","cloud", "analyst","developer",
        "devops", " IT ", " TI ", " sql ","python",
        "consultant", "azure", " aws ", " gcp ", "google cloud", "analytics",
        "machine learning", "ml engineer", "analista", "Governance", "Data enthusiast", "Alteryx",
        "Data Specialist"
    ].map(k => k.toLowerCase());

    const FRAN_TARGET_AUDIENCE_KEYWORDS = [
        "ai engineer","genai","CTO","CDO","head of data", "head of ai", "Agentic AI", "AI Architect",
        "ai agent", "VP of data", "chief data officer", "chief technology officer", "director of data",
        "director of ai", "VP of ai", "AI product manager", "AI strateg", "generative AI", "AI software",
        "chief AI officer"
    ].map(k => k.toLowerCase());
    const FRAN_DOUBT_TARGET_AUDIENCE_KEYWORDS = [
        "full stack", "fullstack", "engineer", "software", "developer", " ai ", "founder", "co-founder",
    ].map(k => k.toLowerCase());


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
        let linkedinUser = GM_getValue("LINKEDIN_USER");
        if (!linkedinUser) {
            linkedinUser = prompt("Enter LINKEDIN_USER (victor | fran)", "victor");
            if (!linkedinUser) return;
            if (linkedinUser !== "victor" && linkedinUser !== "fran") return;
            GM_setValue("LINKEDIN_USER", linkedinUser);
        }

        let targetAudienceKeywords = [];
        let doubtTargetAudienceKeywords = [];

        if (linkedinUser === "victor") {
            targetAudienceKeywords = VICTOR_TARGET_AUDIENCE_KEYWORDS;
            doubtTargetAudienceKeywords = VICTOR_DOUBT_TARGET_AUDIENCE_KEYWORDS;
        } else if (linkedinUser === "fran") {
            targetAudienceKeywords = FRAN_TARGET_AUDIENCE_KEYWORDS;
            doubtTargetAudienceKeywords = FRAN_DOUBT_TARGET_AUDIENCE_KEYWORDS;
        } else {
            console.error("Unknown LINKEDIN_USER:", linkedinUser);
            return;
        }

        const isTarget = (user) =>
            targetAudienceKeywords.some(k => (user.description || "").toLowerCase().includes(k));
        const isDoubtTarget = (user) =>
            doubtTargetAudienceKeywords.some(k => (user.description || "").toLowerCase().includes(k));

        const targetUsers = users.filter(isTarget);
        const doubtTargetUsers = users.filter(u => !isTarget(u) && isDoubtTarget(u));
        const otherUsers  = users.filter(u => !isTarget(u) && !isDoubtTarget(u));

        const win = window.open("", "_blank");
        const doc = win.document;

        document.title = "Scraped Users";

        const body = doc.body;
        body.style.backgroundColor = "#fff"; // forces white background

        // ➕ Add Download Button at the top
        const downloadBtn = doc.createElement("button");
        downloadBtn.textContent = "⬇️ Download HTML";
        downloadBtn.style.padding = "6px 12px";
        downloadBtn.style.border = "1px solid #ccc";
        downloadBtn.style.borderRadius = "6px";
        downloadBtn.style.cursor = "pointer";
        downloadBtn.addEventListener("click", () => {
            const htmlContent = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
            const blob = new Blob([htmlContent], { type: "text/html" });
            const url = URL.createObjectURL(blob);

            const a = doc.createElement("a");
            a.href = url;
            a.download = `${currentPostId} - scraped_users.html`;
            doc.body.appendChild(a);
            a.click();
            doc.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        body.appendChild(downloadBtn);

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


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async function scrollToBottomUntilEnds() {
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
        const MAX_ATTEMPTS = 200;
    
        while (attempts < MAX_ATTEMPTS) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            scrollContainer.dispatchEvent(new Event('scroll', { bubbles: true }));
    
            // Random wait between 1s and 3s
            const waitTime = Math.floor(Math.random() * 2000) + 1000; 
            await sleep(waitTime);
    
            attempts++;
            console.log(`⬇️ Scrolled attempt #${attempts} (waited ${waitTime}ms)`);
    
            if (scrollContainer.scrollHeight === previousHeight) {
                console.log("📄 No more content to load.");
                break;
            }
            previousHeight = scrollContainer.scrollHeight;
        }
    }

    function getReactors() {
        const modalContent = document.querySelector('.artdeco-modal');
        const items = [...modalContent.querySelectorAll('.artdeco-list__item')];
        console.log(`User items: ${items.length}`);
    
        const connections = [];
        const noConnections = [];
    
        for (const item of items) {
            let nameElem = item.querySelector('span[dir]');
            if (!nameElem) {
                // company item
                nameElem = item.querySelector('.artdeco-entity-lockup__title');
            }
            const descElem = item.querySelector('.artdeco-entity-lockup__caption');
            const linkElem = item.querySelector('a[href*="/in/"]');
            const connectionDegreeEl = item.querySelector('.artdeco-entity-lockup__degree');
    
            const username = nameElem?.textContent.trim();
            if (!username) continue;
    
            const user = {
                username,
                description: descElem?.textContent.trim() || '',
                link: linkElem ? linkElem.href : ''
            };

            const isConnection = connectionDegreeEl.textContent.trim().includes('1er');
            if (isConnection) {
                connections.push(user);
            } else {
                noConnections.push(user);
            }
        }
        return {
            connections: connections,
            noConnections: noConnections
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

        await scrollToBottomUntilEnds();
        console.log("Done scroll");

        const allUsers = getReactors();
        const alreadyStored = getStoredUsernames(postId);

        let newNoConnectionUsers = allUsers.noConnections.filter(u => !alreadyStored.includes(u.username));
        let newConnectionUsers = allUsers.connections.filter(u => !alreadyStored.includes(u.username));

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