// ==UserScript==
// @name         Drive Centric v05 - Github
// @namespace    http://tampermonkey.net/
// @version      V05
// @description  Añade botones de copia, resalta palabras clave (amarillo) y nombres de usuario (verde).
// @author       Angel Torres
// @match        https://app.drivecentric.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=drivecentric.com
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://github.com/Angeltorx/Botones-crm-angel/main/driveCentric-angel.user.js
// @downloadURL  https://github.com/Angeltorx/Botones-crm-angel/main/driveCentric-angel.user.js
// ==/UserScript==

(function() {
    'use strict';
    console.log("SCRIPT UNIVERSAL v5 (Resaltado Dual) PARA DRIVE CENTRIC INICIADO");

    // =========================================================================
    // --- CONFIGURACIÓN Y ESTILOS ---
    // =========================================================================
    const buttonIcon = '📋';
    const successIcon = '✅';
    const copyButtonClass = 'copy-data-btn-drc';
    const copyButtonMarker = 'hasCopyButton';

    // --- Listado de Palabras Clave ---
    const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade'];
    const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');

    // --- NUEVO: Listado de Nombres de Usuario ---
    const nombresClave = ['JAY', 'KIARA', 'CHLOE B', 'BECCA', 'JAZ', 'CHRIS', 'NEA', 'DANI', 'MARK A', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY'];
    // Ordenar de más largo a más corto para que "CHLOE B" coincida antes que "CHLOE"
    nombresClave.sort((a, b) => b.length - a.length);
    const regexNombres = new RegExp(`(${nombresClave.join('|')})`, 'gi');


    GM_addStyle(`
        .${copyButtonClass} { cursor: pointer; margin-left: 8px; display: inline-flex; align-items: center; user-select: none; transition: transform 0.2s; }
        .${copyButtonClass}:hover { transform: scale(1.2); }
        .card-customer__name, .card-customer__item-content, .cust-name, .phone-detail { display: inline-flex; align-items: center; }
        /* Resaltado para palabras clave */
        .resaltado-clave-drc { background-color: yellow !important; color: red !important; font-weight: bold !important; padding: 1px 3px; border-radius: 3px; }
        /* NUEVO: Resaltado para nombres de usuario */
        .resaltado-nombre-drc {
            background-color: #58b96f !important;
            color: #f7fdf9 !important;
            font-weight: bold !important;
            padding: 1px 3px;
            border-radius: 3px;
        }
    `);

    // =========================================================================
    // --- FUNCIONES ---
    // =========================================================================

    function addCopyButton(targetElement, textToCopy, label) {
        if (!targetElement || targetElement.dataset[copyButtonMarker]) return;
        targetElement.dataset[copyButtonMarker] = 'true';

        const btn = document.createElement('span');
        btn.className = copyButtonClass;
        btn.textContent = buttonIcon;
        btn.title = `Copiar ${label}: ${textToCopy}`;

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            navigator.clipboard.writeText(textToCopy).then(() => {
                btn.textContent = successIcon;
                setTimeout(() => { btn.textContent = buttonIcon; }, 1500);
            }).catch(err => {
                try {
                    GM_setClipboard(textToCopy, 'text');
                    btn.textContent = successIcon;
                    setTimeout(() => { btn.textContent = buttonIcon; }, 1500);
                } catch (gm_err) {
                    console.error('Fallo al copiar con API Nativa y con GM_setClipboard.', gm_err);
                    alert(`No se pudo copiar al portapapeles.`);
                }
            });
        });
        targetElement.appendChild(btn);
    }

    function addCopyButtons() {
        // --- Búsqueda en la tarjeta de cliente principal ---
        document.querySelectorAll('drc-card-customer').forEach(card => {
            const nameElement = card.querySelector('p.card-customer__name');
            if (nameElement) addCopyButton(nameElement, nameElement.textContent.trim(), 'Nombre');

            card.querySelectorAll('.card-customer__item').forEach(item => {
                if (item.querySelector('.fa-phone')) {
                    const valueElement = item.querySelector('.card-customer__item-content');
                    if (valueElement) {
                        const textToCopy = valueElement.textContent.trim().replace(/edit/i, '').trim();
                        if (textToCopy) addCopyButton(valueElement, textToCopy, 'Teléfono');
                    }
                }
            });
        });

        // --- Búsqueda alternativa en el encabezado del "Deal" ---
        document.querySelectorAll('drc-deal-card-header').forEach(header => {
            const nameEl = header.querySelector('.cust-name');
            if (nameEl) addCopyButton(nameEl, nameEl.textContent.trim(), 'Nombre');
            const phoneEl = header.querySelector('.phone-detail');
            if (phoneEl) addCopyButton(phoneEl, phoneEl.textContent.trim(), 'Teléfono');
        });
    }

    // Función de resaltado para palabras clave
    function highlightKeywords() {
        document.querySelectorAll('drc-timeline div.cmp-tml-bd').forEach(elem => {
            if (elem.dataset.resaltadoClave) return;
            const originalHTML = elem.innerHTML;
            if (!originalHTML.includes('<span class="resaltado-clave-drc">')) {
                const nuevoHTML = originalHTML.replace(regexPalabras, match => `<span class="resaltado-clave-drc">${match}</span>`);
                if (nuevoHTML !== originalHTML) elem.innerHTML = nuevoHTML;
            }
            elem.dataset.resaltadoClave = "true";
        });
    }

    // --- NUEVO: Función de resaltado para nombres de usuario ---
    function highlightUserNames() {
        document.querySelectorAll('drc-timeline div.cmp-tml-bd').forEach(elem => {
            if (elem.dataset.resaltadoNombre) return;
            const originalHTML = elem.innerHTML;
            // Se comprueba que no tenga ya la clase para no interferir con el resaltado anterior
             if (!originalHTML.includes('<span class="resaltado-nombre-drc">')) {
                const nuevoHTML = originalHTML.replace(regexNombres, match => `<span class="resaltado-nombre-drc">${match}</span>`);
                if (nuevoHTML !== originalHTML) elem.innerHTML = nuevoHTML;
            }
            elem.dataset.resaltadoNombre = "true";
        });
    }


    // =========================================================================
    // --- OBSERVADOR UNIFICADO Y EJECUCIÓN ---
    // =========================================================================
    function processPage() {
        addCopyButtons();
        highlightKeywords();
        highlightUserNames(); // Se añade la nueva función al proceso
    }

    let debounceTimeout;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(processPage, 750);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(processPage, 1500);

})();