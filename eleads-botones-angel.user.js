// ==UserScript==
// @name         ELead -Buttons - Github Version
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Combina botones de copiado (v11) con expansión del historial (v17) y auto-expansión de números ocultos mejorada.
// @author       Jesus Is lord
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/OpptyDetails.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/OpptyDetails.aspx*
// @match        https://*.eleadcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @match        https://*.forddirectcrm.com/evo2/fresh/elead-v45/elead_track/NewProspects/history.aspx*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=eleadcrm.com
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-botones-angel.user.js
// @downloadURL  https://raw.githubusercontent.com/Angeltorx/Botones-crm-angel/main/eleads-botones-angel.user.js
// ==/UserScript==

(function () {
  "use strict";
  console.log("SCRIPT INICIADO v1.2 (Botones + Historial + Auto-expansión mejorada)");

  // --- Configuration ---
  const buttonIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4 a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

  const successIcon = `<span style="color:green; font-weight:bold;">✔</span>`;

  const copyButtonClass = "copy-data-btn";
  const copyButtonMarker = "hasCopyButton";
  let initialRunComplete = false;

  const dataFields = [
    {
      label: "Nombre",
      selector: "#CustomerInfoPanel_NameLink",
      extractFunc: (baseElement) => {
        const dataCell = baseElement.parentElement?.nextElementSibling;
        if (!dataCell) return null;
        for (let node of dataCell.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            return node.textContent.trim();
          }
        }
        return null;
      },
    },
    { label: "Teléfono Casa", selector: "#CustomerInfoPanel_HPhoneLink" },
    { label: "Teléfono Celular", selector: "#CustomerInfoPanel_CPhoneLink" },
    { label: "Teléfono Trabajo", selector: "#CustomerInfoPanel_WPhoneLink" },
  ];

  try {
    GM_addStyle(`
            .${copyButtonClass} { cursor: pointer; margin-left: 5px; display: inline-block; font-size: 0.9em; user-select: none; vertical-align: middle; }
            .${copyButtonClass}:hover { opacity: 0.7; }
            #CustomerInfoPanel_NameLink + td, #CustomerInfoPanel_HPhoneLink + td,
            #CustomerInfoPanel_CPhoneLink + td, #CustomerInfoPanel_WPhoneLink + td { position: relative; }
            
            /* Estilos para auto-expansión mejorados */
            .auto-expanded { opacity: 0.5; pointer-events: none; }
            .phone-expanded-marker { color: #28a745; font-size: 10px; margin-left: 3px; }
            .expansion-processing { border: 1px dashed #ffc107; }
        `);
  } catch (e) {
    console.error("SCRIPT ERROR: Fallo GM_addStyle.", e);
  }

  function addCopyButton(targetElement, textToCopy, label) {
    const markerElement =
      targetElement?.nodeType === Node.ELEMENT_NODE
        ? targetElement
        : targetElement?.parentElement;
    if (!markerElement || markerElement.dataset[copyButtonMarker] === "true")
      return false;

    const btn = document.createElement("span");
    btn.className = copyButtonClass;
    btn.innerHTML = buttonIcon;
    btn.title = `Copiar ${label}: ${textToCopy}`;
    btn.style.fontSize = "inherit";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        GM_setClipboard(textToCopy, "text");
        btn.innerHTML = successIcon;
        btn.classList.add("copied");
        setTimeout(() => {
          btn.innerHTML = buttonIcon;
          btn.classList.remove("copied");
        }, 1500);
      } catch (err) {
        console.error(
          `SCRIPT ERROR: Fallo GM_setClipboard para [${label}].`,
          err
        );
        alert(`Error al copiar ${label}. Revisa la consola (F12).`);
      }
    });
    try {
      if (targetElement.nodeType === Node.TEXT_NODE) {
        const span = document.createElement("span");
        span.textContent = targetElement.textContent;
        targetElement.parentNode.replaceChild(span, targetElement);
        targetElement = span;
      }
      targetElement.parentNode.insertBefore(btn, targetElement.nextSibling);
      markerElement.dataset[copyButtonMarker] = "true";
      return true;
    } catch (error) {
      console.error(
        `SCRIPT ERROR: Error al insertar botón para [${label}]`,
        error,
        targetElement
      );
      return false;
    }
  }

  function clearPreviousButtons(container) {
    container
      .querySelectorAll(`.${copyButtonClass}`)
      .forEach((btn) => btn.remove());
    container
      .querySelectorAll(`[data-${copyButtonMarker}]`)
      .forEach((el) => delete el.dataset[copyButtonMarker]);
  }

  // --- FUNCIONALIDAD MEJORADA: AUTO-EXPANSIÓN DE NÚMEROS OCULTOS ---
  function autoExpandHiddenNumbers() {
    console.log("🔍 Buscando números ocultos para expandir...");
    
    // Buscar SOLO iconos "+" (collapsed) que NO hayan sido procesados
    const plusIcons = document.querySelectorAll('img.iconClass[src*="plus_small.gif"]:not([data-auto-expanded])');
    
    let expandedCount = 0;
    
    plusIcons.forEach((icon, index) => {
      try {
        // Marcar como procesado inmediatamente para evitar clicks repetidos
        icon.dataset.autoExpanded = "true";
        
        console.log(`🔄 Procesando icono "+" ${index + 1}...`);
        
        // Encontrar el enlace padre del icono
        const linkParent = icon.closest('a');
        if (linkParent) {
          
          // Añadir indicador visual temporal
          icon.classList.add('expansion-processing');
          
          // Simular clic humano en el enlace
          console.log(`✅ Haciendo clic para expandir número ${index + 1}`);
          linkParent.click();
          
          expandedCount++;
          
          // Marcar como expandido después de un delay
          setTimeout(() => {
            icon.classList.remove('expansion-processing');
            icon.classList.add('auto-expanded');
            
            // Verificar si el icono cambió a "minus"
            const currentIcon = document.querySelector(`img.iconClass[src*="minus_small.gif"][data-auto-expanded="true"]`);
            if (currentIcon) {
              console.log(`✅ Expansión confirmada para número ${index + 1}`);
              
              // Añadir marcador visual de éxito
              const expandedMarker = document.createElement('span');
              expandedMarker.className = 'phone-expanded-marker';
              expandedMarker.textContent = '🔓';
              expandedMarker.title = 'Número expandido automáticamente';
              
              // Insertar el marcador después del icono minus
              if (currentIcon.parentNode) {
                currentIcon.parentNode.insertBefore(expandedMarker, currentIcon.nextSibling);
              }
            }
          }, 500);
          
        } else {
          console.warn(`⚠️ No se encontró enlace padre para el icono ${index + 1}`);
        }
        
      } catch (error) {
        console.error(`❌ Error expandiendo número oculto ${index + 1}:`, error);
      }
    });
    
    // Si se expandieron números, re-procesar después de un delay apropiado
    if (expandedCount > 0) {
      console.log(`📱 ${expandedCount} números ocultos expandidos automáticamente`);
      
      // Re-procesar los campos de datos después de la expansión
      setTimeout(() => {
        console.log("🔄 Re-procesando campos después de la expansión...");
        processDataFields();
      }, 1500); // Delay mayor para asegurar que el DOM se actualice
    } else {
      console.log("ℹ️ No se encontraron números ocultos para expandir");
    }
  }

  function processDataFields() {
    const container = document.getElementById("pnlCustomerInformation");
    if (!container) return;

    if (!initialRunComplete) {
      clearPreviousButtons(container);
      
      // Expandir números ocultos solo en la primera ejecución
      setTimeout(autoExpandHiddenNumbers, 500);
      
      initialRunComplete = true;
    }

    dataFields.forEach((field) => {
      const baseElement = container.querySelector(field.selector);
      if (!baseElement) return;

      const dataCell = baseElement.parentElement?.nextElementSibling;
      if (!dataCell) return;

      if (field.label === "Nombre") {
        const textToCopy = field.extractFunc(baseElement);
        let displayElement =
          Array.from(dataCell.childNodes).find(
            (node) =>
              node.nodeType === Node.TEXT_NODE &&
              node.textContent?.trim() === textToCopy
          ) || dataCell;
        if (
          textToCopy &&
          addCopyButton(displayElement, textToCopy, field.label)
        ) {
        }
      } else {
        // Procesar números de teléfono (incluyendo los recién expandidos)
        const phoneRows = dataCell.querySelectorAll("table tr");
        if (phoneRows.length > 0) {
          phoneRows.forEach((row, rowIndex) => {
            // Procesar TODAS las filas visibles (incluyendo las expandidas)
            const isVisible = row.style.display !== "none" && 
                            row.style.display !== "" || 
                            row.style.display === "table-row";
            
            if (isVisible || row.offsetParent !== null) {
              const phoneLink = row.querySelector("td:first-child a");
              const tableCell = row.querySelector("td:first-child");
              const numberElement = phoneLink || tableCell;
              const textToCopy = numberElement?.textContent?.trim();
              
              // Validar que sea un número de teléfono válido
              if (textToCopy && textToCopy.match(/^\(\d{3}\)\s?\d{3}-\d{4}$/)) {
                console.log(`📞 Procesando teléfono en fila ${rowIndex + 1}: ${textToCopy}`);
                addCopyButton(numberElement, textToCopy, field.label);
              }
            }
          });
        } else {
          const numberElement = dataCell.querySelector("a") || dataCell;
          const textToCopy = numberElement?.textContent?.trim();
          if (textToCopy && textToCopy.match(/^\(\d{3}\)\s?\d{3}-\d{4}$/)) {
            addCopyButton(numberElement, textToCopy, field.label);
          }
        }
      }
    });
  }

  function runProcessor() {
    if (window.processingRun) return;
    window.processingRun = true;
    try {
      processDataFields();
    } catch (e) {
      console.error("SCRIPT ERROR", e);
    } finally {
      window.processingRun = false;
    }
  }

  const targetNode = document.getElementById("pnlCustomerInformation");
  if (window.location.href.includes("OpptyDetails.aspx") && targetNode) {
    const config = {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    };
    const observer = new MutationObserver((mutationsList) => {
      if (
        mutationsList.some(
          (m) => m.type === "childList" || m.attributeName === "style"
        )
      ) {
        clearTimeout(window.copyDebounce);
        window.copyDebounce = setTimeout(runProcessor, 500);
      }
    });
    observer.observe(targetNode, config);
    
    // Delay inicial para permitir carga completa
    setTimeout(runProcessor, 1200);
  }

  // --- EXPANSIÓN DE HISTORIAL (sin cambios) ---
  function processHistoryFrame() {
    const doc = document;
    const headerRows = doc.querySelectorAll(
      "table#gvOpptyHistory tr.PageHeaderContacts:not([data-processed='true'])"
    );
    headerRows.forEach((headerRow) => {
      headerRow.dataset.processed = "true";
      const triggerCell = headerRow.querySelector("td[onclick*='swapDiv']");
      const contentRow = headerRow.nextElementSibling;
      const contentContainer = contentRow?.querySelector("td[id^='div_']");
      const isCollapsed =
        contentContainer &&
        window.getComputedStyle(contentContainer).display === "none";
      if (isCollapsed && triggerCell) triggerCell.click();
    });

    doc
      .querySelectorAll("td.activityHeader a[onclick*='Click2Call']")
      .forEach((phoneLink) => {
        if (phoneLink.offsetParent !== null) {
          const textToCopy = phoneLink.textContent?.trim();
          if (textToCopy) addCopyButton(phoneLink, textToCopy, "Teléfono");
        }
      });
  }

  if (window.location.href.includes("history.aspx")) {
    const targetNode = document.getElementById("HistoryTable");
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
