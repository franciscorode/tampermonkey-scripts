// ==UserScript==
// @name         Get prompt to make comments on LinkedIn posts
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button to copy AI prompt to generate comments to a post
// @author       ChatGPT
// @match        https://www.linkedin.com/feed/*
// @match        https://www.linkedin.com/in/*/recent-activity/all/
// @match        https://www.linkedin.com/posts/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/comment-post.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/comment-post.js
// ==/UserScript==

(function() {
    'use strict';

    // Add button to copy AI prompt to generate comments to a post

    const commentPrompt = `
    I am a senior data engineer with experience in multiple startups. In the medium term, I’m building a data-focused startup with my twin brother (he’ll be CTO, I’ll be CEO). We’re following lean methodology: starting small, solving a real problem, and building the right product for the data industry.

    Right now, I’m expanding my network of future clients (data engineers, data managers, CDOs, etc.) on LinkedIn. My strategy: posting data-related memes, engaging in groups, and connecting with people who react (+10 connections per post, ~3 posts per week).

    When I see posts from my network about data, I want to add comments that are:

    - short (1 sentence),
    - related to the post content,
    - light/funny so they spark replies.

    I just saw this post:

    “””
    [post_text]
    “””

    Please give me 3–5 comment options that are witty, engaging, and relevant to the post.
    `;

    function addButtonsToPosts() {
        console.log("Creating buttons in posts to copy prompt to generate comments");
        const posts = document.querySelectorAll('.fie-impression-container');
        console.log("Posts lenght: ", posts.length)

        posts.forEach(post => {
            const commentButton = post.querySelector('#tm-comment-btn');
            if (commentButton) {
                return; // skips to the next post
            }
            const postTextEl = post.querySelector('.feed-shared-inline-show-more-text');
            if (!postTextEl) {
                return; // skips no posts containers
            }
            const postText = postTextEl?.querySelector('div').textContent.trim();
            const btn = document.createElement('button');
            btn.id = 'tm-comment-btn';
            btn.textContent = '📋';
            btn.title = 'Copy prompt to generate comment'
            btn.style.marginInline = '2.7%';

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
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