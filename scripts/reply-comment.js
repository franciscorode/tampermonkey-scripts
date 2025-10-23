// ==UserScript==
// @name         Get prompt to reply comments on LinkedIn
// @namespace    http://tampermonkey.net/
// @version      1.0.5
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
    Context: I'm a senior data engineer building a data-focused startup with my twin brother (he's CTO, I'm CEO). I'm growing my LinkedIn network of potential clients—data engineers, data managers, and CDOs—by posting data memes, engaging authentically, and building genuine connections.

    My recent post:
    """
    [post_text]
    """

    Comment I received:
    """
    [comment_text]
    """

    Generate 3–5 reply options that are:
    - Authentic and conversational (not salesy or overly formal)
    - Maximum 2 lines each
    - Value-adding—acknowledge their point, share a relevant insight, or ask a thoughtful follow-up question
    - Natural enough that they encourage continued conversation
    - Professional but approachable

    Focus on building genuine connection over pitching.
    `;

    const replyCommentFranPrompt = `
    Context: I'm a senior fullstack and GenAI engineer building a data-focused startup with my twin brother (he's CEO, I'm CTO). I'm growing my LinkedIn network of potential referrals—AI engineers, AI managers, and CTOs—by posting GenAI memes, engaging authentically, and building genuine connections.

    My recent post:
    """
    [post_text]
    """

    Comment I received:
    """
    [comment_text]
    """

    Generate 3–5 reply options that are:
    - Authentic and conversational (not salesy or overly formal)
    - Maximum 2 lines each
    - Value-adding—acknowledge their point, share a relevant insight, or ask a thoughtful follow-up question
    - Natural enough that they encourage continued conversation
    - Professional but approachable

    Focus on building genuine connection over pitching.
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