// ==UserScript==
// @name         VinSolutions & DriveCentric
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Unificado: Popups, Copiado (con estilo mejorado), y Resaltado de palabras clave y nombres.
// @author       Angel Torres & Gemini
// @match        *://*.vinsolutions.com/CarDashboard/Pages/CRM/SoldLog.aspx*
// @match        *://*.vinsolutions.com/CarDashboard/Pages/LeadManagement/ActiveLeads_WorkList.aspx*
// @match        *://*.vinsolutions.com/CarDashboard/Pages/CRM/ActiveLeads.aspx*
// @match        *://*.vinsolutions.com/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/CRM/SoldLog.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/LeadManagement/ActiveLeads_WorkList.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/CRM/ActiveLeads.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx*
// @match        https://app.drivecentric.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=vinsolutions.com
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/combine/driveCentric-Vinsolutions-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/combine/driveCentric-Vinsolutions-angel.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_PREFIX = "Master Script - Github Version";
    const hostname = window.location.hostname;
    console.log(`${SCRIPT_PREFIX}: Script INICIANDO en -> ${hostname}`);

    // =================================================================================
    //  ROUTER PRINCIPAL: DETECTA LA PLATAFORMA Y EJECUTA EL CÓDIGO CORRESPONDIENTE
    // =================================================================================

    if (hostname.includes('vinsolutions.com') || hostname.includes('coxautoinc.com')) {
        /********************************************************************
         *
         * BLOQUE DE CÓDIGO PARA VINSOLUTIONS
         *
         ********************************************************************/
        console.log(`${SCRIPT_PREFIX}: Modo VinSolutions activado.`);
        const currentPath = window.location.pathname;

        // --- LÓGICA PARA EL PANEL PRINCIPAL DE VINSOLUTIONS (SIN CAMBIOS) ---
        if (currentPath.includes('/CarDashboard/Pages/CRM/SoldLog.aspx') || currentPath.includes('/CarDashboard/Pages/LeadManagement/ActiveLeads_WorkList.aspx') || currentPath.includes('/CarDashboard/Pages/CRM/ActiveLeads.aspx')) {
            const linkClass = 'viewitemlink';
            const idRegex = /top\.viewItemGCID\((\d+),\s*(\d+)\)/;
            function handleClick(event) {
                const href = event.currentTarget.getAttribute('href');
                if (href) {
                    const match = href.match(idRegex);
                    if (match && match[1] && match[2]) {
                        const logCallUrl = `/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx?AutoLeadID=${match[2]}&GlobalCustomerID=${match[1]}&V2Redirect=2`;
                        try {
                            if (typeof top.OpenWindow === 'function') top.OpenWindow(logCallUrl, 'LogCallEdit');
                            else window.open(logCallUrl, 'LogCallEdit', 'width=800,height=650,resizable=yes,scrollbars=yes');
                        } catch (e) { window.open(logCallUrl, 'LogCallEdit', 'width=800,height=650,resizable=yes,scrollbars=yes'); }
                    }
                }
            }
            function attachListeners() {
                document.querySelectorAll(`a.${linkClass}`).forEach(link => {
                    if (!link.dataset.logCallListener) {
                        link.addEventListener('click', handleClick);
                        link.dataset.logCallListener = 'true';
                    }
                });
            }
            const mainObserver = new MutationObserver(() => {
                clearTimeout(window.vsMainDebounce);
                window.vsMainDebounce = setTimeout(attachListeners, 500);
            });
            mainObserver.observe(document.body, { childList: true, subtree: true });
            attachListeners();
        }
        // --- LÓGICA PARA EL POPUP DE VINSOLUTIONS (MODIFICADA) ---
        else if (currentPath.includes('/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx')) {
            // ** MODIFICACIÓN: Se añade tu estilo para alinear el nombre y el botón **
            GM_addStyle(`
                .copy-icon-vs-unified { cursor: pointer; margin-left: 6px; font-size: 0.85em; display: inline-block; user-select: none; vertical-align: middle; }
                .copy-icon-vs-unified:hover { opacity: 0.7; }
                /* NUEVA REGLA DE ESTILO */
                div#CustomerData h4 {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .resaltado-clave-vinsol { background-color: #FFD700; color: #B22222; font-weight: bold; padding: 1px 3px; border-radius: 3px; }
                .resaltado-nombre-vinsol { background-color: #58b96f; color: #f7fdf9; font-weight: bold; padding: 1px 3px; border-radius: 3px; }
            `);
            const palabrasClave = ['option', 'options', 'xchange', 'interest', 'trade'];
            const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');
            const nombresClave = ['JAY', 'KIARA', 'CHLOE B', 'BECCA', 'JAZ', 'JJ', 'CHRIS', 'NEA', 'DANI', 'MARK A', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY'];
            nombresClave.sort((a, b) => b.length - a.length);
            const regexNombres = new RegExp(`(${nombresClave.join('|')})`, 'gi');

            function resaltarContenido(elementos, regex, claseCss, dataAttribute) {
                 elementos.forEach(elem => {
                    if (elem.dataset[dataAttribute]) return;
                    const originalHTML = elem.innerHTML;
                    const nuevoHTML = originalHTML.replace(regex, match => `<span class="${claseCss}">${match}</span>`);
                    if (nuevoHTML !== originalHTML) elem.innerHTML = nuevoHTML;
                    elem.dataset[dataAttribute] = "true";
                });
            }

            // ** MODIFICACIÓN: La función ahora añade el botón como HIJO del elemento (appendChild) **
            function addCopyIcon(targetElement, textToCopy) {
            if (targetElement.dataset.copyIconAdded === 'true') return;
            const icon = document.createElement('span');
            icon.className = 'copy-icon-vs-unified';
            icon.title = `Copiar: ${textToCopy}`;
            icon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4
                             a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
            `;
            icon.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                GM_setClipboard(textToCopy);
                icon.innerHTML = `<span style="color:green; font-weight:bold;">✔</span>`;
                setTimeout(() => {
                    if (document.body.contains(icon)) addCopyIcon(targetElement, textToCopy);
                }, 1500);
            });
            targetElement.appendChild(icon);
            targetElement.dataset.copyIconAdded = 'true';
        }

            function runAllPopupEnhancements() {
                // Tarea 1: Añadir iconos de copiado (con la nueva lógica de inserción)
                const customerDataContainer = document.getElementById('CustomerData');
                if (customerDataContainer) {
                    const nameElement = customerDataContainer.querySelector('h4[data-bind="text: fullName"]');
                    if (nameElement) {
                        const customerName = nameElement.textContent.trim();
                        if (customerName && customerName.toLowerCase() !== "name unknown") addCopyIcon(nameElement, customerName);
                    }
                    customerDataContainer.querySelectorAll('span[data-bind*="maskPhoneNumber"]').forEach(span => {
                        const phoneNumber = span.textContent.trim();
                        // Para los teléfonos, también funciona bien con appendChild.
                        if (phoneNumber) addCopyIcon(span, phoneNumber);
                    });
                }
                // Tarea 2: Resaltar palabras clave y nombres (sin cambios)
                const notasDesc = document.querySelectorAll('div#NotesAndHistory span[data-bind="text: Description"]');
                const notasNombres = document.querySelectorAll('div#NotesAndHistory span[data-bind*="AssociatedUserFullName"]');
                resaltarContenido(notasDesc, regexPalabras, 'resaltado-clave-vinsol', 'resaltadoClave');
                resaltarContenido(notasDesc, regexNombres, 'resaltado-nombre-vinsol', 'resaltadoNombre');
                resaltarContenido(notasNombres, regexNombres, 'resaltado-nombre-vinsol', 'resaltadoNombre');
            }

            const popupObserver = new MutationObserver(() => {
                clearTimeout(window.vsPopupDebounce);
                window.vsPopupDebounce = setTimeout(runAllPopupEnhancements, 300);
            });
            popupObserver.observe(document.body, { childList: true, subtree: true });
            runAllPopupEnhancements();
        }

    } else if (hostname.includes('drivecentric.com')) {
        /********************************************************************
         *
         * BLOQUE DE CÓDIGO PARA DRIVE CENTRIC (SIN CAMBIOS)
         *
         ********************************************************************/
        console.log(`${SCRIPT_PREFIX}: Modo DriveCentric activado.`);
        const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade'];
        const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');
        const nombresClave = ['JAY', 'KIARA', 'CHLOE B', 'BECCA', 'JAZ', 'JJ', 'CHRIS', 'NEA', 'DANI', 'MARK A', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY'];
        nombresClave.sort((a, b) => b.length - a.length);
        const regexNombres = new RegExp(`(${nombresClave.join('|')})`, 'gi');

        GM_addStyle(`
            .copy-data-btn-drc { cursor: pointer; margin-left: 8px; display: inline-flex; align-items: center; user-select: none; }
            .resaltado-clave-drc { background-color: yellow !important; color: red !important; font-weight: bold !important; }
            .resaltado-nombre-drc { background-color: #58b96f !important; color: #f7fdf9 !important; font-weight: bold !important; }
        `);

        function addCopyButton(target, text) {
            if (target.dataset.hasCopyBtn) return;
            const btn = document.createElement('span');
            btn.className = 'copy-data-btn-drc'; btn.textContent = '📋'; btn.title = `Copiar: ${text}`;
            btn.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                navigator.clipboard.writeText(text).then(() => { btn.textContent = '✅'; setTimeout(() => btn.textContent = '📋', 1500); });
            });
            target.appendChild(btn);
            target.dataset.hasCopyBtn = 'true';
        }

        function highlightContent(regex, cssClass, dataAttr) {
            document.querySelectorAll('drc-timeline div.cmp-tml-bd').forEach(elem => {
                if (elem.dataset[dataAttr]) return;
                const originalHTML = elem.innerHTML;
                const nuevoHTML = originalHTML.replace(regex, match => `<span class="${cssClass}">${match}</span>`);
                if (nuevoHTML !== originalHTML) elem.innerHTML = nuevoHTML;
                elem.dataset[dataAttr] = "true";
            });
        }

        function processPage() {
            document.querySelectorAll('drc-card-customer p.card-customer__name, drc-deal-card-header .cust-name').forEach(el => addCopyButton(el, el.textContent.trim()));
            document.querySelectorAll('.card-customer__item .fa-phone').forEach(icon => {
                const phoneEl = icon.closest('.card-customer__item')?.querySelector('.card-customer__item-content');
                if (phoneEl) addCopyButton(phoneEl, phoneEl.textContent.trim().replace(/edit/i, '').trim());
            });
            document.querySelectorAll('drc-deal-card-header .phone-detail').forEach(el => addCopyButton(el, el.textContent.trim()));
            highlightContent(regexPalabras, 'resaltado-clave-drc', 'resaltadoClave');
            highlightContent(regexNombres, 'resaltado-nombre-drc', 'resaltadoNombre');
        }

        const dcObserver = new MutationObserver(() => {
            clearTimeout(window.dcDebounce);
            window.dcDebounce = setTimeout(processPage, 750);
        });
        dcObserver.observe(document.body, { childList: true, subtree: true });
        setTimeout(processPage, 1500);
    }

})();