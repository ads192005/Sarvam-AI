/**
 * Audio Controller for Speech-to-Text & Text-to-Speech
 * - Handles MediaRecorder for microphone input (Sarvam Saaras)
 * - Decodes Sarvam Bulbul Base64 audio stream
 * - Uses Web Audio API AnalyserNode to drive real-time Avatar Viseme mouth lip-sync
 * - Fallback to browser SpeechSynthesis if in demo mode
 */

class AudioController {
  constructor(avatarRenderer) {
    this.avatar = avatarRenderer;
    this.audioCtx = null;
    this.analyser = null;
    this.source = null;
    this.isPlaying = false;
    
    // Recording state
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;

    this._setupAudioContext();
  }

  _setupAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  /* -------------------------------------------------------------
     MICROPHONE RECORDING (STT)
     ------------------------------------------------------------- */
  async startRecording(onVolumeUpdate) {
    if (this.isRecording) return;
    this.audioChunks = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;

      // Optional volume meter visualization
      if (this.audioCtx && onVolumeUpdate) {
        if (this.audioCtx.state === 'suspended') {
          await this.audioCtx.resume();
        }
        const micSource = this.audioCtx.createMediaStreamSource(stream);
        const micAnalyser = this.audioCtx.createAnalyser();
        micAnalyser.fftSize = 128;
        micSource.connect(micAnalyser);
        const data = new Uint8Array(micAnalyser.frequencyBinCount);

        const checkVolume = () => {
          if (!this.isRecording) return;
          micAnalyser.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length / 255;
          onVolumeUpdate(avg);
          requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      throw err;
    }
  }

  async stopRecording() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/wav" });
        this.isRecording = false;
        
        // Stop all mic tracks
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
        }

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  /* -------------------------------------------------------------
     AUDIO PLAYBACK & VISEME LIP-SYNC (TTS)
     ------------------------------------------------------------- */
  async playSarvamAudio(base64Data, onEndCallback) {
    if (!base64Data) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      if (!this.audioCtx) this._setupAudioContext();
      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      // Convert Base64 to ArrayBuffer
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await this.audioCtx.decodeAudioData(bytes.buffer);

      if (this.source) {
        try { this.source.stop(); } catch (e) {}
      }

      this.source = this.audioCtx.createBufferSource();
      this.source.buffer = audioBuffer;

      // Connect to analyser and speakers
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.isPlaying = true;
      this.source.start(0);

      // Start viseme tracking loop
      const updateVisemes = () => {
        if (!this.isPlaying) return;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate speech energy
        let sum = 0;
        // Focus on vocal frequency range (bins 2 to 24)
        for (let i = 2; i < 24; i++) {
          sum += this.dataArray[i];
        }
        const energy = sum / (22 * 255);
        const mouthLevel = Math.min(1.2, energy * 2.5);

        this.avatar.setMouthLevel(mouthLevel);

        requestAnimationFrame(updateVisemes);
      };
      updateVisemes();

      this.source.onended = () => {
        this.isPlaying = false;
        this.avatar.setMouthLevel(0);
        if (onEndCallback) onEndCallback();
      };
    } catch (e) {
      console.error("Audio playback error:", e);
      this.isPlaying = false;
      this.avatar.setMouthLevel(0);
      if (onEndCallback) onEndCallback();
    }
  }

  /* Fallback TTS using browser speech */
  speakBrowserSpeech(text, langCode, onEndCallback) {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || "hi-IN";
    utterance.rate = 1.0;

    let visemeInterval = null;

    utterance.onstart = () => {
      this.isPlaying = true;
      // Simulate viseme fluctuation
      visemeInterval = setInterval(() => {
        if (!this.isPlaying) return;
        const fakeLevel = 0.2 + Math.random() * 0.7;
        this.avatar.setMouthLevel(fakeLevel);
      }, 90);
    };

    utterance.onend = () => {
      this.isPlaying = false;
      clearInterval(visemeInterval);
      this.avatar.setMouthLevel(0);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.isPlaying = false;
      clearInterval(visemeInterval);
      this.avatar.setMouthLevel(0);
      if (onEndCallback) onEndCallback();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    this.isPlaying = false;
    if (this.source) {
      try { this.source.stop(); } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.avatar.setMouthLevel(0);
  }
}
