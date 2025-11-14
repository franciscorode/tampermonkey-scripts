// ==UserScript==
// @name         Get prompt to reply comments on LinkedIn
// @namespace    http://tampermonkey.net/
// @version      1.0.6
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
    
    Evaluate this comment and give it a score from 1-10 based on these criteria:
    
    **Comment Quality (0-4 points):**
    - Is this a thoughtful comment that adds value, asks a good question, or shows genuine engagement?
    - Or is it generic ("Great post!", "Thanks for sharing", emoji-only)?
    
    **Relationship Value (0-3 points):**
    - Is the commenter in my target audience (data engineer, manager, CDO) or an influencer?
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
    
    [If score 4-6:]
    👍 REACT ONLY - A like or reaction is enough here
    Reason: [brief explanation]
    
    [If score < 4:]
    ⊘ IGNORE - Not worth your time
    Reason: [brief explanation]
    
    Focus on replies that build real connections with the right people, not on being responsive to everyone.
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
    
    Evaluate this comment and give it a score from 1-10 based on these criteria:
    
    **Comment Quality (0-4 points):**
    - Is this a thoughtful comment that adds value, asks a question, or shows genuine engagement?
    - Or is it generic ("Great post!", "Thanks for sharing", emoji-only)?
    
    **Relationship Value (0-3 points):**
    - Is the commenter in my target audience (AI engineer, manager, CTO) or someone I should connect with?
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
    
    [If score 3-5:]
    👍 REACT ONLY - A like or reaction is enough here
    Reason: [brief explanation]
    
    [If score < 3:]
    ⊘ IGNORE - Not worth your time
    Reason: [brief explanation]
    
    At 800 followers, you can afford to be more responsive. Reply to most substantive comments to build connections and show you're active.
    `;


    function addButtonsToComments() {
        console.log("Creating buttons in comments to copy prompts");
        const comments = document.querySelectorAll('.comments-comment-item__main-content');
        console.log("Comments lenght: ", comments.length)

        comments.forEach(comment => {
            const commentText = comment.textContent.trim();
            const btn = document.createElement('button');
            btn.textContent = '📋';
            btn.title = 'Copy prompt to generate reply'

            const parent = comment.closest('.feed-shared-update-v2');
            const postTextEl = parent.querySelector('.feed-shared-inline-show-more-text');
            const postText = postTextEl ? postTextEl.textContent.trim() : '';

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

                let promptText = replyCommentPrompt.replace("[post_text]", postText).replace("[comment_text]", commentText);
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