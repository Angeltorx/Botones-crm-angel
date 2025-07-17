// ==UserScript==
// @name         Drive Centric - Github Version
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Añade botones de copia, resalta palabras clave (amarillo) y nombres de usuario (verde). NUEVO: Botones de copia en tabla filtrada.
// @author       Angel Torres
// @match        https://app.drivecentric.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=drivecentric.com
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/driveCentric-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/driveCentric-angel.user.js
// ==/UserScript==

(function () {
    'use strict';

    const SCRIPT_NAME = 'Drive Centric';
    const SCRIPT_VERSION = typeof GM_info !== "undefined" ? GM_info.script.version : "unknown";
    const SCRIPT_DATE = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

(function notifyOnUpdate() {
    const storageKey = `${SCRIPT_NAME}-LastVersion`;
    const lastVersion = localStorage.getItem(storageKey);

    if (lastVersion !== SCRIPT_VERSION) {
        if (lastVersion !== null) {
            showToast(`✅ ${SCRIPT_NAME} Updated to Version ${SCRIPT_VERSION}<br>
            📌📌${SCRIPT_DATE}📌📌`);
        }
        localStorage.setItem(storageKey, SCRIPT_VERSION);
    }
})();

function showToast(message) {
    const toast = document.createElement('div');
    toast.innerHTML = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #222;
        color: #fff;
        padding: 12px 16px;
        font-size: 14px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.4s ease-in-out;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

    console.log("SCRIPT UNIVERSAL v5 PARA DRIVE CENTRIC INICIADO");

    // =========================================================================
    // --- CONFIGURACIÓN Y ESTILOS ---
    // =========================================================================
    const buttonIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4 a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

    const successIcon = `<span style="color:green; font-weight:bold;">✔</span>`;
    const copyButtonClass = 'copy-data-btn-drc';
    const copyButtonMarker = 'hasCopyButton';

    // --- Listado de Palabras Clave ---
    const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade','S2S'];
    const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');

    // --- NUEVO: Listado de Nombres de Usuario ---
    const nombresClave = ['JAY', 'KIARA', 'CHLOE B', 'BECCA', 'JAZ', 'CHRIS', 'NEA', 'DANI', 'KALY', 'JT', 'MARK A', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY', "Neariah" , "Chrissy", "MARIAH", "GAB"];
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
        /* NUEVO: Estilos para botones de copia en tabla filtrada */
        .copy-table-btn-drc {
            cursor: pointer;
            margin-left: 5px;
            padding: 2px 4px;
            display: inline-flex;
            align-items: center;
            user-select: none;
            transition: all 0.2s;
        }
        .copy-table-btn-drc:hover {
            transform: scale(1.1);
        }
        .copy-table-btn-drc svg {
            stroke: #007bff;
        }
        .copy-table-btn-drc:hover svg {
            stroke: #0056b3;
        }
        .copy-table-btn-drc.copied svg {
            stroke: #28a745;
        }
        .table-phone-container {
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }
    `);

    // =========================================================================
    // --- FUNCIONES ORIGINALES (SIN CAMBIOS) ---
    // =========================================================================

    function addCopyButton(targetElement, textToCopy, label) {
        if (!targetElement || targetElement.dataset[copyButtonMarker]) return;
        targetElement.dataset[copyButtonMarker] = 'true';

        const btn = document.createElement('span');
        btn.className = copyButtonClass;
        btn.innerHTML = buttonIcon;
        btn.title = `Copiar ${label}: ${textToCopy}`;

        btn.addEventListener('click', (e) => {
            e.stopPropagation(); e.preventDefault();
            navigator.clipboard.writeText(textToCopy).then(() => {
                btn.innerHTML = successIcon;
                setTimeout(() => { btn.innerHTML = buttonIcon; }, 1500);
            }).catch(err => {
                try {
                    GM_setClipboard(textToCopy, 'text');
                    btn.innerHTML = successIcon;
                    setTimeout(() => { btn.innerHTML = buttonIcon; }, 1500);
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
    // --- NUEVA FUNCIONALIDAD: BOTONES DE COPIA EN TABLA FILTRADA ---
    // =========================================================================

    function addTableCopyButton(cellElement, textToCopy, type) {
        // Verificar si ya tiene botón de copia
        if (cellElement.querySelector('.copy-table-btn-drc')) return;

        const cellText = textToCopy.trim();

        // Solo añadir botón si hay contenido válido
        if (cellText && cellText !== 'N/A' && cellText !== 'Unknown' && cellText.length > 2) {
            // Crear contenedor
            const container = document.createElement('span');
            container.className = 'table-phone-container';

            // Mover el texto original al contenedor
            container.innerHTML = cellText;

            // Crear botón de copia usando el mismo icono SVG
            const copyBtn = document.createElement('span');
            copyBtn.className = 'copy-table-btn-drc';
            copyBtn.innerHTML = buttonIcon; // Usando el mismo icono SVG
            copyBtn.title = `Copiar ${type}: ${cellText}`;

            copyBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();

                navigator.clipboard.writeText(cellText).then(() => {
                    copyBtn.innerHTML = successIcon;
                    copyBtn.classList.add('copied');
                    setTimeout(() => {
                        copyBtn.innerHTML = buttonIcon;
                        copyBtn.classList.remove('copied');
                    }, 1500);
                }).catch(err => {
                    try {
                        GM_setClipboard(cellText, 'text');
                        copyBtn.innerHTML = successIcon;
                        copyBtn.classList.add('copied');
                        setTimeout(() => {
                            copyBtn.innerHTML = buttonIcon;
                            copyBtn.classList.remove('copied');
                        }, 1500);
                    } catch (gm_err) {
                        console.error('Error al copiar:', gm_err);
                    }
                });
            });

            container.appendChild(copyBtn);

            // Reemplazar el contenido original
            cellElement.innerHTML = '';
            cellElement.appendChild(container);
        }
    }

    function addCopyButtonsToFilteredTable() {
        // Buscar específicamente las celdas de teléfono en la tabla de DriveCentric
        const phoneCells = document.querySelectorAll('td.mat-column-customerCellPhone span, td.mat-column-customerHomePhone span, td.mat-column-customerPhone span');

        phoneCells.forEach(span => {
            const phoneText = span.textContent.trim();

            // Solo procesar si contiene un número válido y no es "Unknown"
            if (phoneText &&
                phoneText !== 'Unknown' &&
                phoneText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)) {

                // Buscar el td padre para añadir el botón
                const parentCell = span.closest('td');
                if (parentCell) {
                    addTableCopyButton(parentCell, phoneText, 'Teléfono');
                }
            }
        });

        // También buscar nombres de clientes en la tabla
        const nameCells = document.querySelectorAll('drc-person-column .person-column__full-name');
        nameCells.forEach(nameElement => {
            const nameText = nameElement.textContent.trim();
            if (nameText && nameText.length > 2) {
                const parentCell = nameElement.closest('td');
                if (parentCell) {
                    addTableCopyButton(parentCell, nameText, 'Nombre');
                }
            }
        });
    }

    // =========================================================================
    // --- OBSERVADOR UNIFICADO Y EJECUCIÓN (ACTUALIZADO) ---
    // =========================================================================
    function processPage() {
        addCopyButtons();
        highlightKeywords();
        highlightUserNames();
        addCopyButtonsToFilteredTable(); // NUEVA FUNCIÓN AÑADIDA
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
