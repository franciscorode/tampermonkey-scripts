// ==UserScript==
// @name         LinkedIn Canned Replies
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Insert predefined replies in LinkedIn chat
// @author       ChatGPT
// @match        https://www.linkedin.com/messaging/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/canned-replies-button.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/canned-replies-button.js
// ==/UserScript==

(function() {
    'use strict';

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

    console.log("✅ LinkedIn canned replies button loaded");

})();