// ==UserScript==
// @name         ELead V02 -Angel (Keywords + Resaltado Dual)
// @namespace    http://tampermonkey.net/
// @version      V02
// @description  Resalta palabras claves, nombres en verde, y fechas mayores a 2 meses en historial ELead.
// @author       Angel Torres
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eleadcrm.com
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';
    console.log("SCRIPT DE RESALTADO ACTIVADO");

    const palabrasClave = ['option', 'options', 'xchange', 'exchange', 'pitch', 'program', 'offer', 'showroom', 'interested', 'interest', 'trade'];
    const nombresVerdes = ['JAY', 'KIARA', 'CHLOE B', 'BECCA', 'JAZ', 'JJ', 'CHRIS', 'NEA', 'DANI', 'MARK A', 'ANIKA', 'JESS', 'CHLOE', 'JUAN', 'JEFF', 'DARIA', 'GABBY', "Neariah" , "Chrissy", "MARIAH", "GAB"];

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
