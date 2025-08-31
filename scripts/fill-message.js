// ==UserScript==
// @name         LinkedIn Message Template Filler
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Auto-fill LinkedIn message template with name and area
// @match        https://www.linkedin.com/mynetwork/invite-connect/connections/
// @grant        none
// @updateURL    https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/fill-message.js
// @downloadURL  https://raw.githubusercontent.com/franciscorode/tampermonkey-scripts/refs/heads/main/scripts/fill-message.js
// ==/UserScript==

(function () {
    'use strict';

    function getDefaultArea(description) {
        const desc = description.toLowerCase();
        console.log("description: ", description)

        const dataEngineeringKeywords = ["data engineering", "data engineer", "dataops", "etl", "bigdata", "big data", "databricks", "snowflake", "spark", "bigquery", "data pipeline", "ingeniero de datos"];
        const dataAnalyticsKeywords = ["data analytics", "data analyst", "powerbi", "power bi", "tableau", "data visualization", "sql"];
        const dataArchKeywords = ["data architecture", "data warehouse", "data warehousing", "lakehouse", "data lake"];
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

        if (dataArchKeywords.some(k => desc.includes(k))) {
            return "data architecture";
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

    const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    function fillMessage() {
        const parent = document.querySelector('#interop-outlet').shadowRoot
        const messageBox = parent.querySelector('[contenteditable="true"]');
        const nameEl = parent.querySelector('.profile-card-one-to-one__profile-link');
        const descriptionEl = parent.querySelector('.artdeco-entity-lockup__subtitle');

        if (!messageBox || !nameEl) return;

        const name = capitalize(nameEl.textContent.trim().split(' ')[0]);
        const description = descriptionEl.textContent.trim();
        const area = prompt("Enter area:", getDefaultArea(description));
        const lang = prompt("Enter lang:", "en");
        const type = prompt("Enter type (student | worker):", "worker");

        if (!area | !lang | !type) return;

        let message = ""

        if (lang === "en") {
            if (type === "worker") {
                message = `Hey ${name}, thanks for the reaction! I'm building meaningful connections in the data space and found your experience in ${area} very interesting. I'm happy to keep in touch and learn from one another, feel free to reach out anytime! :)`;
            } else {
                message = `Hey ${name}, thanks for the reaction! I'm building meaningful connections in the data space and your interest in ${area} caught my attention. I'm happy to keep in touch and learn from one another, feel free to reach out anytime! :)`;
            }
        } else {
            if (type === "worker") {
                message = `Hola ${name}, gracias por la reacción! Estoy construyendo conexiones genuinas en el área de datos y tu experiencia en ${area} me pareció interesante. Seria genial poder mantenernos en contacto y aprender mutuamente, no dudes en escribirme cuando quieras! :)`;
            } else {
                message = `Hola ${name}, gracias por la reacción!. Estoy construyendo conexiones genuinas en el área de datos y tu interes en ${area} me pareció interesante. Seria genial poder mantenernos en contacto y aprender mutuamente, no dudes en escribirme cuando quieras! :)`;
            }
        }

        messageBox.focus();
        console.log("Focused box");
        document.execCommand('insertText', false, message);
        console.log("Inserted message: ", message);
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