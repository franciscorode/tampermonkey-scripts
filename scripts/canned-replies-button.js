// ==UserScript==
// @name         LinkedIn Chat Canned Responses
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button to LinkedIn chats to insert canned responses
// @author       ChatGPT
// @match        https://www.linkedin.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Add button to reply to comments with a prompt for AI generation

    const replyCommentPrompt = `
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

    Please give me 3–5 reply options that are short (1 sentences), funny, and directly connected to the person’s comment, so the exchange feels natural and engaging.
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


    // Add button to insert canned responses in LinkedIn chats

    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    const CANNED = [
        'You are welcome [NAME] :)',
        'Great :)',
        'Great [NAME]! we keep in touch :)',
        'Genial [NAME]! estamos en contacto :)',
        'Genial :)',
        'Igualmente [NAME] :)',
        'De nada [NAME] :)'
    ];

    let isButtonInjected = false;
    let currentChatId = null;

    function getCurrentChatId() {
        const match = window.location.pathname.match(/\/messaging\/thread\/([^/?#]+)/);
        return match ? match[1] : null;
    }

    function createButton() {
        console.log("Creating canned messages button")
        // Find the chat footer area
        const footer = document.querySelector('.msg-form__left-actions');
        if (!footer) return;

        // Create main button
        const btn = document.createElement('button');
        btn.id = 'tm-canned-btn';
        btn.textContent = '✉️';
        btn.style.marginRight = '8px';
        btn.style.cursor = 'pointer';
        btn.className = 'msg-form__send-button';

        // Create dropdown container
        const menu = document.createElement('div');
        menu.id = 'tm-canned-menu';
        menu.style.background = '#fff';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.padding = '4px';
        menu.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
        menu.style.display = 'none';
        menu.style.zIndex = 1000;
        menu.style.top = 0;
        menu.style.left = 0;

        const nameEl = document.querySelector('.msg-entity-lockup__entity-title');
        if (!nameEl) {
            console.warn("No name element found, cannot personalize messages.");
            return
        }
        const name = capitalize(nameEl.textContent.trim().split(' ')[0]);

        CANNED.forEach(text => {
            const personalizedText = text.replace(/\[NAME\]/g, name);
            const item = document.createElement('div');
            item.textContent = personalizedText;
            item.style.padding = '4px 4px';
            item.style.fontSize = '14px';
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                insertMessage(personalizedText);
                menu.style.display = 'none';
            });
            item.addEventListener('mouseenter', () => item.style.background = '#f0f0f0');
            item.addEventListener('mouseleave', () => item.style.background = '#fff');
            menu.appendChild(item);
        });

        // Toggle menu on button click
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        });

        // Hide menu when clicking outside
        document.addEventListener('click', () => {
            if (menu) menu.style.display = 'none';
        });

        // Insert into DOM
        footer.style.position = 'relative';
        footer.appendChild(btn);
        footer.appendChild(menu);
        isButtonInjected = true;
    }

    function insertMessage(text) {
        const messageBox = document.querySelector('[contenteditable="true"]');
        if (!messageBox) return;

        messageBox.focus();
        document.execCommand('insertText', false, text);
        console.log("Inserted message: ", text);
    }

    let timeout = null;
    const observer = new MutationObserver(() => {
        if (isButtonInjected) return;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            createButton();
        }, 300);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // First run
    createButton();

    setInterval(() => {
        if (location.pathname.includes("messaging")) {
            const newChatId = getCurrentChatId();
            if (newChatId && newChatId !== currentChatId) {
                currentChatId = newChatId;
                console.log("🔁 Chat changed to:", currentChatId);
                isButtonInjected = false; // allow injection again
                createButton(); // re-inject in new chat
            }
        }
    }, 500); // checks every 0.5s

})();