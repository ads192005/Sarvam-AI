/**
 * Lifelike Interactive AI Avatar Renderer
 * Features:
 * - Dynamic facial expressions (Blinking, eye tracking, emotion shifts)
 * - Audio-driven viseme mouth movement synchronized with Sarvam Bulbul TTS
 * - Expressive body gestures (Pointing to whiteboard, nodding, thinking, celebrating)
 * - 4 Indian Educator Personas (Priya, Aryan, Anushka, Shubh)
 */

class AvatarRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.width = this.canvas.width = 400;
    this.height = this.canvas.height = 420;

    this.persona = "priya";
    this.gesture = "explain";
    this.emotion = "enthusiastic";

    // Animation physics & states
    this.time = 0;
    this.blinkProgress = 0;
    this.isBlinking = false;
    this.nextBlinkTime = 120;
    
    // Viseme / Mouth audio level (0 to 1)
    this.mouthOpenness = 0;
    this.targetMouthOpenness = 0;
    this.mouthWidth = 1.0;

    // Head tilt & motion
    this.headAngle = 0;
    this.nodOffset = 0;
    this.nodTimer = 0;

    // Gesture animation timers
    this.gestureProgress = 0;
    this.celebrateParticles = [];

    // Eye target tracking
    this.targetEyeX = 0;
    this.targetEyeY = 0;
    this.currentEyeX = 0;
    this.currentEyeY = 0;

    this.isSpeaking = false;

    this._initEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  _initEvents() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;
      this.targetEyeX = Math.max(-15, Math.min(15, mouseX * 0.05));
      this.targetEyeY = Math.max(-10, Math.min(10, mouseY * 0.05));
    });
  }

  setPersona(personaKey) {
    this.persona = personaKey;
  }

  setGesture(gesture) {
    this.gesture = gesture || "explain";
    this.gestureProgress = 0;

    if (gesture === "nod") {
      this.nodTimer = 40;
    } else if (gesture === "celebrate") {
      this._spawnCelebrateParticles();
    }
  }

  setEmotion(emotion) {
    this.emotion = emotion || "encouraging";
  }

  setMouthLevel(level) {
    this.targetMouthOpenness = Math.max(0, Math.min(1.2, level));
    this.isSpeaking = level > 0.05;
  }

  _spawnCelebrateParticles() {
    this.celebrateParticles = [];
    const colors = ['#f59e0b', '#38bdf8', '#10b981', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 35; i++) {
      this.celebrateParticles.push({
        x: 200,
        y: 180,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 3,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0
      });
    }
  }

  animate() {
    this.time += 0.04;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Smooth mouth interpolation
    this.mouthOpenness += (this.targetMouthOpenness - this.mouthOpenness) * 0.35;
    
    // Smooth eye tracking
    this.currentEyeX += (this.targetEyeX - this.currentEyeX) * 0.1;
    this.currentEyeY += (this.targetEyeY - this.currentEyeY) * 0.1;

    // Periodic blinking
    this.nextBlinkTime--;
    if (this.nextBlinkTime <= 0 && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkProgress = 0;
    }
    if (this.isBlinking) {
      this.blinkProgress += 0.18;
      if (this.blinkProgress >= Math.PI) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.nextBlinkTime = 100 + Math.floor(Math.random() * 140);
      }
    }

    // Nodding gesture physics
    if (this.nodTimer > 0) {
      this.nodTimer--;
      this.nodOffset = Math.sin(this.nodTimer * 0.3) * 6;
    } else {
      this.nodOffset = 0;
    }

    // Subtle breathing oscillation
    const breath = Math.sin(this.time * 1.5) * 2;

    this.ctx.save();
    this.ctx.translate(0, this.nodOffset + breath);

    this._drawBackgroundHalo();
    this._drawBody();
    this._drawHead();
    this._drawFace();
    this._drawGestures();
    this._drawParticles();

    this.ctx.restore();

    requestAnimationFrame(this.animate);
  }

  _drawBackgroundHalo() {
    const cx = this.width / 2;
    const cy = 190;
    const grad = this.ctx.createRadialGradient(cx, cy, 30, cx, cy, 180);
    
    if (this.isSpeaking) {
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
      grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.15)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    } else {
      grad.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    }

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _drawBody() {
    const cx = this.width / 2;
    const cy = 340;

    // Shoulders & Chest
    this.ctx.save();
    
    // Clothing colors based on persona
    let garmentColor = "#1e3a8a"; // Priya: Deep Indigo Blazer
    let innerColor = "#f8fafc";
    let collarColor = "#e2e8f0";

    if (this.persona === "aryan") {
      garmentColor = "#0f766e"; // Teal modern jacket
    } else if (this.persona === "anushka") {
      garmentColor = "#7c3aed"; // Vibrant purple jacket
    } else if (this.persona === "shubh") {
      garmentColor = "#b45309"; // Warm Indian rust kurta
    }

    // Torso / Blazer base
    this.ctx.fillStyle = garmentColor;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy + 40, 110, 70, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Shirt / Inner Top
    this.ctx.fillStyle = innerColor;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 30, cy - 25);
    this.ctx.lineTo(cx + 30, cy - 25);
    this.ctx.lineTo(cx, cy + 30);
    this.ctx.closePath();
    this.ctx.fill();

    // Collar lapels
    this.ctx.strokeStyle = collarColor;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 38, cy - 30);
    this.ctx.lineTo(cx - 10, cy + 20);
    this.ctx.lineTo(cx, cy - 10);
    this.ctx.lineTo(cx + 10, cy + 20);
    this.ctx.lineTo(cx + 38, cy - 30);
    this.ctx.stroke();

    // Neck
    const skinTone = this.persona === "shubh" ? "#d97706" : "#f59e0b";
    this.ctx.fillStyle = skinTone;
    this.ctx.fillRect(cx - 18, cy - 50, 36, 30);

    this.ctx.restore();
  }

  _drawHead() {
    const cx = this.width / 2;
    const cy = 200;

    this.ctx.save();
    
    // Head shape
    const skinTone = "#fbbf24";
    const skinShadow = "#f59e0b";

    // Hair Background
    this.ctx.fillStyle = "#1c1917";
    if (this.persona === "priya") {
      // Long elegant hair with bun
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 30, 72, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.persona === "anushka") {
      // Bob cut / shoulders
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy, 75, 80, 0, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Short professional hair
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 15, 68, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Face Oval
    this.ctx.fillStyle = skinTone;
    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, 58, 68, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Chin contour
    this.ctx.strokeStyle = skinShadow;
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy + 20, 35, 0.2 * Math.PI, 0.8 * Math.PI);
    this.ctx.stroke();

    // Ears
    this.ctx.fillStyle = skinTone;
    this.ctx.beginPath();
    this.ctx.ellipse(cx - 60, cy + 5, 10, 16, -0.1, 0, Math.PI * 2);
    this.ctx.ellipse(cx + 60, cy + 5, 10, 16, 0.1, 0, Math.PI * 2);
    this.ctx.fill();

    // Indian Bindi / Teeka if Priya or Shubh
    if (this.persona === "priya") {
      this.ctx.fillStyle = "#dc2626";
      this.ctx.beginPath();
      this.ctx.arc(cx, cy - 18, 3.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Hair Foreground / bangs
    this.ctx.fillStyle = "#1c1917";
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 60, cy - 10);
    this.ctx.quadraticCurveTo(cx - 30, cy - 65, cx, cy - 45);
    this.ctx.quadraticCurveTo(cx + 30, cy - 65, cx + 60, cy - 10);
    this.ctx.quadraticCurveTo(cx + 40, cy - 70, cx, cy - 72);
    this.ctx.quadraticCurveTo(cx - 40, cy - 70, cx - 60, cy - 10);
    this.ctx.fill();

    // Glasses for Aryan & Anushka
    if (this.persona === "aryan" || this.persona === "anushka") {
      this._drawGlasses(cx, cy);
    }

    this.ctx.restore();
  }

  _drawGlasses(cx, cy) {
    this.ctx.save();
    this.ctx.strokeStyle = "#38bdf8";
    this.ctx.lineWidth = 2.5;
    
    // Left lens
    this.ctx.strokeRect(cx - 44, cy - 12, 34, 24);
    // Right lens
    this.ctx.strokeRect(cx + 10, cy - 12, 34, 24);
    // Bridge
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 10, cy);
    this.ctx.lineTo(cx + 10, cy);
    this.ctx.stroke();

    this.ctx.restore();
  }

  _drawFace() {
    const cx = this.width / 2;
    const cy = 200;

    this.ctx.save();

    // 1. Eyes
    const blinkScale = this.isBlinking ? Math.max(0.05, 1 - Math.sin(this.blinkProgress)) : 1;
    
    const eyeOffsetX = this.currentEyeX;
    const eyeOffsetY = this.currentEyeY;

    [-24, 24].forEach((sideX) => {
      const eyeX = cx + sideX;
      const eyeY = cy - 2;

      // Eyeball
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.ellipse(eyeX, eyeY, 14, 10 * blinkScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "#475569";
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      if (blinkScale > 0.2) {
        // Pupil
        this.ctx.fillStyle = "#1e293b";
        this.ctx.beginPath();
        this.ctx.ellipse(eyeX + eyeOffsetX * 0.4, eyeY + eyeOffsetY * 0.4, 6.5, 6.5 * blinkScale, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye highlight sparkle
        this.ctx.fillStyle = "#ffffff";
        this.ctx.beginPath();
        this.ctx.arc(eyeX + eyeOffsetX * 0.4 - 2, eyeY + eyeOffsetY * 0.4 - 2, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // 2. Eyebrows
    let browRaise = 0;
    if (this.emotion === "enthusiastic") browRaise = -4;
    if (this.emotion === "curious") browRaise = -2;
    if (this.gesture === "thinking") browRaise = 3;

    this.ctx.strokeStyle = "#1c1917";
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = "round";

    // Left eyebrow
    this.ctx.beginPath();
    this.ctx.moveTo(cx - 38, cy - 16 + browRaise);
    this.ctx.quadraticCurveTo(cx - 24, cy - 22 + browRaise, cx - 12, cy - 16 + browRaise);
    this.ctx.stroke();

    // Right eyebrow
    this.ctx.beginPath();
    this.ctx.moveTo(cx + 12, cy - 16 + browRaise);
    this.ctx.quadraticCurveTo(cx + 24, cy - 22 + browRaise, cx + 38, cy - 16 + browRaise);
    this.ctx.stroke();

    // 3. Nose
    this.ctx.strokeStyle = "#d97706";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy + 2);
    this.ctx.lineTo(cx - 4, cy + 18);
    this.ctx.lineTo(cx + 4, cy + 18);
    this.ctx.stroke();

    // 4. Cheeks (Blush)
    this.ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
    this.ctx.beginPath();
    this.ctx.ellipse(cx - 36, cy + 18, 12, 7, 0, 0, Math.PI * 2);
    this.ctx.ellipse(cx + 36, cy + 18, 12, 7, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // 5. Dynamic Mouth (Viseme synced to audio level)
    const mouthY = cy + 38;
    const openness = this.mouthOpenness; // 0 to 1

    if (openness < 0.1) {
      // Closed resting smile
      this.ctx.strokeStyle = "#991b1b";
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 16, mouthY);
      this.ctx.quadraticCurveTo(cx, mouthY + 8, cx + 16, mouthY);
      this.ctx.stroke();
    } else {
      // Viseme Open Speaking Mouth
      const mouthHeight = 6 + openness * 22;
      const mouthW = 16 + openness * 6;

      this.ctx.fillStyle = "#7f1d1d";
      this.ctx.beginPath();
      this.ctx.ellipse(cx, mouthY + openness * 4, mouthW, mouthHeight, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Teeth
      this.ctx.fillStyle = "#ffffff";
      this.ctx.beginPath();
      this.ctx.rect(cx - mouthW * 0.6, mouthY + openness * 4 - mouthHeight + 2, mouthW * 1.2, 5);
      this.ctx.fill();

      // Tongue
      this.ctx.fillStyle = "#f43f5e";
      this.ctx.beginPath();
      this.ctx.arc(cx, mouthY + openness * 4 + mouthHeight - 4, mouthW * 0.5, Math.PI, 0);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  _drawGestures() {
    const cx = this.width / 2;
    const cy = 340;

    this.ctx.save();

    if (this.gesture === "point_whiteboard") {
      // Arm pointing right towards the whiteboard with laser / glowing tip
      this.targetEyeX = 14; // look at whiteboard
      this.ctx.strokeStyle = "#fbbf24";
      this.ctx.lineWidth = 14;
      this.ctx.lineCap = "round";

      // Arm
      this.ctx.beginPath();
      this.ctx.moveTo(cx + 60, cy + 10);
      this.ctx.quadraticCurveTo(cx + 120, cy - 20, cx + 175, cy - 60);
      this.ctx.stroke();

      // Hand & pointing finger
      this.ctx.fillStyle = "#f59e0b";
      this.ctx.beginPath();
      this.ctx.arc(cx + 175, cy - 60, 10, 0, Math.PI * 2);
      this.ctx.fill();

      // Glowing laser pointer to whiteboard
      this.ctx.fillStyle = "#38bdf8";
      this.ctx.beginPath();
      this.ctx.arc(cx + 185, cy - 65, 6, 0, Math.PI * 2);
      this.ctx.fill();

      // Laser ray pulse
      this.ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([6, 6]);
      this.ctx.beginPath();
      this.ctx.moveTo(cx + 185, cy - 65);
      this.ctx.lineTo(this.width + 50, cy - 100);
      this.ctx.stroke();
    } else if (this.gesture === "thinking") {
      // Hand near chin, eyes tilted upwards
      this.targetEyeY = -8;
      this.targetEyeX = 5;

      this.ctx.strokeStyle = "#fbbf24";
      this.ctx.lineWidth = 12;
      this.ctx.lineCap = "round";

      this.ctx.beginPath();
      this.ctx.moveTo(cx + 50, cy + 20);
      this.ctx.quadraticCurveTo(cx + 80, cy - 40, cx + 25, 245);
      this.ctx.stroke();

      // Fist near chin
      this.ctx.fillStyle = "#f59e0b";
      this.ctx.beginPath();
      this.ctx.arc(cx + 25, 245, 12, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (this.gesture === "celebrate") {
      // Both hands raised in victory
      this.ctx.strokeStyle = "#fbbf24";
      this.ctx.lineWidth = 12;
      this.ctx.lineCap = "round";

      // Left arm raised
      this.ctx.beginPath();
      this.ctx.moveTo(cx - 50, cy);
      this.ctx.quadraticCurveTo(cx - 90, cy - 60, cx - 110, cy - 110);
      this.ctx.stroke();

      // Right arm raised
      this.ctx.beginPath();
      this.ctx.moveTo(cx + 50, cy);
      this.ctx.quadraticCurveTo(cx + 90, cy - 60, cx + 110, cy - 110);
      this.ctx.stroke();

      // Hands
      this.ctx.fillStyle = "#f59e0b";
      this.ctx.beginPath();
      this.ctx.arc(cx - 110, cy - 110, 11, 0, Math.PI * 2);
      this.ctx.arc(cx + 110, cy - 110, 11, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      // Default natural conversational posture
      const handWave = Math.sin(this.time * 2) * 5;
      this.ctx.strokeStyle = "#fbbf24";
      this.ctx.lineWidth = 10;
      this.ctx.lineCap = "round";

      this.ctx.beginPath();
      this.ctx.moveTo(cx + 50, cy + 20);
      this.ctx.quadraticCurveTo(cx + 80, cy + 10, cx + 90, cy + handWave);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  _drawParticles() {
    for (let i = this.celebrateParticles.length - 1; i >= 0; i--) {
      const p = this.celebrateParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.life -= 0.02;

      if (p.life <= 0) {
        this.celebrateParticles.splice(i, 1);
        continue;
      }

      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = p.life;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }
  }
}
