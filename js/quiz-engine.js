/**
 * Outlaws K9 Training - Behavior Rescue Lead Magnet
 * Quiz Engine: State management, scoring algorithm, flow control
 */

const QuizEngine = (function () {
  // State
  const answers = {};
  let currentQuestionIndex = 0;
  let currentSection = "hero";

  // DOM cache
  const sections = {};
  const progressBar = null;

  function init() {
    cacheSections();
    bindHeroButton();
    showSection("hero");
  }

  function cacheSections() {
    ["hero", "dog-info", "quiz", "severity", "results"].forEach(function (id) {
      sections[id] = document.getElementById(id);
    });
  }

  function bindHeroButton() {
    const btn = document.getElementById("start-quiz-btn");
    if (btn) {
      btn.addEventListener("click", function () {
        showSection("dog-info");
        renderDogInfoStep();
      });
    }
  }

  // --- Section visibility ---

  function showSection(sectionId) {
    Object.values(sections).forEach(function (el) {
      if (el) el.classList.remove("active");
    });
    if (sections[sectionId]) {
      sections[sectionId].classList.add("active");
      currentSection = sectionId;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // --- Dog Info Step (Questions 1-3) ---

  function renderDogInfoStep() {
    const container = document.getElementById("dog-info-form");
    if (!container) return;

    const dogInfoQuestions = QUESTIONS.filter(function (q) {
      return q.section === "dog-info";
    });

    container.innerHTML = "";

    dogInfoQuestions.forEach(function (q) {
      const group = document.createElement("div");
      group.className = "form-group";

      const label = document.createElement("label");
      label.setAttribute("for", q.id);
      label.textContent = interpolate(q.prompt);
      group.appendChild(label);

      if (q.subtext) {
        const sub = document.createElement("p");
        sub.className = "subtext";
        sub.textContent = interpolate(q.subtext);
        group.appendChild(sub);
      }

      if (q.type === "text") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = q.id;
        input.name = q.id;
        input.placeholder = q.placeholder || "";
        input.required = q.required;
        input.autocomplete = "off";
        if (answers[q.id]) input.value = answers[q.id];
        group.appendChild(input);
      } else if (q.type === "text-with-datalist") {
        const input = document.createElement("input");
        input.type = "text";
        input.id = q.id;
        input.name = q.id;
        input.placeholder = q.placeholder || "";
        input.required = q.required;
        input.setAttribute("list", q.id + "-list");
        input.autocomplete = "off";
        if (answers[q.id]) input.value = answers[q.id];

        const datalist = document.createElement("datalist");
        datalist.id = q.id + "-list";
        q.datalist.forEach(function (item) {
          const opt = document.createElement("option");
          opt.value = item;
          datalist.appendChild(opt);
        });

        group.appendChild(input);
        group.appendChild(datalist);
      } else if (q.type === "single-select") {
        const optionsDiv = document.createElement("div");
        optionsDiv.className = "radio-options";
        q.options.forEach(function (opt) {
          const optLabel = document.createElement("label");
          optLabel.className = "radio-option";
          if (answers[q.id] === opt.value) optLabel.classList.add("selected");

          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = q.id;
          radio.value = opt.value;
          if (answers[q.id] === opt.value) radio.checked = true;
          radio.addEventListener("change", function () {
            optionsDiv.querySelectorAll(".radio-option").forEach(function (el) {
              el.classList.remove("selected");
            });
            optLabel.classList.add("selected");
          });

          const span = document.createElement("span");
          span.textContent = opt.label;

          optLabel.appendChild(radio);
          optLabel.appendChild(span);
          optionsDiv.appendChild(optLabel);
        });
        group.appendChild(optionsDiv);
      }

      container.appendChild(group);
    });

    // Next button
    const btn = document.createElement("button");
    btn.className = "btn btn-primary";
    btn.textContent = "Next →";
    btn.addEventListener("click", function () {
      if (saveDogInfo()) {
        showSection("quiz");
        renderBehaviorStep();
      }
    });
    container.appendChild(btn);

    updateProgress(1, 3);
  }

  function saveDogInfo() {
    const nameInput = document.getElementById("dog_name");
    const breedInput = document.getElementById("breed");

    if (!nameInput || !nameInput.value.trim()) {
      shakeElement(nameInput);
      nameInput.focus();
      return false;
    }
    answers.dog_name = nameInput.value.trim();

    if (!breedInput || !breedInput.value.trim()) {
      shakeElement(breedInput);
      breedInput.focus();
      return false;
    }
    answers.breed = breedInput.value.trim();

    const ageRadio = document.querySelector('input[name="age_range"]:checked');
    if (!ageRadio) {
      const ageGroup = document.querySelector('.radio-options');
      if (ageGroup) shakeElement(ageGroup);
      return false;
    }
    answers.age_range = ageRadio.value;

    return true;
  }

  // --- Behavior Selection Step (Question 4) ---

  function renderBehaviorStep() {
    const container = document.getElementById("quiz-form");
    if (!container) return;

    const q = QUESTIONS.find(function (q) { return q.id === "behaviors"; });
    container.innerHTML = "";

    const label = document.createElement("h2");
    label.className = "question-title";
    label.textContent = interpolate(q.prompt);
    container.appendChild(label);

    if (q.subtext) {
      const sub = document.createElement("p");
      sub.className = "subtext";
      sub.textContent = interpolate(q.subtext);
      container.appendChild(sub);
    }

    const selectionCount = document.createElement("p");
    selectionCount.className = "selection-count";
    selectionCount.id = "selection-count";
    selectionCount.textContent = "0 of 3 selected";
    container.appendChild(selectionCount);

    const optionsDiv = document.createElement("div");
    optionsDiv.className = "checkbox-options";

    const selectedBehaviors = answers.behaviors || [];

    q.options.forEach(function (opt) {
      const optLabel = document.createElement("label");
      optLabel.className = "checkbox-option";
      if (selectedBehaviors.indexOf(opt.value) !== -1) optLabel.classList.add("selected");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.name = "behaviors";
      checkbox.value = opt.value;
      if (selectedBehaviors.indexOf(opt.value) !== -1) checkbox.checked = true;

      checkbox.addEventListener("change", function () {
        var checked = optionsDiv.querySelectorAll('input[name="behaviors"]:checked');
        if (checked.length > q.maxSelections) {
          checkbox.checked = false;
          optLabel.classList.remove("selected");
          return;
        }
        if (checkbox.checked) {
          optLabel.classList.add("selected");
        } else {
          optLabel.classList.remove("selected");
        }
        selectionCount.textContent = checked.length + " of " + q.maxSelections + " selected";
      });

      const icon = document.createElement("span");
      icon.className = "option-icon";
      icon.textContent = opt.icon || "";

      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = opt.label;

      optLabel.appendChild(checkbox);
      optLabel.appendChild(icon);
      optLabel.appendChild(text);
      optionsDiv.appendChild(optLabel);
    });

    container.appendChild(optionsDiv);

    // Navigation buttons
    const nav = document.createElement("div");
    nav.className = "quiz-nav";

    const backBtn = document.createElement("button");
    backBtn.className = "btn btn-secondary";
    backBtn.textContent = "← Back";
    backBtn.addEventListener("click", function () {
      showSection("dog-info");
      renderDogInfoStep();
    });

    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn-primary";
    nextBtn.textContent = "Next →";
    nextBtn.addEventListener("click", function () {
      if (saveBehaviors()) {
        showSection("severity");
        renderSeverityStep();
      }
    });

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);
    container.appendChild(nav);

    updateProgress(2, 3);
  }

  function saveBehaviors() {
    var checked = document.querySelectorAll('input[name="behaviors"]:checked');
    if (checked.length === 0) {
      var optDiv = document.querySelector('.checkbox-options');
      if (optDiv) shakeElement(optDiv);
      return false;
    }
    answers.behaviors = [];
    checked.forEach(function (cb) {
      answers.behaviors.push(cb.value);
    });
    return true;
  }

  // --- Severity Step (Questions 5-7) ---

  function renderSeverityStep() {
    const container = document.getElementById("severity-form");
    if (!container) return;

    const severityQuestions = QUESTIONS.filter(function (q) {
      return q.section === "severity";
    });

    container.innerHTML = "";

    severityQuestions.forEach(function (q) {
      const group = document.createElement("div");
      group.className = "form-group";

      const label = document.createElement("h3");
      label.className = "question-title-sm";
      label.textContent = interpolate(q.prompt);
      group.appendChild(label);

      if (q.subtext) {
        const sub = document.createElement("p");
        sub.className = "subtext";
        sub.textContent = interpolate(q.subtext);
        group.appendChild(sub);
      }

      const optionsDiv = document.createElement("div");
      optionsDiv.className = "radio-options";
      q.options.forEach(function (opt) {
        const optLabel = document.createElement("label");
        optLabel.className = "radio-option";
        if (answers[q.id] === opt.value) optLabel.classList.add("selected");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = q.id;
        radio.value = opt.value;
        if (answers[q.id] === opt.value) radio.checked = true;
        radio.addEventListener("change", function () {
          optionsDiv.querySelectorAll(".radio-option").forEach(function (el) {
            el.classList.remove("selected");
          });
          optLabel.classList.add("selected");
        });

        const span = document.createElement("span");
        span.textContent = opt.label;

        optLabel.appendChild(radio);
        optLabel.appendChild(span);
        optionsDiv.appendChild(optLabel);
      });
      group.appendChild(optionsDiv);
      container.appendChild(group);
    });

    // Navigation
    const nav = document.createElement("div");
    nav.className = "quiz-nav";

    const backBtn = document.createElement("button");
    backBtn.className = "btn btn-secondary";
    backBtn.textContent = "← Back";
    backBtn.addEventListener("click", function () {
      showSection("quiz");
      renderBehaviorStep();
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "btn btn-primary btn-large";
    submitBtn.textContent = "Get My Results →";
    submitBtn.addEventListener("click", function () {
      if (saveSeverity()) {
        var score = calculateScore();
        showSection("results");
        ResultsRenderer.render(score, answers);
      }
    });

    nav.appendChild(backBtn);
    nav.appendChild(submitBtn);
    container.appendChild(nav);

    updateProgress(3, 3);
  }

  function saveSeverity() {
    var severityQuestions = QUESTIONS.filter(function (q) { return q.section === "severity"; });
    for (var i = 0; i < severityQuestions.length; i++) {
      var q = severityQuestions[i];
      var selected = document.querySelector('input[name="' + q.id + '"]:checked');
      if (!selected) {
        var group = document.querySelectorAll('.radio-options')[i + 1]; // offset for age_range above
        // Find the correct radio-options group
        var groups = document.getElementById("severity-form").querySelectorAll('.radio-options');
        if (groups[i]) shakeElement(groups[i]);
        return false;
      }
      answers[q.id] = selected.value;
    }
    return true;
  }

  // --- Scoring Algorithm ---

  function calculateScore() {
    // Step A: Base score from top 2 behaviors by weight
    var behaviorQ = QUESTIONS.find(function (q) { return q.id === "behaviors"; });
    var selectedOpts = behaviorQ.options.filter(function (opt) {
      return answers.behaviors.indexOf(opt.value) !== -1;
    });

    // Sort by weight descending
    selectedOpts.sort(function (a, b) { return b.weight - a.weight; });

    var topTwo = selectedOpts.slice(0, 2);
    var baseScore = 0;
    topTwo.forEach(function (opt) { baseScore += opt.weight; });

    // If only 1 behavior selected, double it
    if (topTwo.length === 1) {
      baseScore = topTwo[0].weight * 2;
    }

    // Step B: Apply modifiers
    var ageQ = QUESTIONS.find(function (q) { return q.id === "age_range"; });
    var ageOpt = ageQ.options.find(function (o) { return o.value === answers.age_range; });
    var ageMod = ageOpt ? ageOpt.modifier : 0;

    var durationQ = QUESTIONS.find(function (q) { return q.id === "duration"; });
    var durationOpt = durationQ.options.find(function (o) { return o.value === answers.duration; });
    var durationMod = durationOpt ? durationOpt.modifier : 0;

    var freqQ = QUESTIONS.find(function (q) { return q.id === "frequency"; });
    var freqOpt = freqQ.options.find(function (o) { return o.value === answers.frequency; });
    var freqMod = freqOpt ? freqOpt.modifier : 0;

    var attemptQ = QUESTIONS.find(function (q) { return q.id === "previous_attempts"; });
    var attemptOpt = attemptQ.options.find(function (o) { return o.value === answers.previous_attempts; });
    var attemptMod = attemptOpt ? attemptOpt.modifier : 0;

    var totalScore = baseScore + ageMod + durationMod + freqMod + attemptMod;

    // Step C: Normalize
    var percentage = Math.min(100, Math.round((totalScore / MAX_SCORE) * 100));

    // Step D: Risk level
    var riskLevel = RISK_LEVELS[0];
    for (var i = 0; i < RISK_LEVELS.length; i++) {
      if (percentage >= RISK_LEVELS[i].min && percentage <= RISK_LEVELS[i].max) {
        riskLevel = RISK_LEVELS[i];
        break;
      }
    }

    // Step E: Breed liability flag
    var breedFlag = false;
    var hasAggression = answers.behaviors.some(function (b) {
      return AGGRESSION_BEHAVIORS.indexOf(b) !== -1;
    });
    if (hasAggression && HIGH_LIABILITY_BREEDS.indexOf(answers.breed) !== -1) {
      breedFlag = true;
    }

    return {
      totalScore: totalScore,
      percentage: percentage,
      riskLevel: riskLevel,
      topBehaviors: topTwo.map(function (opt) { return opt.value; }),
      allBehaviors: answers.behaviors,
      breedFlag: breedFlag,
      dogName: answers.dog_name,
      breed: answers.breed,
      ageRange: answers.age_range
    };
  }

  // --- Utilities ---

  function interpolate(text) {
    if (!text) return "";
    return text.replace(/\{dog_name\}/g, answers.dog_name || "your dog");
  }

  function updateProgress(step, total) {
    var activeSection = document.querySelector(".section.active");
    if (!activeSection) return;
    var bar = activeSection.querySelector(".progress-fill");
    var label = activeSection.querySelector(".progress-label");
    if (bar) {
      bar.style.width = Math.round((step / total) * 100) + "%";
    }
    if (label) {
      label.textContent = "Step " + step + " of " + total;
    }
  }

  function shakeElement(el) {
    if (!el) return;
    el.classList.add("shake");
    setTimeout(function () { el.classList.remove("shake"); }, 600);
  }

  // Public API
  return {
    init: init,
    interpolate: interpolate
  };
})();

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  QuizEngine.init();
});
