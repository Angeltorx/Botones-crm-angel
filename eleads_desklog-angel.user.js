// ==UserScript==
// @name         ELead -Desklog Resaltado
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Resalta elementos "sold" en la página de desklog y selecciona automáticamente Status
// @author       Angel Torres
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/reports/Desklog/desklog.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/reports/Desklog/desklog.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eleadcrm.com
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-resaltado-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-resaltado-angel.user.js
// ==/UserScript==

(function () {
    'use strict';

    console.log("🚀 ELead Desklog Script: Iniciando en desklog.aspx");

    // --- CONFIGURACIÓN ESPECÍFICA PARA DESKLOG ---
    const SELECTORES_DESKLOG = {
        dropdownLabel: 'label[data-testid="base-menu-input23"]',
        dropdownInput: '#single-select-dropdown-DesklogTable',
        dropdownContainer: '[data-testid="single-select-dropdown-DesklogTable"]',
        inputField: '[data-testid="menu-input23-input-field"]',
        menuOptions: '[role="option"], [role="menuitem"], li[data-value]'
    };

    // Regex para elementos "sold"
    const regexSoldGlobal = /\b(?:crm\s+sold|dms\s+sold|pre-sold|spot\s+sold|delivered\s+sold|sold\s+deposit|sold)\b/ig;

    // --- ESTILOS ---
    GM_addStyle(`
        /* Resaltado exacto como Ctrl+F */
        .desklog-sold-highlight {
            background-color: #ffff00 !important;
            color: #000000 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
        }
        
        /* Fila completa resaltada */
        .desklog-sold-row {
            background-color: #fff8e1 !important;
            border-left: 4px solid #ffc107 !important;
        }
        
        /* Indicador de estado específico para desklog */
        .desklog-status-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #28a745;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 10000;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .desklog-status-indicator.working {
            background: #ffc107;
            color: #000;
        }
        
        .desklog-status-indicator.error {
            background: #dc3545;
        }
        
        /* Botón manual para desklog */
        .desklog-manual-btn {
            position: fixed;
            top: 50px;
            right: 10px;
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 10000;
            font-size: 12px;
        }
        .desklog-manual-btn:hover {
            background: #0056b3;
        }
    `);

    let dropdownClickeado = false;
    let statusSeleccionado = false;

    // --- FUNCIONES ---

    function mostrarIndicadorDesklog(texto, tipo = 'success') {
        let indicador = document.querySelector('.desklog-status-indicator');
        if (indicador) indicador.remove();

        indicador = document.createElement('div');
        indicador.className = `desklog-status-indicator ${tipo}`;
        indicador.textContent = texto;
        document.body.appendChild(indicador);
        
        setTimeout(() => {
            if (indicador && indicador.parentNode) {
                indicador.remove();
            }
        }, 6000);
    }

    function showToastDesklog(mensaje) {
        const toast = document.createElement('div');
        toast.innerHTML = mensaje;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '16px', right: '16px', background: '#323232', color: '#fff',
            padding: '8px 12px', borderRadius: '4px', zIndex: 9999, fontSize: '12px',
            maxWidth: '300px', boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // Simulación de eventos de mouse humanos
    function simularClickHumano(elemento, tipo) {
        const rect = elemento.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const evento = new MouseEvent(tipo, {
            bubbles: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            screenX: x + window.screenX,
            screenY: y + window.screenY,
            button: 0,
            buttons: tipo === 'mousedown' ? 1 : 0,
            detail: tipo === 'click' ? 1 : 0
        });

        elemento.dispatchEvent(evento);
        console.log(`🖱️ Evento ${tipo} disparado en:`, elemento);
    }

    // Función principal para hacer clic en el dropdown del desklog
    function clickearDropdownDesklog() {
        if (dropdownClickeado) return;

        console.log("🔄 Buscando dropdown en desklog...");
        mostrarIndicadorDesklog("🔄 Buscando dropdown...", "working");

        // Método 1: Click en el label
        const dropdownLabel = document.querySelector(SELECTORES_DESKLOG.dropdownLabel);
        if (dropdownLabel) {
            console.log("✅ Label del dropdown encontrado en desklog");
            mostrarIndicadorDesklog("🖱️ Haciendo clic en label...", "working");
            
            // Secuencia de clic humano
            simularClickHumano(dropdownLabel, 'mousedown');
            setTimeout(() => {
                simularClickHumano(dropdownLabel, 'mouseup');
                setTimeout(() => {
                    simularClickHumano(dropdownLabel, 'click');
                }, 100);
            }, 100);

            dropdownClickeado = true;
            setTimeout(buscarOpcionStatus, 1000);
            return;
        }

        // Método 2: Click en el input field
        const inputField = document.querySelector(SELECTORES_DESKLOG.inputField);
        if (inputField) {
            console.log("✅ Input field encontrado en desklog");
            mostrarIndicadorDesklog("🖱️ Clic en input...", "working");
            
            inputField.focus();
            simularClickHumano(inputField, 'click');
            
            dropdownClickeado = true;
            setTimeout(buscarOpcionStatus, 1000);
            return;
        }

        // Método 3: Click directo en el container
        const container = document.querySelector(SELECTORES_DESKLOG.dropdownContainer);
        if (container) {
            console.log("✅ Container encontrado en desklog");
            mostrarIndicadorDesklog("🖱️ Clic en container...", "working");
            
            simularClickHumano(container, 'click');
            
            dropdownClickeado = true;
            setTimeout(buscarOpcionStatus, 1000);
            return;
        }

        console.log("❌ Dropdown no encontrado en desklog");
        mostrarIndicadorDesklog("❌ Dropdown no encontrado", "error");
    }

    // Buscar y seleccionar la opción "Status"
    function buscarOpcionStatus() {
        console.log("🔍 Buscando opción Status en desklog...");
        
        // Buscar opciones del menú
        const opciones = document.querySelectorAll(`
            ${SELECTORES_DESKLOG.menuOptions},
            div[role="button"],
            span[role="button"],
            .menu-item,
            .dropdown-item,
            li,
            div[data-value]
        `);
        
        console.log(`📋 Encontradas ${opciones.length} opciones en desklog`);

        if (opciones.length > 0) {
            opciones.forEach((opcion, index) => {
                const texto = opcion.textContent.trim().toLowerCase();
                console.log(`Opción ${index}: "${texto}"`);
                
                if (texto.includes('status') && !statusSeleccionado) {
                    console.log("✅ Opción Status encontrada en desklog!");
                    simularClickHumano(opcion, 'click');
                    statusSeleccionado = true;
                    mostrarIndicadorDesklog("✅ Status seleccionado!", "success");
                    
                    setTimeout(buscarSoldEnDesklog, 2500);
                    return;
                }
            });
        }

        // Si no se encontró, buscar más ampliamente
        if (!statusSeleccionado) {
            const todosLosElementos = document.querySelectorAll('*');
            todosLosElementos.forEach(elemento => {
                const texto = elemento.textContent?.trim().toLowerCase();
                if (texto === 'status' && elemento.offsetParent !== null) {
                    console.log("✅ Status encontrado en búsqueda amplia!");
                    simularClickHumano(elemento, 'click');
                    statusSeleccionado = true;
                    mostrarIndicadorDesklog("✅ Status seleccionado!", "success");
                    setTimeout(buscarSoldEnDesklog, 2500);
                    return;
                }
            });
        }

        if (!statusSeleccionado) {
            console.log("❌ Opción Status no encontrada");
            mostrarIndicadorDesklog("❌ Status no encontrado", "error");
        }
    }

    // Buscar y resaltar elementos "sold" en desklog
    function buscarSoldEnDesklog() {
        console.log("🔍 Buscando elementos 'sold' en desklog...");
        
        let resultados = 0;

        // Limpiar resaltados previos
        document.querySelectorAll('.desklog-sold-highlight').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
        });
        document.querySelectorAll('.desklog-sold-row').forEach(el => {
            el.classList.remove('desklog-sold-row');
        });

        // Buscar en toda la página
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (!parent || parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' ||
                        parent.closest('.desklog-status-indicator, .desklog-manual-btn')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const nodosTexto = [];
        let nodo;
        while (nodo = walker.nextNode()) {
            nodosTexto.push(nodo);
        }

        nodosTexto.forEach(nodoTexto => {
            const texto = nodoTexto.textContent;
            if (regexSoldGlobal.test(texto)) {
                const span = document.createElement('span');
                span.innerHTML = texto.replace(regexSoldGlobal, match => {
                    resultados++;
                    return `<span class="desklog-sold-highlight">${match}</span>`;
                });
                
                nodoTexto.parentNode.replaceChild(span, nodoTexto);
                
                // Resaltar fila completa
                const fila = span.closest('tr');
                if (fila) {
                    fila.classList.add('desklog-sold-row');
                }
            }
        });

        if (resultados > 0) {
            showToastDesklog(`🎯 ${resultados} elementos "sold" encontrados en desklog`);
            mostrarIndicadorDesklog(`🎯 ${resultados} sold encontrados`, "success");
        } else {
            showToastDesklog(`ℹ️ No se encontraron elementos "sold" en desklog`);
        }
    }

    function crearBotonManualDesklog() {
        const boton = document.createElement('button');
        boton.className = 'desklog-manual-btn';
        boton.textContent = '🖱️ Click Desklog';
        boton.title = 'Hacer clic manual en dropdown de desklog';
        
        boton.addEventListener('click', () => {
            dropdownClickeado = false;
            statusSeleccionado = false;
            clickearDropdownDesklog();
        });
        
        document.body.appendChild(boton);
    }

    function iniciarObservadorDesklog() {
        const observer = new MutationObserver(() => {
            if (!dropdownClickeado && !statusSeleccionado) {
                const dropdown = document.querySelector(SELECTORES_DESKLOG.dropdownLabel);
                if (dropdown) {
                    clearTimeout(window.desklogTimeout);
                    window.desklogTimeout = setTimeout(clickearDropdownDesklog, 1500);
                }
            }
        });

        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });

        // Intentos iniciales específicos para desklog
        setTimeout(clickearDropdownDesklog, 4000);  // Primer intento
        setTimeout(() => {
            if (!statusSeleccionado) {
                dropdownClickeado = false;
                clickearDropdownDesklog();
            }
        }, 8000);  // Segundo intento
    }

    // --- EJECUCIÓN ESPECÍFICA PARA DESKLOG ---
    console.log("🚀 ELead Desklog: Script iniciado en desklog.aspx");
    
    setTimeout(() => {
        crearBotonManualDesklog();
        iniciarObservadorDesklog();
        mostrarIndicadorDesklog("🔄 Desklog cargado...", "working");
    }, 3000);

})();
