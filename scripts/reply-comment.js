// ==UserScript==
// @name         Get prompt to reply comments on LinkedIn
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  Adds a button to LinkedIn comments to copy a prompt to reply them
// @author       ChatGPT
// @match        https://www.linkedin.com/in/*/recent-activity/all/
// @match        https://www.linkedin.com/posts/*
// @match        https://www.linkedin.com/feed/?highlightedUpdateType*
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/reply-comment.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/reply-comment.js
// ==/UserScript==

(function() {
    'use strict';

    // Add button to copy AI prompts to reply comments

    const replyCommentVictorPrompt = `
    I am a senior data engineer with experience in several startups. In the medium term, I’m building a data-focused startup with my twin brother (he’ll be CTO, I’ll be CEO). We’re following lean methodology: start small, solve a problem, and build a product for the data industry.

    Right now, I’m growing my LinkedIn network of future clients (data engineers, data managers, CDOs, etc.). My strategy: posting data-related memes, engaging in groups, and connecting with people who react (+10 connections per post, ~3 posts per week).

    I recently published this post:

    “””
    [post_text]
    “””

    Someone commented:

    “””
    [comment_text]
    “””

    Please give me 3–5 reply options (mid-sized: 2 lines maximum) responding to the comment of the person, so the exchange feels natural and engaging.
    `;

    const replyCommentFranPrompt = `
    I am a senior fullstack and genai engineer with experience in several startups. In the medium term, I’m building a data-focused startup with my twin brother (he’ll be CEO, I’ll be CTO). We’re following lean methodology: start small, solve a problem, and build a product for the data industry.

    Right now, I’m growing my LinkedIn network of future referrals (ai engineers, ai managers, CTOs, etc.). My strategy: posting genai-related memes, engaging in groups, and connecting with people who react (+10 connections per post, ~3 posts per week).

    I recently published this post:

    “””
    [post_text]
    “””

    Someone commented:

    “””
    [comment_text]
    “””

    Please give me 3–5 reply options (mid-sized: 2 lines maximum) responding to the comment of the person, so the exchange feels natural and engaging.
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