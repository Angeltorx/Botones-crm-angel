// ==UserScript==
// @name         ELead V18 -Angel - (Buttons)
// @namespace    http://tampermonkey.net/
// @version      V18
// @description  Combina botones de copiado (v11) con expansión del historial (v17).
// @author       Jesus Is lord
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/OpptyDetails.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/OpptyDetails.aspx*
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eleadcrm.com
// @icon         https://cdn-icons-png.flaticon.com/512/3596/3596271.png
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://github.com/Angeltorx/Botones-crm-angel/main/eleads-botones-angel.user.js
// @downloadURL  https://github.com/Angeltorx/Botones-crm-angel/main/eleads-botones-angel.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log("SCRIPT INICIADO v18 (Botones + Historial)");

    // --- Configuration ---
    const buttonIcon = '⧉';
    const successIcon = '✔';
    const copyButtonClass = 'copy-data-btn';
    const copyButtonMarker = 'hasCopyButton';
    let initialRunComplete = false;

    const dataFields = [
        {
            label: 'Nombre',
            selector: '#CustomerInfoPanel_NameLink',
            extractFunc: (baseElement) => {
                const dataCell = baseElement.parentElement?.nextElementSibling;
                if (!dataCell) return null;
                for (let node of dataCell.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
                        return node.textContent.trim();
                    }
                }
                return null;
            }
        },
        { label: 'Teléfono Casa', selector: '#CustomerInfoPanel_HPhoneLink' },
        { label: 'Teléfono Celular', selector: '#CustomerInfoPanel_CPhoneLink' },
        { label: 'Teléfono Trabajo', selector: '#CustomerInfoPanel_WPhoneLink' }
    ];

    try {
        GM_addStyle(`
            .${copyButtonClass} { cursor: pointer; margin-left: 5px; display: inline-block; font-size: 0.9em; user-select: none; vertical-align: middle; }
            .${copyButtonClass}:hover { opacity: 0.7; }
            #CustomerInfoPanel_NameLink + td, #CustomerInfoPanel_HPhoneLink + td,
            #CustomerInfoPanel_CPhoneLink + td, #CustomerInfoPanel_WPhoneLink + td { position: relative; }
        `);
    } catch (e) { console.error("SCRIPT ERROR: Fallo GM_addStyle.", e); }

    function addCopyButton(targetElement, textToCopy, label) {
        const markerElement = (targetElement?.nodeType === Node.ELEMENT_NODE ? targetElement : targetElement?.parentElement);
        if (!markerElement || markerElement.dataset[copyButtonMarker] === 'true') return false;

        const btn = document.createElement('span');
        btn.className = copyButtonClass;
        btn.textContent = buttonIcon;
        btn.title = `Copiar ${label}: ${textToCopy}`;
        btn.style.fontSize = 'inherit';
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            try {
                GM_setClipboard(textToCopy, 'text');
                btn.textContent = successIcon;
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = buttonIcon;
                    btn.classList.remove('copied');
                }, 1500);
            } catch (err) {
                console.error(`SCRIPT ERROR: Fallo GM_setClipboard para [${label}].`, err);
                alert(`Error al copiar ${label}. Revisa la consola (F12).`);
            }
        });
        try {
            targetElement.parentNode.insertBefore(btn, targetElement.nextSibling);
            markerElement.dataset[copyButtonMarker] = 'true';
            return true;
        } catch (error) {
            console.error(`SCRIPT ERROR: Error al insertar botón para [${label}]`, error, targetElement);
            return false;
        }
    }

    function clearPreviousButtons(container) {
        container.querySelectorAll(`.${copyButtonClass}`).forEach(btn => btn.remove());
        container.querySelectorAll(`[data-${copyButtonMarker}]`).forEach(el => delete el.dataset[copyButtonMarker]);
    }

    function processDataFields() {
        const container = document.getElementById('pnlCustomerInformation');
        if (!container) return;

        if (!initialRunComplete) {
            clearPreviousButtons(container);
            initialRunComplete = true;
        }

        dataFields.forEach(field => {
            const baseElement = container.querySelector(field.selector);
            if (!baseElement) return;

            const dataCell = baseElement.parentElement?.nextElementSibling;
            if (!dataCell) return;

            if (field.label === 'Nombre') {
                const textToCopy = field.extractFunc(baseElement);
                let displayElement = Array.from(dataCell.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === textToCopy) || dataCell;
                if (textToCopy && addCopyButton(displayElement, textToCopy, field.label)) {}
            } else {
                const phoneRows = dataCell.querySelectorAll('table tr');
                if (phoneRows.length > 0) {
                    phoneRows.forEach(row => {
                        if (row.style.display !== 'none') {
                            const phoneLink = row.querySelector('td:first-child a');
                            const tableCell = row.querySelector('td:first-child');
                            const numberElement = phoneLink || tableCell;
                            const textToCopy = numberElement?.textContent?.trim();
                            if (textToCopy) addCopyButton(numberElement, textToCopy, field.label);
                        }
                    });
                } else {
                    const numberElement = dataCell.querySelector('a') || dataCell;
                    const textToCopy = numberElement?.textContent?.trim();
                    if (textToCopy) addCopyButton(numberElement, textToCopy, field.label);
                }
            }
        });
    }

    function runProcessor() {
        if (window.processingRun) return;
        window.processingRun = true;
        try { processDataFields(); } catch (e) { console.error("SCRIPT ERROR", e); } finally { window.processingRun = false; }
    }

    const targetNode = document.getElementById('pnlCustomerInformation');
    if (window.location.href.includes('OpptyDetails.aspx') && targetNode) {
        const config = { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] };
        const observer = new MutationObserver((mutationsList) => {
            if (mutationsList.some(m => m.type === 'childList' || m.attributeName === 'style')) {
                clearTimeout(window.copyDebounce);
                window.copyDebounce = setTimeout(runProcessor, 300);
            }
        });
        observer.observe(targetNode, config);
        setTimeout(runProcessor, 500);
    }

    // --- EXPANSIÓN DE HISTORIAL ---
    function processHistoryFrame() {
        const doc = document;
        const headerRows = doc.querySelectorAll("table#gvOpptyHistory tr.PageHeaderContacts:not([data-processed='true'])");
        headerRows.forEach(headerRow => {
            headerRow.dataset.processed = 'true';
            const triggerCell = headerRow.querySelector("td[onclick*='swapDiv']");
            const contentRow = headerRow.nextElementSibling;
            const contentContainer = contentRow?.querySelector("td[id^='div_']");
            const isCollapsed = contentContainer && window.getComputedStyle(contentContainer).display === 'none';
            if (isCollapsed && triggerCell) triggerCell.click();
        });

        doc.querySelectorAll("td.activityHeader a[onclick*='Click2Call']").forEach(phoneLink => {
            if (phoneLink.offsetParent !== null) {
                const textToCopy = phoneLink.textContent?.trim();
                if (textToCopy) addCopyButton(phoneLink, textToCopy, 'Teléfono');
            }
        });
    }

    if (window.location.href.includes('history.aspx')) {
        const targetNode = document.getElementById('HistoryTable');
        if (targetNode) {
            const observer = new MutationObserver(() => {
                clearTimeout(window.historyObserverDebounce);
                window.historyObserverDebounce = setTimeout(processHistoryFrame, 300);
            });
            observer.observe(targetNode, { childList: true, subtree: true });
            setTimeout(processHistoryFrame, 500);
        } else {
            setTimeout(processHistoryFrame, 3000);
        }
    }
})();
