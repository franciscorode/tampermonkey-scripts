// ==UserScript==
// @name         LinkedIn Chat Canned Responses
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button to LinkedIn chats to insert canned responses
// @author       ChatGPT
// @match        https://www.linkedin.com/messaging/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CANNED = [
        'You are welcome',
        'Great',
        'Great! we keep in touch',
        'Genial! estamos en contacto',
        'Genial',
        'Igualmente',
        'De nada'
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

        CANNED.forEach(text => {
            const item = document.createElement('div');
            item.textContent = text;
            item.style.padding = '4px 4px';
            item.style.fontSize = '14px';
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                insertMessage(text);
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

    //
    setInterval(() => {
        const newChatId = getCurrentChatId();
        if (newChatId && newChatId !== currentChatId) {
            currentChatId = newChatId;
            console.log("🔁 Chat changed to:", currentChatId);
            isButtonInjected = false; // allow injection again
            createButton(); // re-inject in new chat
        }
    }, 500); // checks every 0.5s

})();