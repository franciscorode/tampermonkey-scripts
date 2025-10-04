// ==UserScript==
// @name         Get prompt to make comments on LinkedIn posts
// @namespace    http://tampermonkey.net/
// @version      1.0.4
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
    Context: I'm a senior data engineer building a data-focused startup with my twin brother (he's CTO, I'm CEO). I'm growing my LinkedIn network of potential clients—data engineers, data managers, and CDOs—by posting data memes and engaging authentically with my network.

    Post I want to comment on:
    """
    [post_text]
    """

    Generate 3–5 comment options that are:
    - One sentence maximum
    - Witty and light-hearted (avoid being overly serious or formal)
    - Genuinely relevant to the post content
    - Conversation starters—written to encourage the author or others to reply
    - Insightful or funny, but never salesy

    Prioritize comments that show genuine interest and add value to the discussion.
    `;

    const commentFranPrompt = `
    Context: I'm a senior fullstack and GenAI engineer building a data-focused startup with my twin brother (he's CEO, I'm CTO). I'm growing my LinkedIn network of potential referrals—AI engineers, AI managers, and CTOs—by posting GenAI memes and engaging authentically with my network.

    Post I want to comment on:
    """
    [post_text]
    """

    Generate 3–5 comment options that are:
    - One sentence maximum
    - Witty and light-hearted (avoid being overly serious or formal)
    - Genuinely relevant to the post content
    - Conversation starters—written to encourage the author or others to reply
    - Insightful or funny, but never salesy

    Prioritize comments that show genuine interest and add value to the discussion.
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