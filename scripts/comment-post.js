// ==UserScript==
// @name         Get prompt to make comments on LinkedIn posts
// @namespace    http://tampermonkey.net/
// @version      1.0.8
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
    
    Evaluate this post and give it a score from 1-10 based on these criteria:
    
    **Content Quality (0-4 points):**
    - Does it go beyond surface-level lists or obvious takes?
    - Is the author sharing real experience, taking a strong position, or asking a meaningful question?
    - Would engaging here show my expertise rather than just my presence?
    - IMPORTANT: Personal announcements, goodbyes, job changes, or congratulations posts score LOW here (0-1 points) unless I have a genuine connection to the person
    
    **Audience Relevance (0-3 points):**
    - Is the author a decision-maker (data manager, CDO, CTO) or influencer in data space?
    - Are data engineers or data leaders likely engaging with this post?
    - IMPORTANT: Even if the author is relevant, is THIS specific post aimed at my target audience, or at a different group (students, colleagues, friends)?
    
    **Contribution Potential (0-3 points):**
    - Can I add genuine insight from my experience that others couldn't?
    - Would my comment start a substantive conversation or just add noise?
    - Would commenting here look authentic or like I'm just trying to get noticed?
    
    **Response format:**
    
    **Post Summary:** [1-2 sentence summary of what the post is about]
    
    **Score: [X/10]**
    
    [If score ≥ 6:]
    ✓ WORTH COMMENTING
    
    Then provide 3–5 comment options that are:
    - One sentence maximum
    - Witty and light-hearted (avoid being overly serious or formal)
    - Genuinely relevant to the post content
    - Conversation starters—written to encourage the author or others to reply
    - Insightful or funny, but never salesy
    - Based on real experience, not generic observations
    
    [If score 3-5:]
    👍 REACT ONLY - Give it a like or reaction
    Reason: [brief explanation of why it's worth acknowledging but not commenting]
    
    [If score < 3:]
    ⊘ IGNORE - Not worth your time
    Reason: [brief reason why the score is low]
    
    Be ruthlessly selective with comments. Your credibility as a CEO depends on only showing up when you have something valuable to say. Avoid personal posts (announcements, goodbyes, congratulations) unless you genuinely know the person. Reactions are fine for showing support without diluting your voice.
    `;
    
    const commentFranPrompt = `
    Context: I'm a fullstack and GenAI engineer and CTO of a data startup (my twin brother is CEO). I have 800 LinkedIn followers. I'm building my network of potential referrals and connections—AI engineers, AI managers, and CTOs—by posting GenAI memes and engaging actively to increase visibility.
    
    Post I want to comment on:
    """
    [post_text]
    """
    
    Evaluate this post and give it a score from 1-10 based on these criteria:
    
    **Content Relevance (0-4 points):**
    - Does it relate to GenAI, AI engineering, LLMs, or AI infrastructure?
    - Is it something AI engineers or builders would care about?
    - IMPORTANT: Personal announcements, goodbyes, job changes score LOW here (0-1 points) unless I have a genuine connection to the person
    
    **Audience Value (0-3 points):**
    - Is the author in my target audience (AI engineer, manager, CTO) or an influencer in AI space?
    - Are the right people engaging with this post?
    - IMPORTANT: Even if the author is relevant, is THIS specific post aimed at my target audience, or at a different group?
    
    **Engagement Opportunity (0-3 points):**
    - Can I add value, humor, or relatability from my experience?
    - Would my comment help build a connection or start a conversation?
    - Would commenting here look authentic or like I'm just trying to get noticed?
    
    **Response format:**
    
    **Post Summary:** [1-2 sentence summary of what the post is about]
    
    **Score: [X/10]**
    
    [If score ≥ 5:]
    ✓ WORTH COMMENTING
    
    Then provide 3–5 comment options that are:
    - One sentence maximum
    - Witty and light-hearted (avoid being overly serious or formal)
    - Genuinely relevant to the post content
    - Conversation starters—written to encourage the author or others to reply
    - Relatable or funny, showing you "get it" as a fellow builder
    - Never salesy or self-promotional
    
    [If score 2-4:]
    👍 REACT ONLY - Give it a like or reaction
    Reason: [brief explanation of why it's worth acknowledging but not commenting]
    
    [If score < 2:]
    ⊘ IGNORE - Not worth your time
    Reason: [brief reason why the score is low]
    
    At 800 followers, you can engage more broadly. Reactions help you stay visible without overcommitting your time. Avoid personal posts (announcements, goodbyes, congratulations) unless you genuinely know the person. Focus on building connections through substantive content.
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
            const postText = postTextEl?.querySelector('div').textContent.trim();
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
                const commentPrompt = linkedinUser === "victor" ? commentVictorPrompt : commentFranPrompt;

                let promptText = commentPrompt.replace("[post_text]", postText);
                navigator.clipboard.writeText(promptText);
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