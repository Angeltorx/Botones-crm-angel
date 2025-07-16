// ==UserScript==
// @name         ELead -Resaltado -Github Version
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Resalta palabras claves, nombres en verde, y fechas mayores a 2 meses en historial ELead.
// @author       Angel Torres
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eleadcrm.com
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-resaltado-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-resaltado-angel.user.js
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
            📌📌📌📌${SCRIPT_DATE}📌📌📌📌`);
        }
        localStorage.setItem(storageKey, SCRIPT_VERSION);
    }
})();

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


    console.log("SCRIPT DE RESALTADO ACTIVADO");

    const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade','S2S'];
    const nombresVerdes = ['JAY', 'KIARA', 'CJ', 'CHLOE B', 'BECCA', 'JAZ', 'JJ', 'CHRIS', 'NEA', 'DANI', 'JT', 'MARK A', 'KALY', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY', "Neariah" , "Chrissy", "MARIAH", "GAB"];

    const regexPalabras = new RegExp(`\\b(${palabrasClave.join('|')})\\b`, 'gi');
    const regexVerdes = new RegExp(`\\b(${nombresVerdes.map(n => n.replace('.', '\\.')).join('|')})\\b`, 'gi');

    // Estilos para resaltado
    try {
        GM_addStyle(`
            .resaltado-clave {
                background-color: yellow;
                color: red;
                font-weight: bold;
                padding: 0 2px;
                border-radius: 3px;
            }
            .resaltado-verde {
                background-color: #58b96f;
                color: #f7fdf9;
                font-weight: bold;
                padding: 0 2px;
                border-radius: 3px;
            }
            .resaltado-fecha {
                background-color: #ffeeba !important;
                border: 1px solid #e0a800 !important;
            }
        `);
    } catch (e) {
        console.error("SCRIPT ERROR: Fallo GM_addStyle", e);
    }

    function resaltarPalabrasEnComentarios() {
        const comentarios = document.querySelectorAll("td.TaskComments > div");

        comentarios.forEach(div => {
            if (!div.dataset.resaltado) {
                let nuevoHTML = div.innerHTML;

                nuevoHTML = nuevoHTML.replace(regexPalabras, match =>
                    `<span class="resaltado-clave">${match}</span>`
                );

                nuevoHTML = nuevoHTML.replace(regexVerdes, match =>
                    `<span class="resaltado-verde">${match}</span>`
                );

                if (nuevoHTML !== div.innerHTML) {
                    div.innerHTML = nuevoHTML;
                }

                div.dataset.resaltado = "true"; // Para evitar aplicar varias veces
            }
        });
    }


    function iniciarObservador() {
        const tablaHistorial = document.getElementById("HistoryTable");
        if (!tablaHistorial) {
            console.warn("SCRIPT: No se encontró #HistoryTable. Se intentará de nuevo...");
            setTimeout(iniciarObservador, 1000);
            return;
        }

        const observer = new MutationObserver(() => {
            clearTimeout(window.resaltadoDebounce);
            window.resaltadoDebounce = setTimeout(() => {
                resaltarPalabrasEnComentarios();
            }, 300);
        });

        observer.observe(tablaHistorial, { childList: true, subtree: true });
        setTimeout(() => {
            resaltarPalabrasEnComentarios();
        }, 500);
    }

    if (window.location.href.includes('history.aspx')) {
        iniciarObservador();
    }
})();
