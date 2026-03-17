# Mesenet.hu 🪄 AI Story Generation Pipeline ✨

A high-performance Progressive Web App (PWA) built in a 24-hour sprint. This project replaces a traditional 12-week agency content pipeline. 🧚

**Live Demo:** [mesenet.hu](https://mesenet.hu) 🦋  
**Full Case Study:** [How Far AI Gets You in 24 Hours](https://sandorkardos.com/projects/how-far-ai-gets-you-in-24-hours-the-mesenet-hu-pwa-case-study/) 📜

***

## 🏗 Architecture 🏰
High-quality, safe content generation at scale. Strict decoupling between the data layer and the presentation layer prevents architectural drift. 🍃

* **Backend (Python):** Scrapes raw data and orchestrates the pipeline. 🦋
* **LLM Layer (Claude 4.6 Sonnet):** Rewrites stories using child psychology and pedagogical guidelines. 📜
* **Image Gen (Gemini 3 Flash):** Generates consistent 3:4 vertical illustrations for a mobile-first experience. 🎨
* **Frontend (React 19 + Vite 7):** Lightweight PWA UI optimized for readability. 🏰
* **Hosting:** Self-hosted on a Plesk VPS with a headless WordPress and MySQL backend. 🌌

## ✅ Verification and Reliability ❇️
Speed meets stability. This project maintains a 100% Green baseline verified by automated CI/CD. 🧚

* **12/12 Playwright Tests Passed:** Automated Ultimate Health Audit verifies branding, carousels, and assets in 10.3s. ❇️
* **Cross-Browser Verified:** Native testing on Chromium, Firefox, Webkit, and Mobile Safari. 📱
* **A11y Audit:** Integrated @axe-core/playwright ensures a safe, accessible experience for children. 🍄
* **Security Hardened:** High-severity RCE vulnerabilities patched via npm overrides (serialize-javascript v7.0.4+). 🛡️

## 🛠 Tech Stack 🧙‍♂️
* **Frontend:** React 19, Vite 7, Tailwind CSS, Workbox (PWA), Playwright. 🌿
* **Backend:** Python (Scrapy, BeautifulSoup), PHP (Custom REST Endpoints). 🍃
* **Database:** MySQL (Headless WP REST API). 🗝️
* **AI:** Claude 4.6 Sonnet, Gemini 3 Flash, Nano Banana 2. 🪄

## ⚡ Key Engineering Challenges 🌿
* **Hydration Mismatch Fix:** Resolved React 19 production UI ghosting by ensuring non-deterministic elements initialize after client-side mount. 🌙
* **Architecture Drift:** Prevented code bloat by enforcing strict Domain Isolation between Python and React. 🍃
* **PWA Lifecycle:** Custom Workbox configuration for offline reading and reliable Install to Home Screen functionality. 🕊️

## 📈 The Result 🌟
Reduced the cost of a full production pipeline from an estimated £13,000 to zero operational cost (API usage only). 24-hour time-to-market achieved. 🕊️

***

## ❤️ Special Thanks 🌟
Project built with support from these communities:
* [EdinburghJS](https://www.edinburghjs.org/) 🦄
* [Scottish Technology Club](https://www.scottishtechnology.club) 🏰

***
*Note: Active Build in Public project. Work in Progress (WIP).* 🪄✨
