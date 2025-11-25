// ==UserScript==
// @name         Get prompt to make comments on LinkedIn posts
// @namespace    http://tampermonkey.net/
// @version      1.0.11
// @description  Adds a button to copy AI prompt to generate comments to a post
// @author       ChatGPT
// @match        https://www.linkedin.com/feed/*
// @match        https://www.linkedin.com/in/*/recent-activity/all/
// @match        https://www.linkedin.com/posts/*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/comment-post.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/comment-post.js
// ==/UserScript==

(function() {
    'use strict';

    // Add button to copy AI prompt to generate comments to a post

    const commentVictorPrompt = `
    Context: I'm a senior data engineer and CEO of a data startup (my twin brother is CTO). I have 3,000 LinkedIn followers. I'm building my network of future clients—data engineers, data managers, and CDOs—by establishing authority through high-value content and selective, meaningful engagement.

    Post I want to comment on:
    """
    [post_text]
    """

    Post author:
    """
    [post_author]
    """

    Post engagement data:
    """
    [post_reactions]
    """

    Time posted:
    """
    [time_posted_ago]
    """

    Evaluate this post and give it a score from 1-10 based on these criteria:

    **Pod Detection Flag:**
    Calculate reactions/comments ratio:
    - If comments >= reactions: STOP EVALUATION and return "🚩 LIKELY POD - Skip this post"
    - If ratio is 2-8: Flag as "⚠️ POSSIBLE POD" (continue evaluation but reduce score by 2 points)
    - If ratio is 9+: Likely organic (proceed normally)

    **Content Quality (0-3 points):**
    - Does the content make logical sense and is it coherent/congruent?
    - Does it go beyond surface-level lists or obvious takes?
    - Is the author sharing real experience, taking a strong position, or asking a meaningful question?
    - Would engaging here show my expertise rather than just my presence?
    - IMPORTANT: Personal announcements, goodbyes, job changes, or congratulations posts score LOW here (0-1 points) unless I have a genuine connection to the person

    **Audience Relevance (0-2 points):**
    - Is the author a decision-maker (data manager, CDO, CTO) or influencer in data space? (Use post author name/title to assess)
    - Are data engineers or data leaders likely engaging with this post?
    - IMPORTANT: Even if the author is relevant, is THIS specific post aimed at my target audience, or at a different group (students, colleagues, friends)?
    - High-value authors (known influencers, CTOs, data leaders) get +1 bonus point

    **Engagement Momentum (0-3 points):**
    Posts 0-6 hours old:
    - 3 pts: 30+ reactions OR 3+ comments
    - 2 pts: 15-29 reactions OR 2 comments
    - 1 pt: 5-14 reactions OR 1 comment
    - 0 pts: <5 reactions, no comments

    Posts 6-24 hours old:
    - 3 pts: 50+ reactions OR 5+ comments
    - 2 pts: 25-49 reactions OR 3-4 comments
    - 1 pt: 10-24 reactions OR 1-2 comments
    - 0 pts: <10 reactions

    Posts 1+ days old:
    - 0 pts (skip these—conversation is over)

    EXCEPTION: High-value connection + post <24h old = +1 point even if engagement is low

    **Contribution Potential (0-2 points):**
    - Can I add genuine insight from my experience that others couldn't?
    - Would my comment start a substantive conversation or just add noise?
    - Would commenting here look authentic or like I'm just trying to get noticed?

    **Response format:**

    **Post Summary:** [1-2 sentence summary of what the post is about]

    **Engagement Status:** [Posted X ago | Y reactions, Z comments, W shares - note if active or dead]

    **Pod Detection:** [reactions/comments ratio = X | Status: 🚩 LIKELY POD / ⚠️ POSSIBLE POD] [Only show this line if ratio is 8 or lower. Skip entirely if organic (ratio 9+)]

    **Score: [X/10]** [minus 2 if POSSIBLE POD flagged]

    [If 🚩 LIKELY POD detected:]
    ⊘ SKIP - This is likely an engagement pod
    Reason: Comments >= reactions suggests artificial engagement gaming

    [If score ≥ 7:]
    ✓ WORTH COMMENTING

    Then provide 3–5 comment options that are:
    - One sentence maximum
    - Witty and light-hearted (avoid being overly serious or formal)
    - Genuinely relevant to the post content
    - Conversation starters—written to encourage the author or others to reply
    - Insightful or funny, but never salesy
    - Based on real experience, not generic observations

    [If score 4-6:]
    👍 REACT ONLY - Give it a like or reaction
    Reason: [brief explanation of why it's worth acknowledging but not commenting]

    [If score < 4:]
    ⊘ IGNORE - Not worth your time
    Reason: [brief reason why the score is low - mention if timing/engagement is a factor]

    Be ruthlessly selective. Skip posts older than 24 hours—commenting late looks desperate and gets buried. Focus on fresh posts with momentum or strategic early support for high-value connections.
    `;

    const commentFranPrompt = `
    Context: I'm a fullstack and GenAI engineer and CTO of a data startup (my twin brother is CEO). I have 800 LinkedIn followers. I'm building my network of potential referrals and connections—AI engineers, AI managers, and CTOs—by posting GenAI memes and engaging actively to increase visibility.

    Post I want to comment on:
    """
    [post_text]
    """

    Post author:
    """
    [post_author]
    """

    Post engagement data:
    """
    [post_reactions]
    """

    Time posted:
    """
    [time_posted_ago]
    """

    Evaluate this post and give it a score from 1-10 based on these criteria:

    **Pod Detection Flag:**
    Calculate reactions/comments ratio:
    - If comments >= reactions: STOP EVALUATION and return "🚩 LIKELY POD - Skip this post"
    - If ratio is 2-8: Flag as "⚠️ POSSIBLE POD" (continue evaluation but reduce score by 2 points)
    - If ratio is 9+: Likely organic (proceed normally)

    **Content Relevance (0-3 points):**
    - Does the content make logical sense and is it coherent/congruent?
    - Does it relate to GenAI, AI engineering, LLMs, or AI infrastructure?
    - Is it something AI engineers or builders would care about?
    - IMPORTANT: Personal announcements, goodbyes, job changes score LOW here (0-1 points) unless I have a genuine connection to the person

    **Audience Value (0-2 points):**
    - Is the author in my target audience (AI engineer, manager, CTO) or an influencer in AI space? (Use post author name/title to assess)
    - Are the right people engaging with this post?
    - IMPORTANT: Even if the author is relevant, is THIS specific post aimed at my target audience, or at a different group?
    - High-value authors (known AI influencers, CTOs, AI engineering leaders) get +1 bonus point

    **Engagement Momentum (0-3 points):**
    Posts 0-6 hours old:
    - 3 pts: 20+ reactions OR 2+ comments
    - 2 pts: 10-19 reactions OR 1-2 comments
    - 1 pt: 3-9 reactions OR 1 comment
    - 0 pts: <3 reactions, no comments

    Posts 6-24 hours old:
    - 3 pts: 30+ reactions OR 4+ comments
    - 2 pts: 15-29 reactions OR 2-3 comments
    - 1 pt: 5-14 reactions OR 1 comment
    - 0 pts: <5 reactions, no comments

    Posts 1+ days old:
    - 0 pts (skip these—too late to get visibility)

    **Engagement Opportunity (0-2 points):**
    - Can I add value, humor, or relatability from my experience?
    - Would my comment help build a connection or start a conversation?
    - Would commenting here look authentic or like I'm just trying to get noticed?

    **Response format:**

    **Post Summary:** [1-2 sentence summary of what the post is about]

    **Engagement Status:** [Posted X ago | Y reactions, Z comments, W shares - note if active or dead]

    **Pod Detection:** [reactions/comments ratio = X | Status: 🚩 LIKELY POD / ⚠️ POSSIBLE POD] [Only show this line if ratio is 8 or lower. Skip entirely if organic (ratio 9+)]

    **Score: [X/10]** [minus 2 if POSSIBLE POD flagged]

    [If 🚩 LIKELY POD detected:]
    ⊘ SKIP - This is likely an engagement pod
    Reason: Comments >= reactions suggests artificial engagement gaming

    [If score ≥ 7:]
    ✓ WORTH COMMENTING

    Then provide 3–5 comment options that are:
    - One sentence maximum
    - Witty and light-hearted (avoid being overly serious or formal)
    - Genuinely relevant to the post content
    - Conversation starters—written to encourage the author or others to reply
    - Relatable or funny, showing you "get it" as a fellow builder
    - Never salesy or self-promotional

    [If score 4-6:]
    👍 REACT ONLY - Give it a like or reaction
    Reason: [brief explanation of why it's worth acknowledging but not commenting]

    [If score < 4:]
    ⊘ IGNORE - Not worth your time
    Reason: [brief reason why the score is low - mention if timing/engagement is a factor]

    At 800 followers, you can engage earlier than someone with 3K. Skip posts older than 24 hours—late comments get buried. Focus on fresh posts with early momentum.
    `;

    function addButtonsToPosts() {
        console.log("Creating buttons in posts to copy prompt to generate comments");
        const posts = document.querySelectorAll('.fie-impression-container');
        console.log("Posts lenght: ", posts.length)

        posts.forEach(post => {
            const commentButton = post.querySelector('.tm-comment-btn');
            if (commentButton) {
                return; // skips to the next post
            }
            const postTextEl = post.querySelector('.feed-shared-inline-show-more-text');
            if (!postTextEl) {
                return; // skips no posts containers
            }
            const postReactionsEl = post.querySelector('.social-details-social-counts');
            if (!postReactionsEl) {
                return;
            }
            const postTimeEl = post.querySelector('.update-components-actor__sub-description')?.firstElementChild;
            if (!postTimeEl) {
                return;
            }
            const postAuthorEl = post.querySelector('.update-components-actor__meta-link');
            if (!postAuthorEl) {
                return;
            }

            const postText = postTextEl?.querySelector('div').textContent.trim();
            const postReactions = postReactionsEl.textContent.replace(/\s+/g, ' ').trim();
            const postTime = postTimeEl.textContent.replace(/\s+/g, ' ').trim();
            const postAuthor = postAuthorEl.textContent.replace(/\s+/g, ' ').trim();
            const btn = document.createElement('button');
            btn.class = 'tm-comment-btn';
            btn.textContent = '📋';
            btn.title = 'Copy prompt to generate comment'
            btn.style.marginInline = '2.7%';

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                let linkedinUser = GM_getValue("LINKEDIN_USER");
                if (!linkedinUser) {
                    linkedinUser = prompt("Enter LINKEDIN_USER (victor | fran)", "victor");
                    if (!linkedinUser) return;
                    if (linkedinUser !== "victor" && linkedinUser !== "fran") return;
                    GM_setValue("LINKEDIN_USER", linkedinUser);
                }
                let finalPrompt = linkedinUser === "victor" ? commentVictorPrompt : commentFranPrompt;

                finalPrompt = finalPrompt.replace("[post_text]", postText);
                finalPrompt = finalPrompt.replace("[post_author]", postAuthor);
                finalPrompt = finalPrompt.replace("[post_reactions]", postReactions);
                finalPrompt = finalPrompt.replace("[time_posted_ago]", postTime);

                navigator.clipboard.writeText(finalPrompt);
            });
            postTextEl.parentElement.appendChild(btn);
        })
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'c') {
            console.log("Triguering add buttons to posts");
            addButtonsToPosts()
        }
    });

    console.log("✅ LinkedIn buttons for comments loaded");

})();