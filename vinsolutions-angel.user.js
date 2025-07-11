// ==UserScript==
// @name         VinSolutions - Github Version
// @namespace    http://tampermonkey.net/
// @version      4.4
// @description  Abre popup 'Log Call', añade iconos de copiado (con estilo mejorado) y resalta palabras clave Y nombres de usuario.
// @author       Angel Torres
// @match        *://*.vinsolutions.com/CarDashboard/Pages/CRM/SoldLog.aspx*
// @match        *://*.vinsolutions.com/CarDashboard/Pages/LeadManagement/ActiveLeads_WorkList.aspx*
// @match        *://*.vinsolutions.com/CarDashboard/Pages/CRM/ActiveLeads.aspx*
// @match        *://*.vinsolutions.com/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/CRM/SoldLog.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/LeadManagement/ActiveLeads_WorkList.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/CRM/ActiveLeads.aspx*
// @match        *://*.coxautoinc.com/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/vinsolutions-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/vinsolutions-angel.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SCRIPT_NAME = "VinSolutions - Github Version";
    const SCRIPT_VERSION = typeof GM_info !== "undefined" ? GM_info.script.version : "unknown";

// Mostrar notificación si se actualiza el script
function notifyOnUpdate() {
    const storageKey = `${SCRIPT_NAME}-LastVersion`;
    const lastVersion = localStorage.getItem(storageKey);

    if (lastVersion !== SCRIPT_VERSION) {
        if (lastVersion !== null) {
            showToast(`✅ ${SCRIPT_NAME} actualizado a la versión ${SCRIPT_VERSION}<br>
            📌 Se mejoró el botón de copiado con ícono SVG.`);
        }
        localStorage.setItem(storageKey, SCRIPT_VERSION);
    }
}

// Muestra un pequeño mensaje en la esquina
function showToast(html) {
    const toast = document.createElement('div');
    toast.innerHTML = html;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        background: '#323232',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        zIndex: 9999,
        fontSize: '14px',
        maxWidth: '300px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        lineHeight: '1.4',
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

notifyOnUpdate(); // Ejecuta la detección de versión


    const SCRIPT_PREFIX = "VinSolutions Script";
    const currentPath = window.location.pathname;
    console.log(`${SCRIPT_PREFIX}: Script INICIANDO en -> ${window.location.href}`);

    // Estilos
    GM_addStyle(`
        .copy-icon-vs-unified { cursor: pointer; margin-left: 6px; font-size: 0.85em; display: inline-block; user-select: none; vertical-align: middle; }
        .copy-icon-vs-unified svg { vertical-align: middle; }
        .copy-icon-vs-unified:hover { opacity: 0.7; }
        div#CustomerData h4 {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .resaltado-clave-vinsol { background-color: #FFD700; color: #B22222; font-weight: bold; padding: 1px 3px; border-radius: 3px; }
        .resaltado-nombre-vinsol { background-color: #58b96f; color: #f7fdf9; font-weight: bold; padding: 1px 3px; border-radius: 3px; }
    `);

    // -------------------------------------------------------------------------------------
    // BLOQUE PRINCIPAL
    // -------------------------------------------------------------------------------------
    if (
        currentPath.includes('/CarDashboard/Pages/CRM/SoldLog.aspx') ||
        currentPath.includes('/CarDashboard/Pages/LeadManagement/ActiveLeads_WorkList.aspx') ||
        currentPath.includes('/CarDashboard/Pages/CRM/ActiveLeads.aspx')
    ) {
        const LEFT_PANEL_VIEW_ITEM_LINK_CLASS = 'viewitemlink';
        const LEFT_PANEL_ID_EXTRACTION_REGEX = /top\.viewItemGCID\((\d+),\s*(\d+)\)/;

        function handleCustomerLinkClick_LeftPanel(event) {
            const linkElement = event.currentTarget;
            const href = linkElement.getAttribute('href');
            if (href) {
                const match = href.match(LEFT_PANEL_ID_EXTRACTION_REGEX);
                if (match && match[1] && match[2]) {
                    const globalCustomerID = match[1];
                    const autoLeadID = match[2];
                    const logCallUrl = `/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx?AutoLeadID=${autoLeadID}&GlobalCustomerID=${globalCustomerID}&V2Redirect=2`;
                    try {
                        if (typeof top.OpenWindow === 'function') top.OpenWindow(logCallUrl, 'LogCallEdit');
                        else window.open(logCallUrl, 'LogCallEdit', 'width=800,height=650,resizable=yes,scrollbars=yes');
                    } catch (e) {
                        window.open(logCallUrl, 'LogCallEdit', 'width=800,height=650,resizable=yes,scrollbars=yes');
                    }
                }
            }
        }

        function attachListenersToLinks_LeftPanel() {
            document.querySelectorAll(`a.${LEFT_PANEL_VIEW_ITEM_LINK_CLASS}`).forEach(link => {
                if (!link.dataset.logCallListenerAttachedPanel) {
                    link.addEventListener('click', handleCustomerLinkClick_LeftPanel);
                    link.dataset.logCallListenerAttachedPanel = 'true';
                }
            });
        }

        const observer = new MutationObserver(() => {
            clearTimeout(window.leftPanelDebounce);
            window.leftPanelDebounce = setTimeout(attachListenersToLinks_LeftPanel, 500);
        });
        observer.observe(document.body, { childList: true, subtree: true });
        attachListenersToLinks_LeftPanel();
    }

    // -------------------------------------------------------------------------------------
    // BLOQUE POPUP: Copiado + Resaltado
    // -------------------------------------------------------------------------------------
    else if (currentPath.includes('/CarDashboard/Pages/LeadManagement/LogCallV2/LogCallV2.aspx')) {

        const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade','S2S'];
        const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');
        const nombresClave = ['JAY', 'KIARA', 'CHLOE B', 'BECCA', 'JAZ', 'JJ', 'CHRIS', 'NEA', 'DANI', 'JT', 'KALY', 'DRI', 'MARK A', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY', "Neariah" , "Chrissy", "MARIAH", "GAB"];
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
            const customerDataContainer = document.getElementById('CustomerData');
            if (customerDataContainer) {
                const nameElement = customerDataContainer.querySelector('h4[data-bind="text: fullName"]');
                if (nameElement) {
                    const customerName = nameElement.textContent.trim();
                    if (customerName && customerName.toLowerCase() !== "name unknown") addCopyIcon(nameElement, customerName);
                }
                customerDataContainer.querySelectorAll('span[data-bind*="maskPhoneNumber"]').forEach(span => {
                    const phoneNumber = span.textContent.trim();
                    if (phoneNumber) addCopyIcon(span, phoneNumber);
                });
            }

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
        console.log(`${SCRIPT_PREFIX} [Popup]: Observador unificado iniciado.`);
    }
})();
