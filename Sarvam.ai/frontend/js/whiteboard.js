/**
 * Interactive Visual Whiteboard & Document Display Engine
 * - Dynamic Chalkboard rendering
 * - KaTeX Mathematical formula rendering
 * - Mermaid.js dynamic flowchart / diagram renderer
 * - Document page overlay for uploaded materials
 */

class WhiteboardRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentData = null;
    this.activeTab = "notes"; // "notes" | "simulation" | "document"
    this.simManager = null;
  }

  setSimManager(simManager) {
    this.simManager = simManager;
  }

  render(lessonData) {
    this.currentData = lessonData;
    const wb = lessonData.whiteboard || {};

    // Auto-switch to simulation tab if an interactive demo is provided
    if (wb.interactive_demo && this.simManager) {
      this.activeTab = "simulation";
      this.simManager.loadSimulation(wb.interactive_demo);
    } else {
      this.activeTab = "notes";
    }

    this._updateTabs();
    this._renderNotesView(wb);
  }

  _updateTabs() {
    const tabNotes = document.getElementById("tabBtnNotes");
    const tabSim = document.getElementById("tabBtnSim");
    const tabDoc = document.getElementById("tabBtnDoc");

    const activeClasses = "bg-indigo-600 text-white font-semibold shadow-md";
    const inactiveClasses = "bg-slate-800 text-slate-300 hover:bg-slate-700";

    if (tabNotes) tabNotes.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${this.activeTab === 'notes' ? activeClasses : inactiveClasses}`;
    if (tabSim) tabSim.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${this.activeTab === 'simulation' ? activeClasses : inactiveClasses}`;
    if (tabDoc) tabDoc.className = `px-3.5 py-1.5 rounded-lg text-xs transition ${this.activeTab === 'document' ? activeClasses : inactiveClasses}`;

    const notesView = document.getElementById("wbNotesView");
    const simView = document.getElementById("wbSimView");
    const docView = document.getElementById("wbDocView");

    if (notesView) notesView.style.display = this.activeTab === "notes" ? "block" : "none";
    if (simView) simView.style.display = this.activeTab === "simulation" ? "block" : "none";
    if (docView) docView.style.display = this.activeTab === "document" ? "block" : "none";
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    this._updateTabs();
    if (tabName === "simulation" && this.simManager && this.currentData?.whiteboard?.interactive_demo) {
      this.simManager.loadSimulation(this.currentData.whiteboard.interactive_demo);
    }
  }

  _renderNotesView(wb) {
    const notesView = document.getElementById("wbNotesView");
    if (!notesView) return;

    const title = wb.title || "Lesson Blackboard";
    const notes = wb.notes || [];
    const latex = wb.math_latex || "";
    const mermaidCode = wb.diagram_mermaid || "";

    notesView.innerHTML = `
      <div class="p-6 text-slate-100 flex flex-col h-full overflow-y-auto">
        <!-- Whiteboard Header -->
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-700/80">
          <div class="flex items-center gap-2.5">
            <span class="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 class="chalk-font text-2xl text-amber-300 tracking-wide font-bold">
              ${title}
            </h3>
          </div>
          <span class="text-[11px] text-slate-400 font-mono bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/50">
            Smart Blackboard v1.0
          </span>
        </div>

        <!-- KaTeX Math Equation (if available) -->
        ${latex ? `
          <div class="mb-5 p-3.5 bg-slate-950/70 rounded-xl border border-indigo-500/30 shadow-inner">
            <div class="text-[11px] uppercase tracking-wider text-indigo-400 font-semibold mb-1 flex items-center gap-1.5">
              <span>∑</span> Mathematical Representation
            </div>
            <div id="katexDisplay" class="text-center text-lg py-2 overflow-x-auto text-sky-300 font-serif"></div>
          </div>
        ` : ''}

        <!-- Bullet Points / Step-by-Step Concepts -->
        <div class="mb-5 space-y-2.5">
          <div class="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <span>📝</span> Core Concepts & Observations
          </div>
          <ul class="space-y-2">
            ${notes.map((note, idx) => `
              <li class="flex items-start gap-3 p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 flex items-center justify-center text-xs font-bold mt-0.5">
                  ${idx + 1}
                </span>
                <span class="text-sm text-slate-200 leading-relaxed font-normal">
                  ${note}
                </span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- Mermaid Diagram Container (if available) -->
        ${mermaidCode ? `
          <div class="mt-auto p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            <div class="text-[11px] uppercase tracking-wider text-sky-400 font-semibold mb-2 flex items-center gap-1.5">
              <span>📊</span> Visual Logic Map / Architecture
            </div>
            <div class="mermaid-container flex justify-center py-2 overflow-x-auto" id="mermaidGraph">
              <pre class="mermaid text-xs text-slate-300 font-mono">${mermaidCode}</pre>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Render KaTeX formula safely
    if (latex && window.katex) {
      try {
        const katexEl = document.getElementById("katexDisplay");
        if (katexEl) {
          window.katex.render(latex, katexEl, {
            throwOnError: false,
            displayMode: true
          });
        }
      } catch (e) {
        console.warn("KaTeX error:", e);
      }
    }

    // Render Mermaid diagram safely
    if (mermaidCode && window.mermaid) {
      try {
        window.mermaid.contentLoaded();
      } catch (e) {
        console.warn("Mermaid render error:", e);
      }
    }
  }

  showUploadedDocument(docInfo) {
    this.activeTab = "document";
    this._updateTabs();
    const docView = document.getElementById("wbDocView");
    if (!docView) return;

    docView.innerHTML = `
      <div class="p-6 text-slate-100 flex flex-col h-full overflow-y-auto">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-700">
          <div class="flex items-center gap-2">
            <span class="text-xl">📄</span>
            <div>
              <h3 class="font-bold text-sky-400 text-base">${docInfo.filename || "Uploaded Study Document"}</h3>
              <p class="text-xs text-slate-400">Processed via Sarvam Document Ingestion</p>
            </div>
          </div>
          <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/40">
            Active in Lesson
          </span>
        </div>

        <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex-1 overflow-y-auto">
          <div class="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
${docInfo.content || "Document parsed and loaded into tutor knowledge base."}
          </div>
        </div>
      </div>
    `;
  }
}
