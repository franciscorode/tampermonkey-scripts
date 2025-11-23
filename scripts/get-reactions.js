// ==UserScript==
// @name         LinkedIn Reactions Scraper
// @namespace    http://tampermonkey.net/
// @version      1.0.9
// @description  Scrape LinkedIn reactions modal users until a specific username, store & print JSON
// @author       You
// @match        https://www.linkedin.com/in/*/recent-activity/*
// @match        https://www.linkedin.com/in/*
// @match        https://www.linkedin.com/posts/*
// @match        https://www.linkedin.com/feed/update/*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/get-reactions.js
// ==/UserScript==

(function () {
    'use strict';

    let currentPostId = null;
    let currentCommentId = null;

    const VICTOR_TARGET_AUDIENCE_KEYWORDS = [
        "data engineer","data engineering","bigdata","data architect", " CDO ", "Head of data","VP of data",
        "Data manager","Director of Data","Data Leader", "Chief data officer", " CIO ", "data engineering manager",
        "data lead","VP data", "Head of analytics", "Chief analytics officer", "VP analytics", "Director of analytics"
    ].map(k => k.toLowerCase());

    const VICTOR_DOUBT_TARGET_AUDIENCE_KEYWORDS = [
        ,"dataops"," etl ", "big data","data analyst"," BI ","business intelligence",
        ,"data governance","data modeling","data management",
        ," CTO ", "databricks","snowflake","bigquery"," dbt ","spark","power bi","tableau",
        "data visualization","data pipeline","lakehouse","data lake","data warehouse", "Datawarehouse", "datalake",
        "ingeniero de datos", "engenheiro de dados", "data analysis", "Airflow", "Engenheira de Dados",
        "Data Quality", "data platform", "Ingeniería de Datos", "Data Steward", "Data Visualisation", "data analytics",
        "BI Engineer", "Arquitectura de Datos", "Data Eng", "Analytics Engineer", "Data Enthusiast", 
        "Data & Analytics", "Analytics Engineer", "Data Specialist", "Ingeniera de Datos",
        "data", "analyst","ETL developer", "analytics", "Governance", "Data enthusiast", "Alteryx",
        "Data Strategy", "data consultant", "VP of engineering", "redshift", "streaming", "kafka"
    ].map(k => k.toLowerCase());

    const FRAN_TARGET_AUDIENCE_KEYWORDS = [
        "ai engineer","genai","CTO","CDO","head of data", "head of ai", "Agentic AI", "AI Architect",
        "ai agent", "VP of data", "chief data officer", "chief technology officer", "director of data",
        "director of ai", "VP of ai", "AI product manager", "AI strategy", "generative AI", "AI software",
        "chief AI officer", "VP of engineering", "VP engineering", "Head of engineering", "Director of engineering",
        "AI lead", "AI team lead", "Head of machine learning", "Head of ML", "VP of machine learning", "VP ML",
        "Director of machine learning", "Director ML", "Machine learning architect", "ML architect",
        "LLM engineer", " LLM ", "AI/ML", "Artificial intelligence", "Gen AI", "AI engineering manager",
        "Engineering manager"
    ].map(k => k.toLowerCase());
    const FRAN_DOUBT_TARGET_AUDIENCE_KEYWORDS = [
        "full stack", "fullstack", "engineer", "software", "developer", " ai ", "founder", "co-founder",
        "backend engineer", "backend developer", "frontend engineer", "frontend developer",
        "python developer", "python engineer", "machine learning engineer", "ML engineer",
        "data scientist", "data science", "technical lead", "tech lead", "engineering lead",
        "software architect", "solutions architect", "cloud engineer", "startup", "entrepreneur",
        "product manager", "technical manager", "llm"
    ].map(k => k.toLowerCase());

    const COMMON_BLACKLIST_KEYWORDS = [
        "marketing", "sales", "recruiter", "recruitment", "talent acquisition", " HR ", "human resources",
        "finance", "accounting", "legal", "designer", "design", " UX ", " UI ", "content", "copywriter",
        "social media", " SEO ", "customer success", "support", " QA ", "quality assurance", "tester",
        "intern", "internship", "freelance", "project manager", "scrum master", "agile coach", "devops",
        "cyber", "student", "industrial", "administrative", "admin", "office manager", "operations",
        "logistics", "supply chain", "procurement", "purchasing", "real estate",
        "manufacturing", "retail", "hospitality", "healthcare", "education", "teacher", "professor",
        "journalist", "writer", "photographer", "videographer", "editor", "assistant", "coordinator",
        "mobile developer", "mobile engineer", "iOS developer", "Android developer", "game developer",
        "game engineer", "embedded systems", "embedded engineer", "hardware engineer", "network engineer",
        "network administrator", "system administrator", "sysadmin", "wordpress", "webmaster",
        "frontend", "frontend developer","database administrator", " DBA ", "SAP", "Oracle", "mainframe", "MBA",
        "SAS", "MSc", "PhD", "doctorate", "Site Reliability", "SRE", "technical support", "IT support",
        "Master", "Aerospace"
    ].map(k => k.toLowerCase());

    const VICTOR_BLACKLIST_KEYWORDS = [
        ...COMMON_BLACKLIST_KEYWORDS,
        "backend", "JavaScript", "react", "nodejs", "node.js", "fullstack", "full stack", "software engineer",
    ].map(k => k.toLowerCase());

    const FRAN_BLACKLIST_KEYWORDS = [
        ...COMMON_BLACKLIST_KEYWORDS,
        "analyst", "business intelligence"
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
            const btnComment = e.target.closest('button.comments-comment-social-bar__reactions-count--cr');
            if (btnComment) {
                const commentDiv = btnComment.closest('.comments-comment-entity');
                if (commentDiv) {
                    const urn = commentDiv.getAttribute('data-id');
                    if (urn) {
                        currentCommentId = urn;
                        console.log("📄 Captured Comment URN:", currentCommentId);
                    }
                }
            }
        });
        
             }

    setupReactionButtonListeners();

    // ======= TIER3 ENGAGER TRACKING =======
    function normalizeUsername(username) {
        // Remove trailing slashes and query params
        return username ? username.replace(/\/$/, '').split('?')[0] : null;
    }

    function getUsernameFromUrl() {
        const path = window.location.pathname;
        const match = path.match(/\/in\/([^\/\?]+)/);
        return match ? normalizeUsername(decodeURIComponent(match[1])) : null;
    }

    function getTier3Engagers() {
        const stored = GM_getValue("tier3_engagers", null);
        return stored ? JSON.parse(stored) : {};
    }

    function getTier3Discarded() {
        const stored = GM_getValue("tier3_discarded", null);
        return stored ? JSON.parse(stored) : {};
    }

    function saveTier3Engagers(engagers) {
        GM_setValue("tier3_engagers", JSON.stringify(engagers));
    }

    function saveTier3Discarded(discarded) {
        GM_setValue("tier3_discarded", JSON.stringify(discarded));
    }

    function addTier3EngagerButton() {
        const container = document.querySelectorAll('[aria-label="More actions"]')[1].parentElement.parentElement || document.querySelectorAll('[data-view-name="profile-overflow-button"]')[1];

        if (!container) {
            console.error("❌ Container not found for tier3 buttons.");
            return;
        }
        console.log("✅ Found container for tier3 buttons:", container);

        // Check if button already added
        if (container.parentElement.querySelector('.tier3-engager-btn')) return;

        const username = getUsernameFromUrl();
        if (!username) {
            console.error("❌ Could not extract username from URL.");
            return;
        }

        // Get display name from the page
        const displayNameElement = document.querySelector('h1');
        if (!displayNameElement) {
            console.error("❌ Could not find display name element on the page.");
            alert("❌ Error: Could not find profile name on the page. Make sure you're on a LinkedIn profile page.");
            return;
        }
        // Remove additional name in parentheses (e.g., "Sidney (Sid) M." -> "Sidney M.")
        const displayName = displayNameElement.textContent.trim().replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

        // Create "Track as tier3 engager" button
        const trackBtn = document.createElement("button");
        trackBtn.innerText = "🎯 Track as tier3 engager";
        trackBtn.className = "tier3-engager-btn";
        trackBtn.style.margin = "8px";
        trackBtn.style.padding = "4px 8px";
        trackBtn.style.border = "1px solid #0a66c2";
        trackBtn.style.borderRadius = "12px";
        trackBtn.style.background = "white";
        trackBtn.style.color = "#0a66c2";
        trackBtn.style.cursor = "pointer";
        trackBtn.style.fontWeight = "bold";

        trackBtn.addEventListener("click", () => {
            const engagers = getTier3Engagers();
            if (!engagers[displayName]) {
                engagers[displayName] = { count: 0, username: username };
            }
            engagers[displayName].count += 1;
            saveTier3Engagers(engagers);
            alert(`✅ Tracked ${displayName} as tier3 engager (${engagers[displayName].count} times)`);
        });

        container.parentElement.appendChild(trackBtn);
    }

    function addTier3DiscardButton() {
        const container = document.querySelectorAll('[aria-label="More actions"]')[1].parentElement.parentElement || document.querySelectorAll('[data-view-name="profile-overflow-button"]')[1];

        if (!container) {
            console.error("❌ Container not found for tier3 buttons.");
            return;
        }
        console.log("✅ Found container for tier3 buttons:", container);

        // Check if button already added
        if (container.parentElement.querySelector('.tier3-discard-btn')) return;

        const username = getUsernameFromUrl();
        if (!username) {
            console.error("❌ Could not extract username from URL.");
            return;
        }

        // Get display name from the page
        const displayNameElement = document.querySelector('h1');
        if (!displayNameElement) {
            console.error("❌ Could not find display name element on the page.");
            alert("❌ Error: Could not find profile name on the page. Make sure you're on a LinkedIn profile page.");
            return;
        }
        // Remove additional name in parentheses (e.g., "Sidney (Sid) M." -> "Sidney M.")
        const displayName = displayNameElement.textContent.trim().replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

        // Create "Discard as tier3" button
        const discardBtn = document.createElement("button");
        discardBtn.innerText = "❌ Discard as tier3";
        discardBtn.className = "tier3-discard-btn";
        discardBtn.style.margin = "8px";
        discardBtn.style.padding = "4px 8px";
        discardBtn.style.border = "1px solid #d32f2f";
        discardBtn.style.borderRadius = "12px";
        discardBtn.style.background = "white";
        discardBtn.style.color = "#d32f2f";
        discardBtn.style.cursor = "pointer";
        discardBtn.style.fontWeight = "bold";

        discardBtn.addEventListener("click", () => {
            const discarded = getTier3Discarded();
            if (!discarded[displayName]) {
                discarded[displayName] = username;
                saveTier3Discarded(discarded);
                alert(`✅ Discarded ${displayName} as tier3`);
            } else {
                alert(`ℹ️ ${displayName} is already discarded`);
            }
        });

        container.parentElement.appendChild(discardBtn);
    }

    // Listen for 'e' and 'd' keys on profile pages
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'e' && window.location.pathname.includes('/in/')) {
            console.log("Triggering add tier3 engager button");
            addTier3EngagerButton();
        }
        if (e.key.toLowerCase() === 'd' && window.location.pathname.includes('/in/')) {
            console.log("Triggering add tier3 discard button");
            addTier3DiscardButton();
        }
    });
    // ======= END TIER3 ENGAGER TRACKING =======

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

    function countCommentReactions() {
        const buttons = document.querySelectorAll('button.comments-comment-social-bar__reactions-count--cr');
        buttons.forEach(btn => {
            const commentDiv = btn.closest('.comments-comment-entity');
            if (!commentDiv) return;
            const urn = commentDiv.getAttribute('data-id');
            if (!urn) return;
            console.log("comment urn: ", urn)

            // retrieve stored usernames array
            const key = `comment_scraped_users_${urn}`;
            const stored = GM_getValue(key, null);
            let users = [];
            try {
                users = stored ? JSON.parse(stored) : [];
            } catch(err) {
                console.warn(`Could not parse GM data for ${key}:`, err);
            }
            const count = users.length;
            console.log("comment count: ", count)

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

            // Extract real reaction count from button text
            const buttonText = btn.textContent.trim();
            const realReactionsNumber = parseInt(buttonText) || 0;
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

    function countReactions() {
        countPostReactions();
        countCommentReactions();
    }

    function createUserListItem(doc, user, tier3Engagers) {
        const li = doc.createElement("li");
        li.style.marginBottom = "8px";

        const a = doc.createElement("a");
        a.href = user.link;
        a.target = "_blank";
        a.textContent = user.username;

        // Check if user is tracked engager
        const isTrackedEngager = tier3Engagers[user.username];

        if (isTrackedEngager) {
            // Add tracked engager button (disabled)
            const trackedBtn = doc.createElement("button");
            trackedBtn.textContent = `📊 Tracked engager: ${tier3Engagers[user.username].count} pings`;
            trackedBtn.style.marginLeft = "8px";
            trackedBtn.style.padding = "2px 8px";
            trackedBtn.style.border = "1px solid #0a66c2";
            trackedBtn.style.borderRadius = "4px";
            trackedBtn.style.background = "#e3f2fd";
            trackedBtn.style.color = "#0a66c2";
            trackedBtn.style.cursor = "default";
            trackedBtn.style.fontSize = "11px";
            trackedBtn.disabled = true;

            li.appendChild(a);
            li.appendChild(trackedBtn);
        } else {
            // Add discard button
            const discardBtn = doc.createElement("button");
            discardBtn.textContent = "❌ Discard";
            discardBtn.style.marginLeft = "8px";
            discardBtn.style.padding = "2px 8px";
            discardBtn.style.border = "1px solid #d32f2f";
            discardBtn.style.borderRadius = "4px";
            discardBtn.style.background = "white";
            discardBtn.style.color = "#d32f2f";
            discardBtn.style.cursor = "pointer";
            discardBtn.style.fontSize = "11px";
            discardBtn.addEventListener("click", () => {
                const discarded = getTier3Discarded();
                discarded[user.username] = null; // No URL username available from reactions modal
                saveTier3Discarded(discarded);
                // Remove the list item from the DOM with a fade effect
                li.style.transition = "opacity 0.3s ease-out";
                li.style.opacity = "0";
                setTimeout(() => {
                    li.remove();
                }, 300);
            });

            li.appendChild(a);
            li.appendChild(discardBtn);
        }

        const br = doc.createElement("br");
        const small = doc.createElement("small");
        small.textContent = user.description;

        li.appendChild(br);
        li.appendChild(small);

        return li;
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
        let blacklistKeywords = [];

        if (linkedinUser === "victor") {
            targetAudienceKeywords = VICTOR_TARGET_AUDIENCE_KEYWORDS;
            doubtTargetAudienceKeywords = VICTOR_DOUBT_TARGET_AUDIENCE_KEYWORDS;
            blacklistKeywords = VICTOR_BLACKLIST_KEYWORDS;
        } else if (linkedinUser === "fran") {
            targetAudienceKeywords = FRAN_TARGET_AUDIENCE_KEYWORDS;
            doubtTargetAudienceKeywords = FRAN_DOUBT_TARGET_AUDIENCE_KEYWORDS;
            blacklistKeywords = FRAN_BLACKLIST_KEYWORDS;
        } else {
            console.error("Unknown LINKEDIN_USER:", linkedinUser);
            return;
        }

        // Filter out tier3 discarded users
        const tier3Discarded = getTier3Discarded();
        const tier3Engagers = getTier3Engagers();

        console.log("📊 Tier3 Engagers:", tier3Engagers);
        console.log("❌ Tier3 Discarded:", tier3Discarded);

        const isTier3Discarded = (user) => {
            // Match by display name (user.username is the display name from reactions modal)
            const isDiscarded = tier3Discarded[user.username];
            if (isDiscarded) {
                console.log("🚫 Filtering out discarded user:", user.username, "(username:", isDiscarded, ")");
            }
            return isDiscarded;
        };

        // Filter out discarded users
        const usersBeforeFilter = users.length;
        users = users.filter(u => !isTier3Discarded(u));
        console.log(`Filtered ${usersBeforeFilter - users.length} discarded users. Remaining: ${users.length}`);

        const isTarget = (user) =>
            targetAudienceKeywords.some(k => (user.description || "").toLowerCase().includes(k));
        const isDoubtTarget = (user) =>
            doubtTargetAudienceKeywords.some(k => (user.description || "").toLowerCase().includes(k));
        const isBlacklisted = (user) =>
            blacklistKeywords.some(k => (user.description || "").toLowerCase().includes(k));

        // Sort function to put tracked engagers first
        const sortByTracked = (a, b) => {
            const aTracked = tier3Engagers[a.username] ? 1 : 0;
            const bTracked = tier3Engagers[b.username] ? 1 : 0;
            return bTracked - aTracked; // Tracked first (1 - 0 = 1, so b comes first)
        };

        const targetUsers = users.filter(isTarget).sort(sortByTracked);
        const doubtTargetUsers = users.filter(u => !isTarget(u) && isDoubtTarget(u)).sort(sortByTracked);
        const otherUsers  = users.filter(u => !isTarget(u) && !isDoubtTarget(u) && !isBlacklisted(u)).sort(sortByTracked);

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
            a.download = `${currentCommentId || currentPostId} - scraped_users.html`;
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
            ulTarget.appendChild(createUserListItem(doc, u, tier3Engagers));
        });
        body.appendChild(ulTarget);


        const hDoubt = doc.createElement("h3");
        hDoubt.textContent = "❓ Doubt Users";
        body.appendChild(hDoubt);

        const ulDoubt = doc.createElement("ul");
        ulDoubt.style.listStyle = "none";
        ulDoubt.style.padding = "0";
        doubtTargetUsers.forEach(u => {
            ulDoubt.appendChild(createUserListItem(doc, u, tier3Engagers));
        });
        body.appendChild(ulDoubt);


        const hOther = doc.createElement("h3");
        hOther.textContent = "👥 Other Users";
        body.appendChild(hOther);

        const ulOther = doc.createElement("ul");
        ulOther.style.listStyle = "none";
        ulOther.style.padding = "0";
        otherUsers.forEach(u => {
            ulOther.appendChild(createUserListItem(doc, u, tier3Engagers));
        });
        body.appendChild(ulOther);

        // 📋 Add raw JSON at the end
        const pre = doc.createElement("pre");
        pre.textContent = JSON.stringify(otherUsers);
        body.appendChild(pre);
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
    
            // Random wait between 2s and 4s
            const waitTime = Math.floor(Math.random() * 2000) + 2000; 
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
    
            let username = nameElem?.textContent.trim();
            if (!username) continue;

            // Remove additional name in parentheses (e.g., "Sidney (Sid) M." -> "Sidney M.")
            username = username.replace(/\s*\([^)]+\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

            const user = {
                username,
                description: descElem?.textContent.trim() || '',
                link: linkElem ? linkElem.href : ''
            };

            if (!connectionDegreeEl) {
                // could be a company or something else
                console.log("⚠️ No connection degree element for user:", user);
                // we treat this reaction as connnection for now
                connections.push(user);
                continue;
            }

            const text = connectionDegreeEl.textContent.trim().toLowerCase();
            const isConnection = text.includes('1er') || text.includes('1st');
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


    function getStoredUsernames(itemId, itemType) {
        let key = `scraped_users_${itemId}`;
        if (itemType === "comment") {
            key = "comment_" + key;
        }
        const stored = GM_getValue(key, null);
        const users = stored ? JSON.parse(stored) : [];
        console.log(`User stored: ${users.length}`);
        return users
    }

    function storeUsernames(itemId, itemType, usernames) {
        let key = `scraped_users_${itemId}`;
        if (itemType === "comment") {
            key = "comment_" + key;
        }
        GM_setValue(key, JSON.stringify(usernames));
    }


    async function run() {
        if (!currentPostId && !currentCommentId) {
            console.error("Post or comment ID not found.");
            return;
        }
        const itemId = currentCommentId || currentPostId;
        const itemType = currentCommentId ? "comment" : "post";

        console.log(`Item ID: ${itemId}`);

        await scrollToBottomUntilEnds();
        console.log("Done scroll");

        const allUsers = getReactors();
        const alreadyStored = getStoredUsernames(itemId, itemType);

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
            storeUsernames(itemId, itemType, updatedUsernames);
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
            console.log("Triguering countReactions()");
            countReactions()
        }
    });
})();