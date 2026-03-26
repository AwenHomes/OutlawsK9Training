# Outlaws K9 Training — Behavior Rescue Lead Magnet

An interactive dog behavior assessment that identifies a dog owner's top problem behaviors, calculates a risk score, delivers a personalized mini-action plan, and funnels leads into the 1-on-1 Behavior Rescue Package.

## Quick Start

No build step. No dependencies. Just open `index.html` in a browser.

```bash
# Option 1: Open directly
open index.html

# Option 2: Local server (if you have Python)
python3 -m http.server 8000
# Then visit http://localhost:8000
```

## File Structure

```
index.html          # Single-page app — all 5 sections
css/
  styles.css        # Mobile-first styling (teal/black/red branding)
js/
  quiz-data.js      # Question definitions, behavior database, action plans
  quiz-engine.js    # Scoring logic, state management, flow control
  results.js        # Results rendering, risk gauge, CTA
assets/
  images/           # Placeholder directory for brand images
```

## How It Works

1. **Hero** — Emotional hook triggers urgency, single CTA starts the quiz
2. **Dog Info** (Step 1/3) — Captures name, breed, age
3. **Behavior Selection** (Step 2/3) — Pick up to 3 problem behaviors
4. **Severity Context** (Step 3/3) — Duration, frequency, previous attempts
5. **Personalized Results** — Risk score gauge, top 2 behavior breakdown with action steps, escalation warnings, and CTA for 1-on-1 package

## Scoring Algorithm

- **Base score**: Sum of top 2 behavior weights (each 3–10)
- **Modifiers**: +age (0–3) +duration (0–4) +frequency (0–5) +previous attempts (0–3)
- **Normalized** to 0–100%
- **Risk levels**: Moderate (0–30%), High (31–60%), Critical (61–100%)
- No "Low" tier — every result recommends action

## Placeholders to Customize

Search for `PLACEHOLDER` in the code to find everything that needs customization:

| Placeholder | Location | What to Replace |
|-------------|----------|-----------------|
| Logo image | `index.html` | Add your logo to `assets/images/logo.png` and uncomment |
| Favicon | `index.html` | Add `assets/images/favicon.ico` and uncomment |
| Booking URL | `js/results.js` | Replace `href="#"` on the CTA button with your booking link |
| Email service | `js/results.js` | Integrate form submission with Mailchimp, ConvertKit, etc. |
| Testimonial | `js/results.js` | Replace placeholder testimonial with a real one |
| Spots remaining | `js/results.js` | Update the "5 new clients" count as needed |
| Hero background | `css/styles.css` | Optionally add a background image to the hero section |

## Deployment

This is a static site — deploy anywhere:
- **GitHub Pages**: Push to `main`, enable Pages in repo settings
- **Netlify**: Drag and drop the folder, or connect the repo
- **Any web server**: Upload the files. Done.

## License

Proprietary — Outlaws K9 Training. All rights reserved.
