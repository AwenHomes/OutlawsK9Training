/**
 * Outlaws K9 Training — Behavior Rescue Lead Magnet
 * Quiz Data: Questions, behavior database, and action plan content
 */

const BREEDS_LIST = [
  "German Shepherd", "Labrador Retriever", "Pit Bull / Bully Breed",
  "Golden Retriever", "Australian Shepherd", "Belgian Malinois",
  "Husky", "Rottweiler", "Boxer", "Border Collie",
  "Doberman", "Cane Corso", "Chihuahua", "Dachshund",
  "French Bulldog", "Beagle", "Poodle / Doodle Mix",
  "Mixed Breed / Unknown", "Other"
];

const HIGH_LIABILITY_BREEDS = [
  "Pit Bull / Bully Breed", "Rottweiler", "German Shepherd",
  "Doberman", "Cane Corso", "Belgian Malinois"
];

const QUESTIONS = [
  // --- Section: Dog Info (Step 1 of 3) ---
  {
    id: "dog_name",
    section: "dog-info",
    type: "text",
    prompt: "First things first — what's your dog's name?",
    subtext: "We're going to need it. A lot.",
    placeholder: "e.g., Duke, Bella, Chaos Monster",
    required: true
  },
  {
    id: "breed",
    section: "dog-info",
    type: "text-with-datalist",
    prompt: "What breed is {dog_name}?",
    subtext: "Best guess counts. \"Some kind of brown dog\" is not a breed, but we appreciate the honesty.",
    placeholder: "e.g., German Shepherd, Pit Bull mix",
    datalist: BREEDS_LIST,
    required: true
  },
  {
    id: "age_range",
    section: "dog-info",
    type: "single-select",
    prompt: "How old is {dog_name}?",
    subtext: "This helps us gauge how deep the habits run.",
    options: [
      { label: "Puppy (under 6 months)", value: "puppy", modifier: 0 },
      { label: "Adolescent (6 months – 2 years)", value: "adolescent", modifier: 1 },
      { label: "Adult (2 – 7 years)", value: "adult", modifier: 2 },
      { label: "Senior (7+ years)", value: "senior", modifier: 3 }
    ],
    required: true
  },

  // --- Section: Behavior Selection (Step 2 of 3) ---
  {
    id: "behaviors",
    section: "quiz",
    type: "multi-select",
    maxSelections: 3,
    prompt: "Which of these is {dog_name} putting you through?",
    subtext: "Pick up to 3. We know it's tempting to pick all of them.",
    options: [
      { label: "Aggression toward people", value: "aggression_people", weight: 10, icon: "⚠️" },
      { label: "Aggression toward other dogs", value: "aggression_dogs", weight: 9, icon: "⚠️" },
      { label: "Leash reactivity (lunging, barking on walks)", value: "leash_reactivity", weight: 8, icon: "🔗" },
      { label: "Resource guarding (food, toys, spaces)", value: "resource_guarding", weight: 8, icon: "🦴" },
      { label: "Separation anxiety / destruction", value: "separation_anxiety", weight: 7, icon: "🏠" },
      { label: "Excessive or demand barking", value: "barking", weight: 5, icon: "🔊" },
      { label: "Jumping on people", value: "jumping", weight: 4, icon: "🐾" },
      { label: "Pulling on leash (non-reactive)", value: "leash_pulling", weight: 3, icon: "💪" },
      { label: "Won't come when called (recall)", value: "recall", weight: 4, icon: "👋" },
      { label: "Fearfulness / shut-down behavior", value: "fear", weight: 7, icon: "😰" }
    ],
    required: true
  },

  // --- Section: Severity Context (Step 3 of 3) ---
  {
    id: "duration",
    section: "severity",
    type: "single-select",
    prompt: "How long has {dog_name} been running the household?",
    subtext: "Be honest. We won't judge. (Much.)",
    options: [
      { label: "Just started (under 2 weeks)", value: "new", modifier: 0 },
      { label: "A few weeks to a couple months", value: "weeks", modifier: 1 },
      { label: "3 – 6 months", value: "months", modifier: 2 },
      { label: "6+ months (it's a lifestyle at this point)", value: "chronic", modifier: 4 }
    ],
    required: true
  },
  {
    id: "frequency",
    section: "severity",
    type: "single-select",
    prompt: "How often does the worst behavior happen?",
    subtext: "We're measuring how much of your sanity is left.",
    options: [
      { label: "Rarely (once a week or less)", value: "rare", modifier: 0 },
      { label: "A few times a week", value: "moderate", modifier: 1 },
      { label: "Daily", value: "daily", modifier: 3 },
      { label: "Multiple times a day (send help)", value: "constant", modifier: 5 }
    ],
    required: true
  },
  {
    id: "previous_attempts",
    section: "severity",
    type: "single-select",
    prompt: "Have you tried to fix this before?",
    subtext: "No shame. YouTube University has a terrible graduation rate.",
    options: [
      { label: "No, this is my first time seeking help", value: "none", modifier: 0 },
      { label: "YouTube / online tips (didn't stick)", value: "diy", modifier: 1 },
      { label: "Group classes (didn't address the real issue)", value: "group", modifier: 2 },
      { label: "Another trainer (didn't work or made it worse)", value: "trainer", modifier: 3 }
    ],
    required: true
  }
];

