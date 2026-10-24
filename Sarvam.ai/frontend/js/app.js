/**
 * Sarvam AI Avatar Tutor - Main Application Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Core Subsystems
  const avatar = new AvatarRenderer("avatarCanvas");
  const audio = new AudioController(avatar);
  const simManager = new SimulationManager("wbSimContainer");
  const whiteboard = new WhiteboardRenderer("whiteboardContainer");
  whiteboard.setSimManager(simManager);

  // App State
  let currentPersona = "priya";
  let currentLanguage = "hi-IN";
  let chatHistory = [];
  let userApiKey = localStorage.getItem("sarvam_api_key") || "";
  let masteryScore = 20;
  let streakCount = 1;
  let conceptsMastered = ["Intro to Physics"];
  let currentLessonData = null;

  // DOM Elements
  const personaSelect = document.getElementById("personaSelect");
  const languageSelect = document.getElementById("languageSelect");
  const apiKeyBtn = document.getElementById("apiKeyBtn");
  const apiKeyModal = document.getElementById("apiKeyModal");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");
  const closeApiKeyModal = document.getElementById("closeApiKeyModal");
  const statusBadge = document.getElementById("statusBadge");

  const micBtn = document.getElementById("micBtn");
  const chatInput = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const tutorSubtitle = document.getElementById("tutorSubtitle");
  const tutorSpeakerName = document.getElementById("tutorSpeakerName");
  const tutorSpeakerTitle = document.getElementById("tutorSpeakerTitle");

  // Tab Buttons
  const tabBtnNotes = document.getElementById("tabBtnNotes");
  const tabBtnSim = document.getElementById("tabBtnSim");
  const tabBtnDoc = document.getElementById("tabBtnDoc");

  // Quiz Elements
  const quizContainer = document.getElementById("quizContainer");
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");
  const quizHintBtn = document.getElementById("quizHintBtn");
  const quizHintBox = document.getElementById("quizHintBox");
  const quizFeedback = document.getElementById("quizFeedback");
  const quizDifficulty = document.getElementById("quizDifficulty");

  // Progress Elements
  const masteryScoreEl = document.getElementById("masteryScore");
  const masteryCircle = document.getElementById("masteryCircle");
  const streakCountEl = document.getElementById("streakCount");
  const conceptListEl = document.getElementById("conceptList");
  const exportRecapBtn = document.getElementById("exportRecapBtn");

  // Document Upload
  const docUploadInput = document.getElementById("docUploadInput");
  const docUploadBtn = document.getElementById("docUploadBtn");

  /* -------------------------------------------------------------
     INITIAL HEALTH & STATUS CHECK
     ------------------------------------------------------------- */
  const checkHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      
      const isConnected = data.sarvam_connected || !!userApiKey;
      if (isConnected) {
        statusBadge.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-emerald-300 font-semibold text-xs">Sarvam AI Active</span>
        `;
        statusBadge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30";
      } else {
        statusBadge.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span class="text-amber-300 font-semibold text-xs">Demo Mode (Add Key)</span>
        `;
        statusBadge.className = "flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 cursor-pointer";
      }
    } catch (e) {
      console.warn("Health check error:", e);
    }
  };
  await checkHealth();

  /* -------------------------------------------------------------
     PERSONA & LANGUAGE LISTENERS
     ------------------------------------------------------------- */
  personaSelect.addEventListener("change", (e) => {
    currentPersona = e.target.value;
    avatar.setPersona(currentPersona);

    const personaNames = {
      priya: { name: "Prof. Priya Sharma", title: "Senior STEM & Physics Educator" },
      aryan: { name: "Dr. Aryan Patel", title: "Computer Science & AI Specialist" },
      anushka: { name: "Tutor Anushka Rao", title: "Pure Mathematics & Calculus Mentor" },
      shubh: { name: "Mentor Shubh Verma", title: "Indian History & Multilingual Scholar" }
    };

    const p = personaNames[currentPersona] || personaNames.priya;
    tutorSpeakerName.innerText = p.name;
    tutorSpeakerTitle.innerText = p.title;
  });

  languageSelect.addEventListener("change", (e) => {
    currentLanguage = e.target.value;
  });

  /* -------------------------------------------------------------
     API KEY MODAL
     ------------------------------------------------------------- */
  apiKeyBtn.addEventListener("click", () => {
    apiKeyInput.value = userApiKey;
    apiKeyModal.classList.remove("hidden");
  });

  statusBadge.addEventListener("click", () => {
    apiKeyInput.value = userApiKey;
    apiKeyModal.classList.remove("hidden");
  });

  closeApiKeyModal.addEventListener("click", () => {
    apiKeyModal.classList.add("hidden");
  });

  saveApiKeyBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    userApiKey = key;
    localStorage.setItem("sarvam_api_key", key);

    try {
      await fetch("/api/save-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: key })
      });
    } catch (e) {
      console.warn("Could not save to server config:", e);
    }

    apiKeyModal.classList.add("hidden");
    await checkHealth();
  });

  /* -------------------------------------------------------------
     TAB SWITCHING
     ------------------------------------------------------------- */
  tabBtnNotes.addEventListener("click", () => whiteboard.switchTab("notes"));
  tabBtnSim.addEventListener("click", () => whiteboard.switchTab("simulation"));
  tabBtnDoc.addEventListener("click", () => whiteboard.switchTab("document"));

  /* -------------------------------------------------------------
     SEND QUERY & LESSON DISPATCH
     ------------------------------------------------------------- */
  const sendQuery = async (queryText) => {
    if (!queryText || !queryText.trim()) return;

    chatInput.value = "";
    avatar.setGesture("thinking");
    avatar.setEmotion("curious");
    tutorSubtitle.innerHTML = `<span class="italic text-slate-400">Thinking and preparing interactive lesson...</span>`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          persona: currentPersona,
          language_code: currentLanguage,
          history: chatHistory,
          sarvam_api_key: userApiKey || undefined
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const lessonData = await res.json();
      currentLessonData = lessonData;
      handleLessonResponse(lessonData);
    } catch (err) {
      console.error("Chat error:", err);
      tutorSubtitle.innerText = `Error: ${err.message}. Please try again or check your Sarvam API Key.`;
      avatar.setGesture("explain");
      avatar.setEmotion("neutral");
    }
  };

  const handleLessonResponse = (lesson) => {
    // 1. Update Avatar Gesture & Emotion
    avatar.setGesture(lesson.avatar_gesture || "explain");
    avatar.setEmotion(lesson.avatar_emotion || "enthusiastic");

    // 2. Update Subtitle
    tutorSubtitle.innerText = lesson.spoken_text || "";

    // 3. Render Whiteboard & Simulations
    whiteboard.render(lesson);

    // 4. Update Adaptive Quiz
    renderQuiz(lesson.adaptive_quiz);

    // 5. Update Progress & Mastery
    if (lesson.progress_update) {
      updateProgress(lesson.progress_update);
    }

    // 6. Voice Playback (Sarvam Bulbul or Web Speech Fallback)
    if (lesson.audio_base64) {
      audio.playSarvamAudio(lesson.audio_base64, () => {
        avatar.setGesture("explain");
      });
    } else {
      audio.speakBrowserSpeech(lesson.spoken_text, lesson.language_code || currentLanguage, () => {
        avatar.setGesture("explain");
      });
    }

    // Save to history
    chatHistory.push({ role: "user", content: chatInput.value });
    chatHistory.push({ role: "assistant", content: lesson.spoken_text });
  };

  /* -------------------------------------------------------------
     ADAPTIVE SOCRATIC QUIZ
     ------------------------------------------------------------- */
  const renderQuiz = (quiz) => {
    if (!quiz || !quiz.question) {
      quizContainer.classList.add("hidden");
      return;
    }

    quizContainer.classList.remove("hidden");
    quizQuestion.innerText = quiz.question;
    quizHintBox.classList.add("hidden");
    quizFeedback.classList.add("hidden");

    // Difficulty badge
    const diff = quiz.difficulty || "foundation";
    quizDifficulty.innerText = diff.toUpperCase();
    if (diff === "foundation") {
      quizDifficulty.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
    } else if (diff === "application") {
      quizDifficulty.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30";
    } else {
      quizDifficulty.className = "text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30";
    }

    // Render Options
    quizOptions.innerHTML = (quiz.options || []).map((opt, idx) => `
      <button class="quiz-option-btn w-full text-left p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-600/20 border border-slate-700 hover:border-indigo-500/60 text-xs text-slate-200 transition flex items-center justify-between" data-idx="${idx}">
        <span>${opt}</span>
        <span class="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-400 font-bold">
          ${String.fromCharCode(65 + idx)}
        </span>
      </button>
    `).join('');

    // Attach click listeners to options
    document.querySelectorAll(".quiz-option-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const selectedIdx = parseInt(btn.getAttribute("data-idx"));
        checkQuizAnswer(selectedIdx, quiz.correct_index, quiz.hint);
      });
    });

    // Hint button
    quizHintBtn.onclick = () => {
      quizHintBox.innerText = `💡 Hint: ${quiz.hint || "Review the key formula and observations on the whiteboard!"}`;
      quizHintBox.classList.remove("hidden");
    };
  };

  const checkQuizAnswer = (selected, correct, hint) => {
    const isCorrect = selected === correct;
    quizFeedback.classList.remove("hidden");

    if (isCorrect) {
      quizFeedback.innerHTML = `
        <div class="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <span>🎉</span> 
          <span>Shabaash! Correct answer! You've mastered this concept.</span>
        </div>
      `;
      avatar.setGesture("celebrate");
      avatar.setEmotion("proud");
      
      // Trigger confetti
      if (window.confetti) {
        window.confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      }

      streakCount++;
      streakCountEl.innerText = streakCount;
      masteryScore = Math.min(100, masteryScore + 10);
      updateMasteryUI();
    } else {
      quizFeedback.innerHTML = `
        <div class="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
          <span>❌</span> 
          <span>Not quite. Check the hint or whiteboard notes and try again!</span>
        </div>
      `;
      avatar.setGesture("thinking");
      avatar.setEmotion("encouraging");
      if (hint) {
        quizHintBox.innerText = `💡 Hint: ${hint}`;
        quizHintBox.classList.remove("hidden");
      }
    }
  };

  /* -------------------------------------------------------------
     PROGRESS & MASTERY UI
     ------------------------------------------------------------- */
  const updateProgress = (prog) => {
    if (prog.concept_learned && !conceptsMastered.includes(prog.concept_learned)) {
      conceptsMastered.push(prog.concept_learned);
      renderConcepts();
    }
    if (prog.mastery_delta) {
      masteryScore = Math.min(100, masteryScore + prog.mastery_delta);
      updateMasteryUI();
    }
  };

  const updateMasteryUI = () => {
    masteryScoreEl.innerText = `${masteryScore}%`;
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (masteryScore / 100) * circumference;
    masteryCircle.style.strokeDashoffset = offset;
  };

  const renderConcepts = () => {
    conceptListEl.innerHTML = conceptsMastered.map(c => `
      <div class="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-300">
        <span class="text-emerald-400 font-bold">✓</span>
        <span>${c}</span>
      </div>
    `).join('');
  };
  renderConcepts();
  updateMasteryUI();

  /* -------------------------------------------------------------
     MICROPHONE RECORDING (STT)
     ------------------------------------------------------------- */
  let isRecording = false;

  micBtn.addEventListener("click", async () => {
    if (!isRecording) {
      try {
        await audio.startRecording((vol) => {
          // Volume pulse feedback
        });
        isRecording = true;
        micBtn.classList.add("recording-pulse");
        tutorSubtitle.innerHTML = `<span class="text-rose-400 font-semibold animate-pulse">Listening to your voice... Speak in Hindi, English or your regional language!</span>`;
      } catch (e) {
        alert("Please enable microphone permissions in your browser.");
      }
    } else {
      isRecording = false;
      micBtn.classList.remove("recording-pulse");
      tutorSubtitle.innerHTML = `<span class="italic text-sky-400">Transcribing with Sarvam Saaras Speech-to-Text...</span>`;

      const audioBlob = await audio.stopRecording();
      if (!audioBlob) return;

      // Send to /api/stt
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");
      formData.append("language_code", currentLanguage);
      if (userApiKey) formData.append("sarvam_api_key", userApiKey);

      try {
        const res = await fetch("/api/stt", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        const transcript = data.transcript || "";
        
        if (transcript) {
          chatInput.value = transcript;
          sendQuery(transcript);
        } else {
          tutorSubtitle.innerText = "Could not hear clearly. Please try speaking again.";
        }
      } catch (err) {
        console.error("STT error:", err);
        tutorSubtitle.innerText = "Speech transcription error. Please type your query.";
      }
    }
  });

  /* -------------------------------------------------------------
     KEYBOARD & BUTTON SEND
     ------------------------------------------------------------- */
  sendBtn.addEventListener("click", () => sendQuery(chatInput.value));
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendQuery(chatInput.value);
  });

  // Quick prompt pills
  document.querySelectorAll(".quick-prompt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-prompt");
      sendQuery(q);
    });
  });

  /* -------------------------------------------------------------
     DOCUMENT UPLOAD
     ------------------------------------------------------------- */
  docUploadBtn.addEventListener("click", () => docUploadInput.click());

  docUploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    tutorSubtitle.innerHTML = `<span class="italic text-sky-400">Uploading & extracting document with Sarvam AI...</span>`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("persona", currentPersona);
    formData.append("language_code", currentLanguage);

    try {
      const res = await fetch("/api/upload-document", {
        method: "POST",
        body: formData
      });
      const lesson = await res.json();
      currentLessonData = lesson;
      handleLessonResponse(lesson);

      whiteboard.showUploadedDocument({
        filename: lesson.document_filename,
        content: lesson.document_preview
      });
    } catch (err) {
      console.error("Document upload error:", err);
      alert("Failed to process document: " + err.message);
    }
  });

  /* -------------------------------------------------------------
     EXPORT STUDY NOTES & RECAP
     ------------------------------------------------------------- */
  exportRecapBtn.addEventListener("click", () => {
    if (!currentLessonData) {
      alert("Start a lesson first before exporting study notes!");
      return;
    }

    const title = currentLessonData.whiteboard?.title || "Lesson Summary";
    const notes = currentLessonData.whiteboard?.notes || [];
    const latex = currentLessonData.whiteboard?.math_latex || "";
    const spoken = currentLessonData.spoken_text || "";

    const content = `# ${title}
**Tutor**: ${tutorSpeakerName.innerText} (${tutorSpeakerTitle.innerText})
**Language**: ${currentLanguage}
**Mastery Score**: ${masteryScore}% | **Streak**: ${streakCount}

## Spoken Explanation
${spoken}

## Key Whiteboard Notes & Concepts
${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}

${latex ? `## Mathematical Formulas\n\`\`\`latex\n${latex}\n\`\`\`\n` : ''}

## Concepts Mastered in this Session
${conceptsMastered.map(c => `- [x] ${c}`).join('\n')}

---
*Generated by Sarvam AI Avatar Tutor Platform*
`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Sarvam_Tutor_Notes_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Load initial demo lesson
  setTimeout(() => {
    sendQuery("Explain Projectile Motion with physics simulation");
  }, 400);
});
