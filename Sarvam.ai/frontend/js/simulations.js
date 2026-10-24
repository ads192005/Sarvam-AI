/**
 * Interactive Visual Demonstrations & Simulations
 * - Projectile Motion Simulator (Physics)
 * - Pythagoras & Trigonometry Interactive Proof (Maths)
 * - Binary Search Step-by-Step Visualizer (Computer Science)
 * - Keplerian Planetary Gravity Orbit Simulator (Astronomy/Physics)
 */

class SimulationManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentSim = "projectile";
    this.animId = null;
    this.state = {};
  }

  loadSimulation(type) {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.currentSim = type || "projectile";
    this.container.innerHTML = "";

    if (this.currentSim === "projectile") {
      this._initProjectileSim();
    } else if (this.currentSim === "trigonometry") {
      this._initTrigSim();
    } else if (this.currentSim === "binary_search") {
      this._initBinarySearchSim();
    } else if (this.currentSim === "gravity_orbit") {
      this._initGravitySim();
    }
  }

  /* -------------------------------------------------------------
     1. PROJECTILE MOTION SIMULATOR
     ------------------------------------------------------------- */
  _initProjectileSim() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full p-4 text-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-700">
          <div>
            <h4 class="font-bold text-sky-400 flex items-center gap-2">
              <span>🚀</span> Projectile Motion & Kinematics Simulator
            </h4>
            <p class="text-xs text-slate-400">Launch projectile and observe parabolic trajectory under gravity</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="simFireBtn" class="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 font-semibold rounded-lg text-sm shadow-md transition flex items-center gap-1.5">
              <span>🎯</span> Launch
            </button>
            <button id="simResetBtn" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">
              Reset
            </button>
          </div>
        </div>

        <!-- Controls Bar -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-slate-300">Angle (θ):</span>
              <span id="angleVal" class="text-sky-400 font-bold">45°</span>
            </div>
            <input type="range" id="angleSlider" min="10" max="85" value="45" class="w-full accent-sky-400 cursor-pointer">
          </div>
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-slate-300">Initial Velocity (u):</span>
              <span id="velVal" class="text-amber-400 font-bold">25 m/s</span>
            </div>
            <input type="range" id="velSlider" min="10" max="45" value="25" class="w-full accent-amber-400 cursor-pointer">
          </div>
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-slate-300">Gravity (g):</span>
              <span id="gravVal" class="text-emerald-400 font-bold">Earth (9.8 m/s²)</span>
            </div>
            <select id="gravitySelect" class="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200">
              <option value="9.8">Earth (9.8 m/s²)</option>
              <option value="1.62">Moon (1.62 m/s²)</option>
              <option value="3.71">Mars (3.71 m/s²)</option>
              <option value="24.79">Jupiter (24.79 m/s²)</option>
            </select>
          </div>
        </div>

        <!-- Canvas -->
        <div class="relative flex-1 min-h-[260px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
          <canvas id="projCanvas" class="w-full h-full block"></canvas>
          <div id="projStats" class="absolute top-2 right-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs space-y-0.5 pointer-events-none">
            <div>Max Height: <span id="statH" class="text-amber-300 font-bold">0.0 m</span></div>
            <div>Total Range: <span id="statR" class="text-sky-300 font-bold">0.0 m</span></div>
            <div>Time of Flight: <span id="statT" class="text-emerald-300 font-bold">0.0 s</span></div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById("projCanvas");
    const ctx = canvas.getContext("2d");
    
    // Fit canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let angle = 45;
    let velocity = 25;
    let gravity = 9.8;
    let isFlying = false;
    let t = 0;
    let trajectory = [];

    const angleSlider = document.getElementById("angleSlider");
    const velSlider = document.getElementById("velSlider");
    const gravSelect = document.getElementById("gravitySelect");
    const fireBtn = document.getElementById("simFireBtn");
    const resetBtn = document.getElementById("simResetBtn");

    angleSlider.addEventListener("input", (e) => {
      angle = parseFloat(e.target.value);
      document.getElementById("angleVal").innerText = `${angle}°`;
    });

    velSlider.addEventListener("input", (e) => {
      velocity = parseFloat(e.target.value);
      document.getElementById("velVal").innerText = `${velocity} m/s`;
    });

    gravSelect.addEventListener("change", (e) => {
      gravity = parseFloat(e.target.value);
      document.getElementById("gravVal").innerText = e.target.options[e.target.selectedIndex].text;
    });

    const calculateTheoretical = () => {
      const rad = (angle * Math.PI) / 180;
      const H = (velocity * velocity * Math.sin(rad) * Math.sin(rad)) / (2 * gravity);
      const R = (velocity * velocity * Math.sin(2 * rad)) / gravity;
      const T = (2 * velocity * Math.sin(rad)) / gravity;
      document.getElementById("statH").innerText = `${H.toFixed(1)} m`;
      document.getElementById("statR").innerText = `${R.toFixed(1)} m`;
      document.getElementById("statT").innerText = `${T.toFixed(2)} s`;
    };
    calculateTheoretical();

    const fire = () => {
      calculateTheoretical();
      t = 0;
      trajectory = [];
      isFlying = true;
    };

    const reset = () => {
      isFlying = false;
      t = 0;
      trajectory = [];
      draw();
    };

    fireBtn.addEventListener("click", fire);
    resetBtn.addEventListener("click", reset);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const originX = 50;
      const originY = h - 40;
      const scale = Math.min(w, h) / 110;

      // Draw Grid & Ground
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h - 40);
        ctx.stroke();
      }

      // Ground plane
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, h - 40, w, 40);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, h - 40);
      ctx.lineTo(w, h - 40);
      ctx.stroke();

      // Cannon
      ctx.save();
      ctx.translate(originX, originY);
      ctx.rotate((-angle * Math.PI) / 180);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(0, -7, 28, 14);
      ctx.restore();

      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(originX, originY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Trajectory Path
      if (trajectory.length > 1) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(trajectory[0].x, trajectory[0].y);
        for (let i = 1; i < trajectory.length; i++) {
          ctx.lineTo(trajectory[i].x, trajectory[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Ball Motion Simulation
      if (isFlying) {
        const rad = (angle * Math.PI) / 180;
        const vx = velocity * Math.cos(rad);
        const vy = velocity * Math.sin(rad);

        const currentX = originX + vx * t * scale;
        const currentY = originY - (vy * t - 0.5 * gravity * t * t) * scale;

        if (currentY <= originY && currentX < w - 20) {
          trajectory.push({ x: currentX, y: currentY });

          // Draw Ball
          ctx.fillStyle = "#f59e0b";
          ctx.beginPath();
          ctx.arc(currentX, currentY, 7, 0, Math.PI * 2);
          ctx.fill();

          // Ball Glow
          ctx.fillStyle = "rgba(245, 158, 11, 0.3)";
          ctx.beginPath();
          ctx.arc(currentX, currentY, 14, 0, Math.PI * 2);
          ctx.fill();

          t += 0.045;
        } else {
          isFlying = false;
        }
      }

      this.animId = requestAnimationFrame(draw);
    };

    draw();
  }

  /* -------------------------------------------------------------
     2. PYTHAGORAS & TRIGONOMETRY VISUALIZER
     ------------------------------------------------------------- */
  _initTrigSim() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full p-4 text-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-700">
          <div>
            <h4 class="font-bold text-amber-400 flex items-center gap-2">
              <span>📐</span> Pythagoras Theorem & Trigonometric Ratios
            </h4>
            <p class="text-xs text-slate-400">Drag base or height sliders to view real-time geometric proof & ratios</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-slate-300">Base (a):</span>
              <span id="baseVal" class="text-sky-400 font-bold">120 px</span>
            </div>
            <input type="range" id="baseSlider" min="60" max="220" value="120" class="w-full accent-sky-400 cursor-pointer">
          </div>
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-slate-300">Height (b):</span>
              <span id="heightVal" class="text-pink-400 font-bold">90 px</span>
            </div>
            <input type="range" id="heightSlider" min="50" max="180" value="90" class="w-full accent-pink-400 cursor-pointer">
          </div>
        </div>

        <div class="relative flex-1 min-h-[260px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          <canvas id="trigCanvas" class="w-full h-full block"></canvas>
          <div class="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur p-2.5 rounded-lg border border-slate-700/70 text-xs space-y-1">
            <div class="font-bold text-purple-400">Pythagoras Formula: c² = a² + b²</div>
            <div id="trigFormula" class="text-slate-200 font-mono">150² = 120² + 90² (22500 = 14400 + 8100)</div>
            <div class="flex gap-3 text-slate-300 pt-1 border-t border-slate-800">
              <div>sin(θ) = <span id="sinVal" class="text-pink-400 font-bold">0.60</span></div>
              <div>cos(θ) = <span id="cosVal" class="text-sky-400 font-bold">0.80</span></div>
              <div>tan(θ) = <span id="tanVal" class="text-amber-400 font-bold">0.75</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById("trigCanvas");
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let a = 120;
    let b = 90;

    const baseSlider = document.getElementById("baseSlider");
    const heightSlider = document.getElementById("heightSlider");

    baseSlider.addEventListener("input", (e) => {
      a = parseFloat(e.target.value);
      document.getElementById("baseVal").innerText = `${a} px`;
      updateCalculations();
    });

    heightSlider.addEventListener("input", (e) => {
      b = parseFloat(e.target.value);
      document.getElementById("heightVal").innerText = `${b} px`;
      updateCalculations();
    });

    const updateCalculations = () => {
      const c = Math.sqrt(a * a + b * b);
      const theta = Math.atan2(b, a);
      document.getElementById("trigFormula").innerText = `${c.toFixed(0)}² = ${a}² + ${b}² (${(c*c).toFixed(0)} = ${a*a} + ${b*b})`;
      document.getElementById("sinVal").innerText = Math.sin(theta).toFixed(2);
      document.getElementById("cosVal").innerText = Math.cos(theta).toFixed(2);
      document.getElementById("tanVal").innerText = Math.tan(theta).toFixed(2);
    };
    updateCalculations();

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const ox = w / 2 - a / 2;
      const oy = h / 2 + b / 2;

      // Draw Triangle
      ctx.beginPath();
      ctx.moveTo(ox, oy); // Bottom Left
      ctx.lineTo(ox + a, oy); // Bottom Right
      ctx.lineTo(ox + a, oy - b); // Top Right
      ctx.closePath();

      // Triangle fill
      ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
      ctx.fill();
      ctx.lineWidth = 3;

      // Base (a) - Sky Blue
      ctx.strokeStyle = "#38bdf8";
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + a, oy);
      ctx.stroke();

      // Height (b) - Pink
      ctx.strokeStyle = "#ec4899";
      ctx.beginPath();
      ctx.moveTo(ox + a, oy);
      ctx.lineTo(ox + a, oy - b);
      ctx.stroke();

      // Hypotenuse (c) - Purple
      ctx.strokeStyle = "#a855f7";
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + a, oy - b);
      ctx.stroke();

      // Labels
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Plus Jakarta Sans'";
      ctx.fillText(`Base a = ${a}`, ox + a / 2 - 25, oy + 22);
      ctx.fillText(`Height b = ${b}`, ox + a + 10, oy - b / 2);
      
      const c = Math.sqrt(a * a + b * b);
      ctx.fillText(`Hypotenuse c = ${c.toFixed(0)}`, ox + a / 2 - 60, oy - b / 2 - 12);

      // Angle arc
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, 25, 0, -Math.atan2(b, a), true);
      ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.fillText("θ", ox + 30, oy - 8);

      this.animId = requestAnimationFrame(draw);
    };

    draw();
  }

  /* -------------------------------------------------------------
     3. BINARY SEARCH ALGORITHM VISUALIZER
     ------------------------------------------------------------- */
  _initBinarySearchSim() {
    const array = [3, 7, 12, 19, 24, 35, 42, 58, 67, 81, 95];
    let low = 0;
    let high = array.length - 1;
    let mid = Math.floor((low + high) / 2);
    let target = 42;
    let stepCount = 0;
    let found = false;

    this.container.innerHTML = `
      <div class="flex flex-col h-full p-4 text-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-700">
          <div>
            <h4 class="font-bold text-emerald-400 flex items-center gap-2">
              <span>🔍</span> Binary Search (Divide & Conquer) Visualizer
            </h4>
            <p class="text-xs text-slate-400">Watch the search range halve at every step with O(log N) efficiency</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="bsStepBtn" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">
              Next Step ⏭️
            </button>
            <button id="bsResetBtn" class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition">
              Reset
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3 mb-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
          <span class="text-slate-300">Search Target:</span>
          <div class="flex gap-1.5 flex-wrap">
            ${array.map(num => `
              <button class="target-select-btn px-2.5 py-1 rounded ${num === target ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'} hover:bg-amber-400 hover:text-slate-950 transition" data-val="${num}">
                ${num}
              </button>
            `).join('')}
          </div>
        </div>

        <div id="bsArrayDisplay" class="flex-1 bg-slate-950 rounded-xl p-4 flex flex-col items-center justify-center border border-slate-800 min-h-[220px]">
          <!-- Array bars will be rendered here -->
        </div>

        <div id="bsLog" class="mt-3 p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300 font-mono">
          Ready to search for target ${target}. Click 'Next Step' to begin.
        </div>
      </div>
    `;

    const renderArray = () => {
      const display = document.getElementById("bsArrayDisplay");
      display.innerHTML = `
        <div class="flex gap-2 flex-wrap justify-center items-end h-32 w-full max-w-xl">
          ${array.map((val, idx) => {
            let bgClass = "bg-slate-800 border-slate-700 text-slate-300";
            let indicator = "";

            if (idx === mid) {
              bgClass = found ? "bg-emerald-500 border-emerald-400 text-slate-950 font-bold scale-110 shadow-lg shadow-emerald-500/30" : "bg-amber-500 border-amber-400 text-slate-950 font-bold scale-105";
              indicator = found ? "Found!" : "MID";
            } else if (idx === low) {
              bgClass = "bg-sky-600/80 border-sky-400 text-white font-bold";
              indicator = "LOW";
            } else if (idx === high) {
              bgClass = "bg-purple-600/80 border-purple-400 text-white font-bold";
              indicator = "HIGH";
            } else if (idx < low || idx > high) {
              bgClass = "bg-slate-900 border-slate-800 text-slate-600 opacity-40";
            }

            return `
              <div class="flex flex-col items-center transition-all duration-300">
                <span class="text-[10px] font-bold text-sky-400 h-4">${indicator}</span>
                <div class="w-10 h-16 rounded-lg border flex items-center justify-center ${bgClass}">
                  ${val}
                </div>
                <span class="text-[10px] text-slate-500 mt-1">[${idx}]</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    };

    const step = () => {
      if (found || low > high) return;

      stepCount++;
      mid = Math.floor((low + high) / 2);
      const currentVal = array[mid];

      const log = document.getElementById("bsLog");

      if (currentVal === target) {
        found = true;
        log.innerHTML = `<span class="text-emerald-400 font-bold">🎯 Found target ${target} at index ${mid} in ${stepCount} steps! (O(log N))</span>`;
      } else if (currentVal < target) {
        log.innerHTML = `<span class="text-amber-400">Step ${stepCount}:</span> array[mid] (${currentVal}) < target (${target}). Eliminating left half. Setting low = ${mid + 1}.`;
        low = mid + 1;
      } else {
        log.innerHTML = `<span class="text-amber-400">Step ${stepCount}:</span> array[mid] (${currentVal}) > target (${target}). Eliminating right half. Setting high = ${mid - 1}.`;
        high = mid - 1;
      }

      renderArray();
    };

    const reset = () => {
      low = 0;
      high = array.length - 1;
      mid = Math.floor((low + high) / 2);
      stepCount = 0;
      found = false;
      document.getElementById("bsLog").innerText = `Ready to search for target ${target}. Click 'Next Step' to begin.`;
      renderArray();
    };

    document.querySelectorAll(".target-select-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        target = parseInt(e.target.getAttribute("data-val"));
        document.querySelectorAll(".target-select-btn").forEach(b => {
          b.className = "target-select-btn px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:bg-amber-400 hover:text-slate-950 transition";
        });
        e.target.className = "target-select-btn px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold transition";
        reset();
      });
    });

    document.getElementById("bsStepBtn").addEventListener("click", step);
    document.getElementById("bsResetBtn").addEventListener("click", reset);

    renderArray();
  }

  /* -------------------------------------------------------------
     4. PLANETARY ORBIT & GRAVITY SIMULATOR
     ------------------------------------------------------------- */
  _initGravitySim() {
    this.container.innerHTML = `
      <div class="flex flex-col h-full p-4 text-slate-100">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-700">
          <div>
            <h4 class="font-bold text-amber-400 flex items-center gap-2">
              <span>🪐</span> Universal Gravitation & Orbital Motion
            </h4>
            <p class="text-xs text-slate-400">Kepler's Law & Newton's inverse-square gravitational pull demonstration</p>
          </div>
        </div>

        <div class="relative flex-1 min-h-[280px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
          <canvas id="orbitCanvas" class="w-full h-full block"></canvas>
          <div class="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 space-y-0.5">
            <div>Central Mass: <span class="text-amber-400 font-bold">Sun (M)</span></div>
            <div>Orbiting Body: <span class="text-sky-400 font-bold">Earth (m)</span></div>
            <div class="text-[11px] text-slate-400">Velocity Vector: Green | Gravitational Force: Red</div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById("orbitCanvas");
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let angle = 0;
    const a = 140; // Semi-major axis
    const b = 100; // Semi-minor axis

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Orbit Ellipse
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Sun at focus
      const focusX = cx - 35;
      const focusY = cy;

      const sunGrad = ctx.createRadialGradient(focusX, focusY, 5, focusX, focusY, 28);
      sunGrad.addColorStop(0, '#fef08a');
      sunGrad.addColorStop(0.5, '#f59e0b');
      sunGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(focusX, focusY, 28, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(focusX, focusY, 14, 0, Math.PI * 2);
      ctx.fill();

      // Planet Position
      const px = cx + a * Math.cos(angle);
      const py = cy + b * Math.sin(angle);

      // Planet
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fill();

      // Gravity Force Vector (Points towards Sun)
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (focusX - px) * 0.25, py + (focusY - py) * 0.25);
      ctx.stroke();

      // Velocity Vector (Tangent)
      const vx = -a * Math.sin(angle);
      const vy = b * Math.cos(angle);
      const vMag = Math.sqrt(vx * vx + vy * vy);
      const normVx = (vx / vMag) * 35;
      const normVy = (vy / vMag) * 35;

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + normVx, py + normVy);
      ctx.stroke();

      angle += 0.02;
      this.animId = requestAnimationFrame(draw);
    };

    draw();
  }
}
