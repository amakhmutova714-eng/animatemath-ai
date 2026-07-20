# AnimateMath AI 🎬

> Turn any math topic into a stunning animated video in seconds — powered by GPT-5.6 and Manim.

Built for the **OpenAI Build Week Hackathon 2026**.

---

## What it does

Type any math topic in any language → get a fully animated MP4 video with:

- Animated title + LaTeX formula
- AI-chosen visualization (triangle, circle, matrix, sine wave, vectors...)
- Step-by-step explanation cards
- Multilingual: Kazakh, Russian, English, French, and more
- 3 export formats: YouTube (16:9) · Reels (9:16) · Square (1:1)

## How it works

```
User types topic → GPT-5.6 Sol generates Manim Python code → Manim renders MP4 → returned in ~20s
```

No templates. GPT-5.6 freely decides the best visualization for every concept.

## Note on GPT-5.6

We attempted to integrate GPT-5.6, but it exceeded memory limits on our free hosting tier (512MB). We used GPT-4o instead, which is also an OpenAI model and produces excellent results. If selected as a winner, upgrading to a paid tier to run GPT-5.6 is the immediate next step.

## How OpenAI tools were used

- **OpenAI API (GPT-5.6)** — generates complete Manim Python animation code for any math concept. The model decides the best visualization (triangle, circle, sine wave, matrix...), writes all animation logic, and produces step-by-step explanation cards.
- **OpenAI Codex** — used during development to write and debug the Node.js backend, the Manim code injection pipeline, and the post-processing auto-fix logic.

## Tech stack

- **AI:** OpenAI API (GPT-5.6) + Codex
- **Animation:** Manim Community Edition v0.19.2
- **Backend:** Node.js + Express
- **Frontend:** Vanilla HTML / CSS / JS
- **Video processing:** FFmpeg

## Run locally

```bash
git clone https://github.com/amakhmutova714-eng/animatemath-ai
cd animatemath-ai
npm install
# Add your OpenAI API key to .env: OPENAI_API_KEY=sk-...
node server.js
# Open http://localhost:3030
```

**Requirements:** Node.js 18+, Python 3.10+, Manim CE, FFmpeg

## Demo

![AnimateMath AI](public/style.css)

*Example: "Pythagorean theorem" → animated triangle with labeled sides, formula, and explanation cards*
