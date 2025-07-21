// ==UserScript==
// @name         ELead -Resaltado -Github Version
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Resalta palabras claves, nombres en verde, fechas mayores a 2 meses en historial ELead, y elementos "sold" tras filtrado manual.
// @author       Angel Torres
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/index.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/index.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eleadcrm.com
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-resaltado-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-resaltado-angel.user.js
// ==/UserScript==

(function () {
    'use strict';

    // --- CONFIGURACIÓN ---
    const SCRIPT_NAME = "ELead -Resaltado -Github Version";
    const SCRIPT_VERSION = typeof GM_info !== "undefined" ? GM_info.script.version : "unknown";
    const SCRIPT_DATE = new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade', 'S2S'];
    const nombresVerdes = ['JAY', 'KIARA', 'CJ', 'CHLOE B', 'BECCA', 'JAZ', 'JJ', 'CHRIS', 'NEA', 'DANI', 'JT', 'MARK A', 'KALY', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY', "Neariah", "Chrissy", "MARIAH", "GAB"];

    const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');
    const regexVerdes = new RegExp(`\\b(${nombresVerdes.map(n => n.replace('.', '\\.')).join('|')})\\b`, 'gi');
    const regexSoldGlobal = /\b(?:crm|dms|pre|spot|delivered|sold\sdeposit|sold)\b[\s-]*sold\b/ig;

    // --- ESTILOS ---
    try {
        GM_addStyle(`
            .resaltado-clave { background-color: yellow; color: red; font-weight: bold; padding: 0 2px; border-radius: 3px; }
            .resaltado-verde { background-color: #58b96f; color: #f7fdf9; font-weight: bold; padding: 0 2px; border-radius: 3px; }
            .resaltado-fecha { background-color: #ffeeba !important; border: 1px solid #e0a800 !important; }
            
            /* Estilos para elementos "sold" */
            .sold-highlight-input { 
                background-color: #ff0000ff !important; 
                border: 2px solid #155724 !important; 
                color: #155724 !important; 
                font-weight: bold !important; 
            }
            .sold-highlight-container { 
                background-color: #ff0000ff !important; 
                border: 2px solid #155724 !important; 
                border-radius: 4px !important; 
                box-shadow: 0 0 5px rgba(21, 87, 36, 0.3) !important; 
            }
            .sold-row-highlight {
                background-color: #ff0000ff !important;
                border-left: 4px solid #155724 !important;
            }
            
            /* Botón manual para activar resaltado */
            .manual-highlight-btn {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
                z-index: 10000;
                font-weight: bold;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .manual-highlight-btn:hover {
                background: #218838;
            }

            .sold-highlight-text{
            background:#d4edda!important;
            color:#155724!important;
            font-weight:bold!important;
            padding:0 2px;
            border-radius:3px;
  }
        `);
    } catch (e) { console.error("SCRIPT ERROR: Fallo GM_addStyle", e); }

    // --- FUNCIONES ---

    // Muestra un pequeño mensaje en la esquina
    function showToast(html) {
        const toast = document.createElement('div');
        toast.innerHTML = html;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '16px', right: '16px', background: '#323232', color: '#fff',
            padding: '12px 16px', borderRadius: '8px', zIndex: 9999, fontSize: '14px',
            maxWidth: '300px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', lineHeight: '1.4',
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    // Notifica si el script se ha actualizado
    function notifyOnUpdate() {
        const storageKey = `${SCRIPT_NAME}-LastVersion`;
        const lastVersion = localStorage.getItem(storageKey);

        if (lastVersion !== SCRIPT_VERSION) {
            if (lastVersion !== null) {
                showToast(`✅ ${SCRIPT_NAME} actualizado a la versión ${SCRIPT_VERSION}<br>📌📌${SCRIPT_DATE}📌📌`);
            }
            localStorage.setItem(storageKey, SCRIPT_VERSION);
        }
    }

    function resaltarPalabrasEnComentarios() {
        const comentarios = document.querySelectorAll("td.TaskComments > div");

        comentarios.forEach(div => {
            if (!div.dataset.resaltado) {
                let nuevoHTML = div.innerHTML;
                nuevoHTML = nuevoHTML
                .replace(regexPalabras, m => `<span class="resaltado-clave">${m}</span>`)
                .replace(regexVerdes,   m => `<span class="resaltado-verde">${m}</span>`)
                .replace(regexSoldGlobal, m => `<span class="sold-highlight-text">${m}</span>`);
                if (nuevoHTML !== div.innerHTML) {
                    div.innerHTML = nuevoHTML;
                }
                div.dataset.resaltado = "true";
            }
        });
    }

    // NUEVA FUNCIÓN: Resaltar elementos "sold" en la tabla filtrada
    function resaltarElementosSold() {
        let elementosResaltados = 0;

        // Buscar en inputs de dropdown con value "sold" (case insensitive)
        const inputs = document.querySelectorAll('input[name="ddlstatus"]');
        inputs.forEach(input => {
            if (input.value && input.value.toLowerCase().includes('sold') && !input.dataset.soldResaltado) {
                input.classList.add('sold-highlight-input');
                input.dataset.soldResaltado = "true";
                
                // Resaltar contenedor padre
                const container = input.closest('div[id*="reactDropdownContainerForOpptyStatus"]');
                if (container) {
                    container.classList.add('sold-highlight-container');
                }
                
                // Resaltar toda la fila de la tabla
                const tableRow = input.closest('tr');
                if (tableRow) {
                    tableRow.classList.add('sold-row-highlight');
                }
                
                elementosResaltados++;
            }
        });

        // Buscar en elementos de texto que contengan "sold"
        const textElements = document.querySelectorAll('td');
        textElements.forEach(element => {
            const text = element.textContent.trim();
            if (text.toLowerCase().includes('sold') && 
                text.length < 20 && // Solo textos cortos
                !element.dataset.soldResaltado &&
                !element.querySelector('input')) { // Evitar celdas que ya tienen inputs
                
                element.classList.add('sold-highlight-input');
                element.dataset.soldResaltado = "true";
                
                // Resaltar toda la fila de la tabla
                const tableRow = element.closest('tr');
                if (tableRow) {
                    tableRow.classList.add('sold-row-highlight');
                }
                
                elementosResaltados++;
            }
        });

        // Mostrar resultado
        if (elementosResaltados > 0) {
            showToast(`🎯 ${elementosResaltados} elementos "sold" resaltados`);
        } else {
            showToast(`ℹ️ No se encontraron elementos "sold" en la tabla actual`);
        }

        return elementosResaltados;
    }

    // NUEVA FUNCIÓN: Crear botón manual para activar resaltado
    function crearBotonManual() {
        // Verificar si ya existe el botón
        if (document.querySelector('.manual-highlight-btn')) return;

        const boton = document.createElement('button');
        boton.className = 'manual-highlight-btn';
        boton.textContent = '🔍 Resaltar SOLD';
        boton.title = 'Haz clic después de filtrar para resaltar elementos "sold"';
        
        boton.addEventListener('click', () => {
            resaltarElementosSold();
        });
        
        document.body.appendChild(boton);
    }

    // NUEVA FUNCIÓN: Observador inteligente para detectar cambios en la tabla
    function observarCambiosTabla() {
        let timeoutId;
        const observer = new MutationObserver((mutations) => {
            // Verificar si hay cambios relevantes en la tabla
            const hasTableChanges = mutations.some(mutation => {
                return Array.from(mutation.addedNodes).some(node => {
                    return node.nodeType === 1 && (
                        node.matches && node.matches('tr, td, table') ||
                        node.querySelector && node.querySelector('tr, td, table')
                    );
                });
            });

            if (hasTableChanges) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    // Auto-resaltar si hay elementos "sold" visibles
                    const soldElements = document.querySelectorAll('input[name="ddlstatus"][value*="sold" i], td[style*="display: none"]');
                    if (soldElements.length > 0) {
                        resaltarElementosSold();
                    }
                }, 2000); // Esperar 2 segundos después del último cambio
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function iniciarObservador() {
        let targetContainer = document.getElementById("HistoryTable");
        
        // Si estamos en index.aspx, usar body como contenedor
        if (window.location.href.includes('index.aspx')) {
            targetContainer = document.body;
            console.log("SCRIPT: Iniciando observador en index.aspx (página principal)");
            
            // Crear botón manual para resaltado
            setTimeout(() => {
                crearBotonManual();
                observarCambiosTabla();
            }, 1500);
            
        } else if (!targetContainer) {
            console.warn("SCRIPT: No se encontró #HistoryTable. Se intentará de nuevo...");
            setTimeout(iniciarObservador, 1000);
            return;
        } else {
            console.log("SCRIPT: #HistoryTable encontrado. Observador iniciado.");
        }

        const observer = new MutationObserver(() => {
            clearTimeout(window.resaltadoDebounce);
            window.resaltadoDebounce = setTimeout(() => {
                resaltarPalabrasEnComentarios();
                // Solo auto-resaltar "sold" en history.aspx
                if (!window.location.href.includes('index.aspx')) {
                    resaltarElementosSold();
                }
            }, 300);
        });

        observer.observe(targetContainer, { childList: true, subtree: true });
        
        // Intento inicial
        setTimeout(() => {
            resaltarPalabrasEnComentarios();
            if (!window.location.href.includes('index.aspx')) {
                resaltarElementosSold();
            }
        }, 500);
    }

    // --- EJECUCIÓN ---

    console.log("SCRIPT DE RESALTADO ACTIVADO");
    notifyOnUpdate();

    if (window.location.href.includes('history.aspx') || window.location.href.includes('index.aspx')) {
        iniciarObservador();
    }
})();
