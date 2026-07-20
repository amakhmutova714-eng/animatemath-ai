# AnimateMath AI 🎬

> Turn any math topic into a stunning animated video in seconds — powered by GPT-4o and Manim.

Built for the **OpenAI Hackathon 2026**.

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
User types topic → GPT-4o generates Manim Python code → Manim renders MP4 → returned in ~20s
```

No templates. GPT-4o freely decides the best visualization for every concept.

## Tech stack

- **AI:** OpenAI GPT-4o
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
