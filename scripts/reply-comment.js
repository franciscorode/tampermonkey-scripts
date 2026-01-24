// ==UserScript==
// @name         Get prompt to reply comments on LinkedIn
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Adds a button to LinkedIn comments to copy a prompt to reply them
// @author       ChatGPT
// @match        https://www.linkedin.com/in/*/recent-activity/all/
// @match        https://www.linkedin.com/posts/*
// @match        https://www.linkedin.com/feed/?highlightedUpdateType*
// @match        https://www.linkedin.com/feed/update/*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/reply-comment.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/reply-comment.js
// ==/UserScript==

(function() {
    'use strict';

    // Add button to copy AI prompts to reply comments

    const replyCommentVictorPrompt = `
    Context: I'm a senior data engineer and CEO of a data startup (my twin brother is CTO). I have 3,000 LinkedIn followers. I'm building my network of future clients—data engineers, data managers, and CDOs—by establishing authority through high-value content and selective, meaningful engagement.
    
    My recent post:
    """
    [post_text]
    """
    
    Comment I received:
    """
    [comment_text]
    """

    Comment author:
    """
    [comment_author]
    """
    
    Evaluate this comment and give it a score from 1-10 based on these criteria:

    **Comment Quality (0-4 points):**
    - Is this a thoughtful comment that adds value, asks a good question, or shows genuine engagement?
    - Does it offer a good reframe, personal experience, or interesting perspective?
    - Or is it generic fluff ("Great post!", "Thanks for sharing", emoji-only)?

    **Relationship Value (0-3 points):**
    - Based on the comment author's name/title, are they in my target audience (data engineer, manager, CDO) or an influencer?
    - Could replying help build a meaningful connection?

    **Conversation Potential (0-3 points):**
    - Does the comment open a conversation worth having?
    - Can I add real value in my reply, or would I just be being polite?

    **Response format:**

    **Comment Summary:** [1 sentence describing what the commenter said]

    **Score: [X/10]**

    [If score ≥ 7:]
    ✓ REPLY - This deserves a thoughtful response

    Generate 3–5 reply options that are:
    - Authentic and conversational (not salesy or overly formal)
    - Maximum 2 lines each
    - Value-adding—acknowledge their point, share a relevant insight, or ask a thoughtful follow-up question
    - Natural enough that they encourage continued conversation
    - Professional but approachable

    [If score 3-6:]
    👍 LIKE - Show appreciation with a like/reaction
    Reason: [brief explanation of what made it worth acknowledging]

    [If score < 3:]
    ⊘ SKIP - Don't engage
    Only skip for: obvious bots/spam, incongruent comments, or empty fluff ("Thanks for sharing!", "Great!", emoji-only)
    Reason: [brief explanation]

    Focus replies on building real connections. Be generous with likes—it's courtesy that encourages future engagement.
    `;
    
    const replyCommentFranPrompt = `
    Context: I'm a fullstack and GenAI engineer and CTO of a data startup (my twin brother is CEO). I have 800 LinkedIn followers. I'm building my network of potential referrals and connections—AI engineers, AI managers, and CTOs—by posting GenAI memes and engaging actively to increase visibility.
    
    My recent post:
    """
    [post_text]
    """
    
    Comment I received:
    """
    [comment_text]
    """

    Comment author:
    """
    [comment_author]
    """
    
    Evaluate this comment and give it a score from 1-10 based on these criteria:

    **Comment Quality (0-4 points):**
    - Is this a thoughtful comment that adds value, asks a question, or shows genuine engagement?
    - Does it offer a good reframe, personal experience, or interesting perspective?
    - Or is it generic fluff ("Great post!", "Thanks for sharing", emoji-only)?

    **Relationship Value (0-3 points):**
    - Based on the comment author's name/title, are they in my target audience (AI engineer, manager, CTO) or someone I should connect with?
    - Could replying help build visibility or a connection?

    **Engagement Opportunity (0-3 points):**
    - Does the comment open a conversation or let me show personality?
    - Can I add value, humor, or keep the conversation going?

    **Response format:**

    **Comment Summary:** [1 sentence describing what the commenter said]

    **Score: [X/10]**

    [If score ≥ 6:]
    ✓ REPLY - Worth engaging with

    Generate 3–5 reply options that are:
    - Authentic and conversational (not salesy or overly formal)
    - Maximum 2 lines each
    - Value-adding—acknowledge their point, share a relevant insight, or ask a thoughtful follow-up question
    - Natural enough that they encourage continued conversation
    - Professional but approachable

    [If score 2-5:]
    👍 LIKE - Show appreciation with a like/reaction
    Reason: [brief explanation of what made it worth acknowledging]

    [If score < 2:]
    ⊘ SKIP - Don't engage
    Only skip for: obvious bots/spam, incongruent comments, or empty fluff ("Thanks for sharing!", "Great!", emoji-only)
    Reason: [brief explanation]

    At 800 followers, be responsive and generous with engagement. Like most comments, reply to substantive ones.
    `;


    function addButtonsToComments() {
        console.log("Creating buttons in comments to copy prompts");
        const comments = document.querySelectorAll('.comments-comment-entity');
        console.log("Comments lenght: ", comments.length)

        comments.forEach(comment => {
            const btn = document.createElement('button');
            btn.textContent = '📋';
            btn.title = 'Copy prompt to generate reply'

            const parent = comment.closest('.feed-shared-update-v2');
            const postTextEl = parent.querySelector('.feed-shared-inline-show-more-text');
            const postText = postTextEl ? postTextEl.textContent.trim() : '';

            const commentText = comment.querySelector('.comments-comment-item__main-content').textContent.trim();
            const commentAuthor = comment.querySelector('.comments-comment-meta__actor').textContent.replace(/\s+/g, ' ').trim();


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
                const replyCommentPrompt = linkedinUser === "victor" ? replyCommentVictorPrompt : replyCommentFranPrompt;

                let promptText = replyCommentPrompt.replace("[post_text]", postText).replace("[comment_text]", commentText).replace("[comment_author]", commentAuthor);
                navigator.clipboard.writeText(promptText);
            });
            comment.appendChild(btn);
        })
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'r') {
            console.log("Triguering add buttons to comments");
            addButtonsToComments()
        }
    });

    console.log("✅ LinkedIn buttons for replies to comments loaded");

})();