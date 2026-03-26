/**
 * Outlaws K9 Training — Behavior Rescue Lead Magnet
 * Results Renderer: Risk gauge, behavior cards, CTA, email capture
 */

const ResultsRenderer = (function () {

  function render(score, answers) {
    const container = document.getElementById("results-content");
    if (!container) return;

    container.innerHTML = "";

    // Header
    renderHeader(container, score);

    // Risk gauge
    renderGauge(container, score);

    // Breed liability warning (if applicable)
    if (score.breedFlag) {
      renderBreedWarning(container, score);
    }

    // Top 2 behavior cards
    renderBehaviorCards(container, score);

    // Overall escalation warning
    renderEscalationBlock(container, score);

    // CTA block
    renderCTA(container, score);

    // Email capture
    renderEmailCapture(container, score);

    // Animate gauge after a brief delay
    setTimeout(function () {
      animateGauge(score.percentage);
    }, 300);
  }

  // --- Header ---

  function renderHeader(container, score) {
    const header = document.createElement("div");
    header.className = "results-header";
    header.innerHTML =
      '<h1 class="results-title">Behavior Risk Assessment for <span class="dog-name-highlight">' +
      escapeHtml(score.dogName) +
      '</span></h1>' +
      '<p class="results-subtitle">Here\'s the honest truth about what\'s going on — and what you can do about it right now.</p>';
    container.appendChild(header);
  }

  // --- Risk Gauge ---

  function renderGauge(container, score) {
    const gaugeWrap = document.createElement("div");
    gaugeWrap.className = "gauge-container";

    gaugeWrap.innerHTML =
      '<div class="gauge-arc">' +
        '<div class="gauge-body">' +
          '<div class="gauge-fill" id="gauge-fill"></div>' +
        '</div>' +
      '</div>' +
      '<div class="gauge-stats">' +
        '<span class="gauge-percentage" id="gauge-percentage">0%</span>' +
        '<span class="gauge-risk-label ' + score.riskLevel.className + '">' +
          score.riskLevel.label + ' Risk' +
        '</span>' +
      '</div>';

    container.appendChild(gaugeWrap);
  }

  function animateGauge(targetPercent) {
    const fill = document.getElementById("gauge-fill");
    const percentText = document.getElementById("gauge-percentage");
    if (!fill || !percentText) return;

    let current = 0;
    const step = Math.max(1, Math.round(targetPercent / 60));
    const interval = setInterval(function () {
      current += step;
      if (current >= targetPercent) {
        current = targetPercent;
        clearInterval(interval);
      }
      // Gauge rotation: 0% = -90deg (left), 100% = 90deg (right)
      const rotation = -90 + (current / 100) * 180;
      fill.style.transform = "rotate(" + rotation + "deg)";
      percentText.textContent = current + "%";
    }, 25);
  }

  // --- Breed Warning ---

  function renderBreedWarning(container, score) {
    const warning = document.createElement("div");
    warning.className = "breed-warning";
    warning.innerHTML =
      '<div class="warning-icon">⚠️</div>' +
      '<div class="warning-content">' +
        '<strong>Breed-Specific Liability Notice</strong>' +
        '<p>' + escapeHtml(score.dogName) + ' is a ' + escapeHtml(score.breed) +
        ' — a breed that faces heightened legal scrutiny when aggression or reactivity is involved. ' +
        'Insurance claims, breed-specific legislation, and landlord restrictions are real risks. ' +
        'This makes professional intervention not just smart, but essential for keeping ' +
        escapeHtml(score.dogName) + ' safe and in your home.</p>' +
      '</div>';
    container.appendChild(warning);
  }

  // --- Behavior Cards ---

  function renderBehaviorCards(container, score) {
    const cardsSection = document.createElement("div");
    cardsSection.className = "behavior-cards-section";

    const cardsTitle = document.createElement("h2");
    cardsTitle.className = "section-heading";
    cardsTitle.textContent = "Your Top Behavior Breakdown";
    cardsSection.appendChild(cardsTitle);

    const cardsIntro = document.createElement("p");
    cardsIntro.className = "section-intro";
    cardsIntro.textContent = "Here's what's actually going on — and the three things you can do today to start turning it around.";
    cardsSection.appendChild(cardsIntro);

    score.topBehaviors.forEach(function (behaviorKey, index) {
      var data = BEHAVIOR_DATABASE[behaviorKey];
      if (!data) return;

      var card = document.createElement("div");
      card.className = "behavior-card";

      var cardHeader = document.createElement("div");
      cardHeader.className = "card-header";
      cardHeader.innerHTML =
        '<span class="card-number">#' + (index + 1) + '</span>' +
        '<div>' +
          '<h3 class="card-title">' + escapeHtml(data.title) + '</h3>' +
          '<p class="card-subtitle">' + interpolateName(data.subtitle, score.dogName) + '</p>' +
        '</div>';
      card.appendChild(cardHeader);

      // Consequence
      var consequence = document.createElement("div");
      consequence.className = "card-consequence";
      consequence.innerHTML =
        '<h4>The Reality Check</h4>' +
        '<p>' + interpolateName(data.consequence, score.dogName) + '</p>';
      card.appendChild(consequence);

      // Action Steps
      var actions = document.createElement("div");
      actions.className = "card-actions";
      actions.innerHTML = '<h4>Your 3 Immediate Action Steps</h4>';
      var ol = document.createElement("ol");
      data.actionSteps.forEach(function (step) {
        var li = document.createElement("li");
        li.textContent = interpolateName(step, score.dogName);
        ol.appendChild(li);
      });
      actions.appendChild(ol);
      card.appendChild(actions);

      // Escalation warning
      var escalation = document.createElement("div");
      escalation.className = "card-escalation";
      escalation.innerHTML =
        '<div class="escalation-icon">🚨</div>' +
        '<p>' + interpolateName(data.escalationWarning, score.dogName) + '</p>';
      card.appendChild(escalation);

      cardsSection.appendChild(card);
    });

    container.appendChild(cardsSection);
  }

  // --- Overall Escalation Block ---

  function renderEscalationBlock(container, score) {
    var block = document.createElement("div");
    block.className = "escalation-block";

    var riskWord = score.riskLevel.label.toLowerCase();
    var urgencyText = "";

    if (riskWord === "critical") {
      urgencyText = "We're going to be direct: " + escapeHtml(score.dogName) +
        "'s behavior is in the danger zone. Every day without professional intervention " +
        "is a day the problem gets harder — and more expensive — to fix. " +
        "The action steps above will help manage the situation, but managing is not solving.";
    } else if (riskWord === "high") {
      urgencyText = "Here's the uncomfortable truth: " + escapeHtml(score.dogName) +
        "'s behaviors are past the \"tips and tricks\" stage. " +
        "The action steps above are genuine first aid — they'll help — but they won't rewire " +
        "the patterns driving this behavior. That takes a structured plan and someone who's done this before.";
    } else {
      urgencyText = escapeHtml(score.dogName) +
        "'s situation is manageable right now. That's the good news. " +
        "The less-good news? \"Manageable\" has a shelf life. " +
        "These behaviors don't freeze in place — they either improve with the right approach or they escalate. " +
        "The action steps above are a solid start. But a solid start deserves a proper follow-through.";
    }

    block.innerHTML =
      '<h2 class="escalation-title">The Bottom Line</h2>' +
      '<p class="escalation-text">' + urgencyText + '</p>';

    container.appendChild(block);
  }

  // --- CTA Block ---

  function renderCTA(container, score) {
    var cta = document.createElement("div");
    cta.className = "cta-block";

    cta.innerHTML =
      '<div class="cta-inner">' +
        '<h2 class="cta-title">The Behavior Rescue Package</h2>' +
        '<p class="cta-subtitle">Your dog\'s not going to train itself. Trust us, we asked.</p>' +
        '<div class="cta-description">' +
          '<p>A personalized 1-on-1 behavior modification program built around ' +
          escapeHtml(score.dogName) + '\'s specific issues — not a generic group class ' +
          'where everyone\'s problems get the same cookie-cutter answer.</p>' +
        '</div>' +
        '<ul class="cta-features">' +
          '<li>Comprehensive in-home behavior assessment</li>' +
          '<li>Custom training plan targeting ' + escapeHtml(score.dogName) + '\'s top behaviors</li>' +
          '<li>Ongoing support between sessions (because problems don\'t wait for appointments)</li>' +
          '<li>Real results — not just obedience tricks that fall apart at the dog park</li>' +
        '</ul>' +
        '<div class="cta-urgency">' +
          '<!-- PLACEHOLDER: Update spots remaining count -->' +
          '<p class="urgency-text">Only accepting <strong>5 new clients</strong> this month.</p>' +
          '<p class="urgency-subtext">We keep our roster small on purpose. Every dog gets our full attention.</p>' +
        '</div>' +
        '<a href="#" class="btn btn-cta" id="book-now-btn">' +
          '<!-- PLACEHOLDER: Replace href with booking URL -->' +
          'Claim Your Spot Now' +
        '</a>' +
        '<div class="cta-trust">' +
          '<div class="trust-item">' +
            '<span class="trust-number">500+</span>' +
            '<span class="trust-label">Dogs Helped</span>' +
          '</div>' +
          '<div class="trust-item">' +
            '<span class="trust-number">7 Days</span>' +
            '<span class="trust-label">Average Time to See Change</span>' +
          '</div>' +
          '<div class="trust-item">' +
            '<span class="trust-number">100%</span>' +
            '<span class="trust-label">Satisfaction Guarantee</span>' +
          '</div>' +
        '</div>' +
        '<!-- PLACEHOLDER: Add testimonial quote -->' +
        '<div class="testimonial">' +
          '<p class="testimonial-text">"We were ready to give up on our dog. One session changed everything. ' +
          'I wish we hadn\'t waited so long."</p>' +
          '<p class="testimonial-author">— Satisfied Client <!-- PLACEHOLDER: Replace with real testimonial --></p>' +
        '</div>' +
      '</div>';

    container.appendChild(cta);
  }

  // --- Email Capture ---

  function renderEmailCapture(container, score) {
    var emailBlock = document.createElement("div");
    emailBlock.className = "email-capture";

    emailBlock.innerHTML =
      '<div class="email-inner">' +
        '<h3>Want this report sent to your inbox?</h3>' +
        '<p>Get ' + escapeHtml(score.dogName) + '\'s full behavior breakdown + a bonus action checklist delivered straight to your email. No spam. Just help.</p>' +
        '<form class="email-form" id="email-form">' +
          '<!-- PLACEHOLDER: Set form action to email service endpoint (Mailchimp, ConvertKit, etc.) -->' +
          '<input type="email" name="email" placeholder="your@email.com" required class="email-input" />' +
          '<input type="hidden" name="dog_name" value="' + escapeHtml(score.dogName) + '" />' +
          '<input type="hidden" name="breed" value="' + escapeHtml(score.breed) + '" />' +
          '<input type="hidden" name="risk_level" value="' + score.riskLevel.label + '" />' +
          '<input type="hidden" name="top_behaviors" value="' + score.topBehaviors.join(",") + '" />' +
          '<button type="submit" class="btn btn-email">Send My Report</button>' +
        '</form>' +
        '<p class="email-note">We\'ll also include tips specific to ' + escapeHtml(score.dogName) + '\'s breed and age. Because we\'re nice like that.</p>' +
      '</div>';

    container.appendChild(emailBlock);

    // Bind form submit
    var form = document.getElementById("email-form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        // PLACEHOLDER: Integrate with email service
        var btn = form.querySelector("button");
        btn.textContent = "Sent! Check your inbox.";
        btn.disabled = true;
        btn.classList.add("btn-success");
      });
    }
  }

  // --- Utilities ---

  function interpolateName(text, dogName) {
    if (!text) return "";
    return text.replace(/\{dog_name\}/g, escapeHtml(dogName || "your dog"));
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  return {
    render: render
  };
})();