/**
 * Behavior content database — consequences, action steps, escalation warnings.
 * Uses {dog_name} as a placeholder replaced at render time.
 */
const BEHAVIOR_DATABASE = {
  aggression_people: {
    title: "Human-Directed Aggression",
    subtitle: "This is the one that keeps us up at night, too.",
    consequence:
      "This is the #1 reason dogs are surrendered to shelters — or worse. " +
      "Every day without intervention, {dog_name}'s bite threshold lowers. " +
      "One incident can mean a lawsuit, a bite quarantine, or a court-ordered euthanasia. " +
      "This isn't a \"phase.\" This is a ticking clock.",
    actionSteps: [
      "Manage the environment immediately — no unsupervised contact with triggers. Zero exceptions.",
      "Stop all punishment-based corrections. They escalate aggression every single time. Yes, every time.",
      "Start a trigger journal: write down what happened 30 seconds BEFORE each incident. The pattern will emerge fast."
    ],
    escalationWarning:
      "Without professional behavior modification, human-directed aggression does NOT self-resolve. " +
      "The average time from \"warning growl\" to \"bite\" is shorter than most owners think. " +
      "This is not a wait-and-see situation."
  },

  aggression_dogs: {
    title: "Dog-Directed Aggression",
    subtitle: "No, {dog_name} is not \"just playing rough.\"",
    consequence:
      "Dog parks, vet visits, walks in the neighborhood — all of it becomes a minefield. " +
      "Other owners WILL call animal control. {dog_name} is one off-leash encounter " +
      "away from a fight that could cost thousands in vet bills — or end a life. " +
      "And that liability? It's on you.",
    actionSteps: [
      "Avoid ALL uncontrolled dog-dog interactions immediately. No dog parks. No on-leash \"greetings.\" None.",
      "Create distance: cross the street, turn around, use visual barriers. Distance is your best friend right now.",
      "Start a \"look at me\" foundation exercise at home with zero distractions. Build from there. Not the other way around."
    ],
    escalationWarning:
      "Dog aggression worsens with each rehearsal. Every time {dog_name} lunges, barks, or makes contact, " +
      "the behavior becomes more automatic. The brain is literally rewiring itself to react. Time is not on your side."
  },

  leash_reactivity: {
    title: "Leash Reactivity",
    subtitle: "Walks used to be fun. We remember those days, too.",
    consequence:
      "Your daily walks have become a source of dread — for both of you. {dog_name} is flooding with " +
      "stress hormones every single walk, making the behavior worse each time you go out. " +
      "Most owners stop walking their dog entirely. Which creates a whole new set of problems. " +
      "It's a fun little doom spiral.",
    actionSteps: [
      "Find {dog_name}'s threshold distance (how far away can triggers be before the meltdown starts?). Walk ONLY below that threshold.",
      "Ditch the retractable leash yesterday. Use a fixed 6ft leash and front-clip harness.",
      "Try 15-minute decompression walks in low-traffic areas. Just sniffing. No commands. Let {dog_name}'s brain come down."
    ],
    escalationWarning:
      "Reactivity left unaddressed becomes aggression in a significant percentage of dogs. " +
      "The longer {dog_name} practices this behavior, the harder the rewiring. " +
      "Every reactive episode is a training session — just not the kind you want."
  },

  resource_guarding: {
    title: "Resource Guarding",
    subtitle: "No, taking it away does not \"teach them.\" It teaches the opposite.",
    consequence:
      "Resource guarding is one of the most misunderstood behaviors out there. " +
      "The common advice to \"take things away to show dominance\" makes it dramatically worse. Every. Time. " +
      "{dog_name} is communicating fear of loss — and the wrong response proves that fear is justified. " +
      "This escalates in a very predictable, very dangerous pattern.",
    actionSteps: [
      "STOP taking things from {dog_name}'s mouth to \"teach\" them. This intensifies guarding every single time.",
      "Begin trading exercises: approach with something BETTER, trade, then return the original item. Build trust, not conflict.",
      "Feed meals by hand for 5 days to rebuild the association: human approaching = good things happen."
    ],
    escalationWarning:
      "Guarding escalates in a predictable pattern: stiffening → whale eye → growl → snap → bite. " +
      "If you're already past the growl stage, professional help is not optional. It's overdue."
  },

  separation_anxiety: {
    title: "Separation Anxiety",
    subtitle: "It's not spite. It's panic. There's a big difference.",
    consequence:
      "This is not {dog_name} \"being bad\" while you're gone. This is a genuine panic disorder. " +
      "{dog_name} goes into fight-or-flight every time you leave. The destruction, the barking, " +
      "the self-injury — it's all panic. Not revenge. Not boredom. Panic. " +
      "And it will cost you your lease, your security deposit, or what's left of your sanity.",
    actionSteps: [
      "Start absences at SECONDS, not minutes. Open the door, step out, step back in. Repeat 10 times a day. Yes, really.",
      "Remove departure cues: pick up keys randomly, put on shoes and sit back down. Break the pattern that triggers the panic.",
      "Provide a frozen Kong or lick mat 5 minutes BEFORE you leave — not as you walk out the door. Timing matters."
    ],
    escalationWarning:
      "Separation anxiety does not get better with exposure. Leaving {dog_name} alone \"so they learn\" " +
      "is flooding — it makes the panic worse and can lead to self-harm. " +
      "This is the one behavior where good intentions consistently make things worse without guidance."
  },

  barking: {
    title: "Excessive / Demand Barking",
    subtitle: "Your neighbors have opinions. We can tell.",
    consequence:
      "Neighbors are getting annoyed. You might already be getting noise complaints. " +
      "But here's the real problem: every time {dog_name} barks and ANYTHING happens — " +
      "you look, you yell \"quiet,\" you give in — the barking gets reinforced. " +
      "You're in an escalation cycle, and {dog_name} is winning. Loudly.",
    actionSteps: [
      "Identify the function: is it demand, alert, fear, or boredom? Each one has a completely different fix.",
      "For demand barking: absolute zero response. No eye contact, no \"shh,\" nothing. Wait for 2 seconds of silence, THEN reward.",
      "Add 20 minutes of mental enrichment daily — puzzle feeders, sniff work, training games. A tired brain is a quiet brain."
    ],
    escalationWarning:
      "Barking met with yelling or punishment escalates to anxiety-based barking, " +
      "which is significantly harder to resolve. You're essentially teaching {dog_name} that " +
      "barking starts a yelling match. Dogs love yelling matches."
  },

  jumping: {
    title: "Jumping on People",
    subtitle: "\"He's friendly!\" — Famous last words.",
    consequence:
      "It seems harmless until {dog_name} knocks over a child, an elderly person, or your boss. " +
      "A \"friendly\" jump can result in injuries and liability you didn't see coming. " +
      "And every single person who pets {dog_name} mid-jump is training the behavior deeper. " +
      "Your dog is crowd-sourcing reinforcement. It's actually impressive.",
    actionSteps: [
      "Four-on-the-floor rule: {dog_name} gets ZERO attention unless all four paws are on the ground. No exceptions. Not even cute ones.",
      "Turn your back and go silent the INSTANT jumping starts. No pushing, no knee, no words. Become a very boring tree.",
      "Pre-empt greetings: ask for a sit BEFORE the person approaches. Reward the sit. Make sitting more profitable than jumping."
    ],
    escalationWarning:
      "Jumping is a gateway behavior. Dogs that learn they can control humans with physical contact " +
      "often develop more serious demand behaviors. It's not \"just jumping\" — it's practice for bigger problems."
  },

  leash_pulling: {
    title: "Leash Pulling",
    subtitle: "You didn't sign up to be a sled. We get it.",
    consequence:
      "Walks are supposed to be the highlight of {dog_name}'s day — and yours. Instead, " +
      "you're getting dragged down the block like a reluctant water skier. " +
      "Chronic pulling leads to trachea damage (collar) or shoulder injuries (you). " +
      "Most owners reduce walks, which means a more pent-up, more reactive, more destructive dog at home.",
    actionSteps: [
      "Switch to a front-clip harness immediately. Not a prong. Not a choke. Those suppress behavior without teaching anything.",
      "Red-light / green-light method: the INSTANT the leash goes tight, you stop. Completely. Movement is the reward.",
      "Practice leash pressure exercises indoors first: slight pressure on the leash = treat when {dog_name} moves toward you."
    ],
    escalationWarning:
      "Pulling itself is lower-risk, but the frustration it creates often leads owners " +
      "to reach for aversive tools that cause fallout behaviors — fear, reactivity, shutdown. " +
      "The tool isn't the fix. The skill is."
  },

  recall: {
    title: "Unreliable Recall",
    subtitle: "The classic \"I'll come when I feel like it\" dog.",
    consequence:
      "A dog that won't come when called is a dog one open door away from tragedy. " +
      "Traffic. Other dogs. Wildlife. A really interesting squirrel. " +
      "{dog_name} has no safety net without recall. " +
      "This is not a convenience behavior. It's a life-saving one. Treat it that way.",
    actionSteps: [
      "Use a 20-30ft long line for ALL outdoor practice. {dog_name} is not off-leash material until recall hits 95%+. Non-negotiable.",
      "Make recall the BEST thing that ever happens. Party-level rewards. Every. Single. Time. Make yourself worth running to.",
      "Never call {dog_name} for something unpleasant — bath, crate, leaving the park. Go get them instead. Don't poison the cue."
    ],
    escalationWarning:
      "Every time {dog_name} ignores a recall and self-rewards (keeps sniffing, keeps running), " +
      "the behavior of ignoring you gets stronger. You're training \"don't come\" without realizing it."
  },

  fear: {
    title: "Fearfulness / Shut-Down Behavior",
    subtitle: "\"Shy\" is not a personality. It's a stress response.",
    consequence:
      "A fearful dog is a suffering dog. {dog_name} is not \"just shy\" or \"a little nervous\" — " +
      "they're living in a chronic stress state that affects every moment of their life. " +
      "Fear is also the #1 underlying cause of aggression. " +
      "A dog that shuts down today may bite tomorrow when shutting down stops working.",
    actionSteps: [
      "Never force {dog_name} to \"face their fears.\" Flooding creates trauma, not confidence. Full stop.",
      "Let {dog_name} choose: offer the scary thing at a safe distance and reward ANY voluntary engagement. Choice builds confidence.",
      "Create a safe space at home — covered crate, quiet room — where {dog_name} is never disturbed. Everyone needs a place to decompress."
    ],
    escalationWarning:
      "Fear does not resolve with \"time and love\" alone. Without structured desensitization, " +
      "fearful dogs either stay miserable or escalate to fear-based aggression. " +
      "The kindest thing you can do is get professional help. Waiting is not kindness — it's avoidance."
  }
};

// Max possible score for normalization
const MAX_SCORE = 35; // top2 behaviors (10+10) + age(3) + duration(4) + frequency(5) + attempts(3)

// Risk level thresholds — note: there is no "Low" tier. Everyone needs help.
const RISK_LEVELS = [
  { min: 0, max: 30, label: "Moderate", color: "#eab308", className: "moderate" },
  { min: 31, max: 60, label: "High", color: "#f97316", className: "high" },
  { min: 61, max: 100, label: "Critical", color: "#dc2626", className: "critical" }
];

// Aggression/reactivity behavior keys (used for breed liability flag)
const AGGRESSION_BEHAVIORS = ["aggression_people", "aggression_dogs", "leash_reactivity", "resource_guarding"];
