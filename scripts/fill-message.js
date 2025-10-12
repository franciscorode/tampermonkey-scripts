// ==UserScript==
// @name         LinkedIn Message Template Filler
// @namespace    http://tampermonkey.net/
// @version      0.1.5
// @description  Auto-fill LinkedIn message template with name and area
// @match        https://www.linkedin.com/mynetwork/invite-connect/connections/
// @grant        GM_getValue
// @grant        GM_setValue
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/fill-message.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/fill-message.js
// ==/UserScript==

(function () {
    'use strict';

    function getDefaultArea(description, linkedinUser) {
        if (linkedinUser === "fran") {
            return "ai engineering";
        }
        const desc = description.toLowerCase();

        const dataEngineeringKeywords = ["data engineering", "data engineer", "dataops", "etl", "bigdata", "big data", "databricks", "snowflake", "spark", "bigquery", "data pipeline", "ingeniero de datos", "data architecture", "data warehouse", "data warehousing", "lakehouse", "data lake", "Data Eng", "Arquitectura de Datos"];
        const dataAnalyticsKeywords = ["data analytics", "data analyst", "powerbi", "power bi", "tableau", "data visualization", "sql", "Data & Analytics", "Analytics Engineer"];
        const biKeywords = ["bi", "business intelligence", "reporting"];
        const leadKeywords = ["cdo", "head of data", "director of data", "vp of data", "cto", "data manager"]

        if (
            leadKeywords.some(k => desc.includes(k)) &&
            !["factory"].some(ex => desc.includes(ex))
          ) {
            return "leading data projects";
          }

        if (["data governance"].some(k => desc.includes(k))) {
            return "data governance";
        }

        if (["data management"].some(k => desc.includes(k))) {
            return "data management";
        }

        if (dataEngineeringKeywords.some(k => desc.includes(k))) {
            return "data engineering";
        }

        if (dataAnalyticsKeywords.some(k => desc.includes(k))) {
            return "data analytics";
        }

        if (biKeywords.some(k => desc.includes(k))) {
            return "BI";
        }
        return "data engineering";
    }

    async function typeLikeHuman(element, text) {
        element.focus();

        // Simulate first 6 characters
        for (let char of text.slice(0, 6)) {
            document.execCommand("insertText", false, char);
            await new Promise(r => setTimeout(r, 50 + Math.random() * 120));
        }

        // Paste the rest instantly
        document.execCommand("insertText", false, text.slice(6));
        console.log("Inserted message:", text);
    }

    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    function getMessage(name, area, lang, type, linkedinUser) {
        if (linkedinUser === "fran") {
            if (lang === "en") {
                return `Hey ${name}, I'm glad you liked the post! I'm building meaningful connections in the ${area} space and found your profile very interesting. I'm happy to keep in touch and learn from one another, feel free to reach out anytime! :)`;
            }
            return `Hola ${name}, me alegra que te haya gustado la publicación. Estoy construyendo conexiones genuinas en el área de ${area} y tu perfil me ha parecido interesante. Seria genial poder mantenernos en contacto y aprender mutuamente, no dudes en escribirme cuando quieras! :)`;
        }
        if (lang === "en") {
            if (type === "w") {
                return `Hey ${name}, I'm glad you liked the post! I'm building meaningful connections in the data space and found your experience in ${area} very interesting. I'm happy to keep in touch and learn from one another, feel free to reach out anytime! :)`;
            }
            return `Hey ${name}, I'm glad you liked the post! I'm building meaningful connections in the data space and your interest in ${area} caught my attention. I'm happy to keep in touch and learn from one another, feel free to reach out anytime! :)`;
        }
        if (type === "w") {
            return `Hola ${name}, me alegra que te haya gustado la publicación. Estoy construyendo conexiones genuinas en el área de datos y tu experiencia en ${area} me pareció interesante. Seria genial poder mantenernos en contacto y aprender mutuamente, no dudes en escribirme cuando quieras! :)`;
        }
        return `Hola ${name}, me alegra que te haya gustado la publicación. Estoy construyendo conexiones genuinas en el área de datos y tu interes en ${area} me pareció interesante. Seria genial poder mantenernos en contacto y aprender mutuamente, no dudes en escribirme cuando quieras! :)`;
    }

    function fillMessage() {
        let linkedinUser = GM_getValue("LINKEDIN_USER");
        if (!linkedinUser) {
            linkedinUser = prompt("Enter LINKEDIN_USER (victor | fran)", "victor");
            if (!linkedinUser) return;
            if (linkedinUser !== "victor" && linkedinUser !== "fran") return;
            GM_setValue("LINKEDIN_USER", linkedinUser);
        }

        const parent = document.querySelector('#interop-outlet').shadowRoot
        const messageBox = parent.querySelector('[contenteditable="true"]');
        const nameEl = parent.querySelector('.profile-card-one-to-one__profile-link');
        const descriptionEl = parent.querySelector('.artdeco-entity-lockup__subtitle');

        if (!messageBox || !nameEl) return;

        const name = capitalize(nameEl.textContent.trim().split(' ')[0]);
        const description = descriptionEl.textContent.trim();
        const area = prompt("Enter area:", getDefaultArea(description, linkedinUser));
        const lang = prompt("Enter lang:", "en");
        const type = prompt("Enter type: w (worker) | s (student)", "w");

        if (!area | !lang | !type) return;

        let message = getMessage(name, area, lang, type, linkedinUser);

        typeLikeHuman(messageBox, message);

    }

    console.log("✅ LinkedIn fill first messages loaded");
    // Add a keyboard shortcut: Ctrl+Shift+M
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'm') {
            console.log("Triguering fill message");
            fillMessage();
        }
    });
})();