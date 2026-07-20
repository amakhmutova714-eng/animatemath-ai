const express  = require('express');
const { OpenAI } = require('openai');
const cors     = require('cors');
const { execSync } = require('child_process');
const path     = require('path');
const fs       = require('fs');
require('dotenv').config();

const app    = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/renders', express.static(path.join(__dirname, 'renders')));

const TMP_DIR     = path.join(__dirname, 'tmp');
const RENDERS_DIR = path.join(__dirname, 'renders');
[TMP_DIR, RENDERS_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d); });

const SYSTEM_PROMPT = `You are an elite Manim CE v0.19.2 animator. You produce PREMIUM, CINEMATIC math videos — dark backgrounds, vibrant multi-color graphics, smooth camera moves, glow effects. Every video must look like it belongs on a high-end math SaaS platform.

LANGUAGE: Detect the prompt language. Write ALL Text() in that language (Kazakh/Russian/English/Spanish/etc). Only LaTeX in MathTex.


RULES (never break):
• class AnimationScene(MovingCameraScene)
• from manim import *  only
• 30-45 seconds. Return ONLY Python code, no markdown.
• FORBIDDEN: Axes(...,background_line_style=...) | AnyObj(opacity=X) | AnimationGroup(*l,lag_ratio=X) | FadeIn(o,rate_func=X)
• Use LaggedStart(*list, lag_ratio=X) instead of AnimationGroup

═══════════════════════════════════════════════
PREMIUM VISUAL REQUIREMENTS — ALL MANDATORY:
═══════════════════════════════════════════════

1. BACKGROUND — rich dark, NOT pure black:
   config.background_color = ManimColor("#0d1b2a")  # or #0d2010 / #1a0a2e / #0a0a1e / #0d1520

2. MULTI-COLOR PALETTE — use 3-4 colors minimum:
   C1 = ManimColor("#a855f7")   # purple
   C2 = ManimColor("#fb923c")   # orange
   C3 = ManimColor("#10b981")   # green
   C4 = ManimColor("#ff4fa3")   # pink
   C5 = ManimColor("#ffd200")   # yellow
   C6 = ManimColor("#63b3ff")   # blue

3. GRADIENT CURVES — set_color_by_gradient for main curves:
   curve.set_color_by_gradient(ManimColor("#a855f7"), ManimColor("#ff4fa3"), ManimColor("#fb923c"))

4. DOUBLE GLOW — two glow layers on every main curve:
   glow_outer = curve.copy().set_stroke(width=22, opacity=0.10)
   glow_inner = curve.copy().set_stroke(width=12, opacity=0.20)
   self.add(glow_outer, glow_inner)

5. MOVING DOT on curve (premium effect):
   t_tracker = ValueTracker(0)
   dot = always_redraw(lambda: Dot(
       curve.point_from_proportion(t_tracker.get_value() % 1),
       color=WHITE, radius=0.12
   ).set_z_index(3))
   self.add(dot)
   self.play(t_tracker.animate.set_value(1), run_time=4, rate_func=linear)

6. AXES — thin, semi-transparent:
   axes = Axes(x_range=[...], y_range=[...],
       axis_config={"color": ManimColor("#334155"), "stroke_width": 1.5})
   grid = NumberPlane(background_line_style={
       "stroke_color": ManimColor("#ffffff"), "stroke_opacity": 0.04, "stroke_width": 1})

7. AXIS LABELS — always add x/y labels:
   xl = MathTex("x", color=ManimColor("#64748b"), font_size=26).next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
   yl = MathTex("y", color=ManimColor("#64748b"), font_size=26).next_to(axes.y_axis.get_end(), UP, buff=0.1)

8. TITLE — always gradient color:
   title = Text("...", font_size=42, weight=BOLD)
   title.set_color_by_gradient(ManimColor("#63b3ff"), ManimColor("#ff4fa3"))
   title.scale_to_fit_width(9)
   title.to_edge(UP, buff=0.25)

   EQUATION — gold/yellow, prominent:
   eq = MathTex(r"formula", color=ManimColor("#ffd200"), font_size=44)
   eq.to_edge(UP, buff=0.25)

9. CAMERA MOVES — MANDATORY in ALL formats including vertical:
   # Zoom IN on the mathematically KEY moment (peak of curve, intersection, critical point):
   focus = axes.c2p(key_x, key_y)  # the most important point of the problem
   self.play(self.camera.frame.animate.scale(0.72).move_to(focus), run_time=2)
   self.wait(1.5)
   self.play(self.camera.frame.animate.scale(1/0.72).move_to(ORIGIN), run_time=1.5)
   # For vertical (Reels): scale(0.75) only — never below 0.65 to avoid losing content

10. LAYOUT SAFETY — ZERO TOLERANCE FOR OVERLAP:

   Frame: 14.2 wide × 8 tall. y=0 is center. Top edge ≈+4, bottom ≈-4.

   ══ THREE STRICT ZONES — NEVER MIX ELEMENTS BETWEEN ZONES ══

   TITLE ZONE     y ∈ [2.8, 4.0]:
     title.to_edge(UP, buff=0.25)
     ALWAYS: title.scale_to_fit_width(9)

   EQUATION ZONE  y ∈ [1.8, 2.8]:
     eq.next_to(title, DOWN, buff=0.12)
     ALWAYS: eq.scale_to_fit_width(8)  font_size=38

   CENTER ZONE    y ∈ [-2.0, 1.5]  → axes / graphs / shapes ONLY:
     MANDATORY: axes.move_to([0, -0.5, 0])   ← shift axes down so they never touch eq
     MANDATORY: y_length ≤ 4.0               ← axes top stops at y≈1.5, below equation
     MANDATORY: x_length ≤ 9.5

   BOTTOM ZONE    y ∈ [-4.0, -2.5]:
     lbl.to_corner(DL, buff=0.3)   font_size ≤ 22
     ins.to_corner(DR, buff=0.3)   font_size ≤ 20

   ══ MANDATORY SEQUENCING ══
   • FadeOut any subtitle/description text BEFORE showing the graph.
   • Title and equation MAY stay while graph is shown — they live in separate zones.
   • NEVER place any Text inside the axes/center zone. Only DL/DR corners for labels.
   • NEVER stack two elements in the same zone without explicit vertical separation.

   ══ STEP LABEL GOLDEN RULE — NEVER VIOLATE ══
   Create exactly ONE label variable. To change it, use Transform — NEVER rebind:

   WRONG (leaves ghost text, causes overlap):
     lbl = Text("Step 1", ...).to_corner(DL, buff=0.3)
     self.play(FadeIn(lbl))
     lbl = Text("Step 2", ...).to_corner(DL, buff=0.3)   ← WRONG: old stays on screen!
     self.play(FadeIn(lbl))

   CORRECT pattern (always do this):
     lbl = Text("Step 1", color=C_SLATE, font_size=22).to_corner(DL, buff=0.3)
     self.play(FadeIn(lbl))
     # to update:
     self.play(Transform(lbl, Text("Step 2", color=C_SLATE, font_size=22).to_corner(DL, buff=0.3)))
     # to update again:
     self.play(Transform(lbl, Text("Step 3", color=C_SLATE, font_size=22).to_corner(DL, buff=0.3)))

   Same rule applies to insight text and ANY text you show and then want to change.
   ════════════════════════════════════════════

   GEOMETRIC SHAPES (Square, Rectangle, Triangle, Polygon, etc.):
   • Max side_length = 1.8 for a single shape. Never use side_length > 2.
   • When showing multiple shapes side-by-side (e.g. Pythagorean squares):
     - Create each shape, put them in a VGroup, call .arrange(RIGHT, buff=0.25)
     - Then call .scale_to_fit_width(7.0).move_to([0, -0.3, 0])
     - This ensures all shapes fit together within the center zone.
   • Right triangles: use Polygon with max coordinate span of 2.0 units.
   • NEVER place shapes at raw coordinates without checking frame bounds.
   • After creating any Polygon/Square/Circle, always call .move_to(ORIGIN) or
     explicitly position with .shift() within the safe zone.

   TEXT ON SHAPES: font_size ≤ 24. Call .scale_to_fit_width(shape.width - 0.2).
   LABELS NEXT TO SHAPES: use .next_to(shape, direction, buff=0.15), max font_size=22.

═══════════════════════════════════════════════
COMPLETE WORKING EXAMPLE (study every detail):
═══════════════════════════════════════════════
from manim import *

class AnimationScene(MovingCameraScene):
    def construct(self):
        config.background_color = ManimColor("#0d1b2a")

        # Colors
        C_PURPLE = ManimColor("#a855f7")
        C_ORANGE = ManimColor("#fb923c")
        C_GREEN  = ManimColor("#10b981")
        C_YELLOW = ManimColor("#ffd200")
        C_SLATE  = ManimColor("#94a3b8")

        # Grid + Axes
        grid = NumberPlane(background_line_style={
            "stroke_color": ManimColor("#ffffff"), "stroke_opacity": 0.04, "stroke_width": 1})
        axes = Axes(
            x_range=[-4, 4, 1], y_range=[-1.5, 1.5, 1],
            axis_config={"color": ManimColor("#334155"), "stroke_width": 1.5})
        xl = MathTex("x", color=C_SLATE, font_size=26).next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        yl = MathTex("y", color=C_SLATE, font_size=26).next_to(axes.y_axis.get_end(), UP, buff=0.1)
        self.play(FadeIn(grid), Write(axes), Write(xl), Write(yl), run_time=1.5)

        # Title + equation (top zone, fixed)
        title = Text("Sine & Cosine", font_size=42, weight=BOLD)
        title.set_color_by_gradient(ManimColor("#63b3ff"), ManimColor("#ff4fa3"))
        title.scale_to_fit_width(9)
        title.to_edge(UP, buff=0.2)
        eq = MathTex(r"f(x)=\sin(x),\quad g(x)=\cos(x)", color=C_YELLOW, font_size=36)
        eq.next_to(title, DOWN, buff=0.2)
        self.play(Write(title), run_time=1.2)
        self.play(Write(eq), run_time=1.8)

        sub = Text("Two fundamental periodic functions", color=C_SLATE, font_size=22).next_to(eq, DOWN, buff=0.18)
        self.play(FadeIn(sub, shift=UP*0.1))
        self.wait(1.8)
        self.play(FadeOut(sub))

        # Step 1 — key points
        lbl = Text("Key points on sin(x)", color=C_SLATE, font_size=22).to_corner(DL, buff=0.3)
        self.play(FadeIn(lbl))
        kx = [0, PI/2, PI, 3*PI/2, 2*PI]
        ky = [np.sin(x) for x in kx]
        kdots = VGroup(*[Dot(axes.c2p(x, y), color=C_YELLOW, radius=0.1) for x,y in zip(kx,ky)])
        klines = VGroup(*[DashedLine(axes.c2p(x,0), axes.c2p(x,y),
                           color=C_YELLOW, stroke_width=1.2, stroke_opacity=0.6) for x,y in zip(kx,ky)])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in kdots], lag_ratio=0.2))
        self.play(LaggedStart(*[Create(l) for l in klines], lag_ratio=0.15))
        self.wait(0.6)

        # Step 2 — draw sine with gradient + glow + moving dot
        self.play(Transform(lbl, Text("Drawing sin(x) — purple", color=C_SLATE, font_size=22).to_corner(DL, buff=0.3)))
        sin_curve = axes.plot(lambda x: np.sin(x), x_range=[-4,4], stroke_width=4)
        sin_curve.set_color_by_gradient(C_PURPLE, ManimColor("#ff4fa3"), C_ORANGE)
        glow_o = sin_curve.copy().set_stroke(width=22, opacity=0.10)
        glow_i = sin_curve.copy().set_stroke(width=11, opacity=0.22)
        self.add(glow_o, glow_i)

        t_tr = ValueTracker(0)
        mdot = always_redraw(lambda: Dot(
            sin_curve.point_from_proportion(min(t_tr.get_value(), 0.9999)),
            color=WHITE, radius=0.13).set_z_index(3))
        self.add(mdot)
        self.play(Create(sin_curve), t_tr.animate.set_value(1), run_time=3.5, rate_func=linear)
        self.wait(0.4)
        self.remove(mdot)

        # Step 3 — draw cosine
        self.play(Transform(lbl, Text("Adding cos(x) — orange", color=C_SLATE, font_size=22).to_corner(DL, buff=0.3)))
        cos_curve = axes.plot(lambda x: np.cos(x), x_range=[-4,4], stroke_width=3, color=C_ORANGE)
        glow_c = cos_curve.copy().set_stroke(width=16, color=C_ORANGE, opacity=0.18)
        self.add(glow_c)
        self.play(Create(cos_curve), run_time=2.5)

        # Insight
        ins = Text("sin²(x) + cos²(x) = 1  ← Pythagorean identity", color=C_GREEN, font_size=20).to_corner(DR, buff=0.3)
        self.play(FadeIn(ins, shift=LEFT*0.15))
        self.wait(1)

        # Phase 4 — camera zoom + highlight
        self.play(self.camera.frame.animate.scale(0.72).move_to(axes.c2p(PI/2, 0)), run_time=1.8)
        self.play(Indicate(eq), run_time=1)
        self.wait(0.5)
        self.play(self.camera.frame.animate.scale(1/0.72).move_to(ORIGIN), run_time=1.2)

        # Phase 5 — outro
        outro = Text("AnimateMath AI", color=ManimColor("#475569"), font_size=20).to_edge(DOWN, buff=0.3)
        self.play(FadeIn(outro, shift=UP*0.1))
        self.wait(2)
        self.play(FadeOut(Group(*self.mobjects)))

Adapt this exact premium style to the user's topic. More colors = more beautiful. Always include gradient curves, double glow, moving dot, camera zoom.`;

function wrapText(text, maxChars) {
  const t = String(text || '');
  if (t.length <= maxChars) return t;
  const words = t.split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    if (cur.length + w.length + 1 > maxChars && cur) { lines.push(cur.trim()); cur = w + ' '; }
    else cur += w + ' ';
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.join('\n');
}

function detectFormat(prompt) {
  const p = prompt.toLowerCase();
  if (/reels|shorts|portrait|vertical|рилс|вертикал|тік|9.16/i.test(p))
    return { w: 1080, h: 1920, name: 'vertical', hint: 'PORTRAIT 9:16 Reels/Shorts. Use Scene (not MovingCameraScene). Phase-based layout, each element large and sequential.' };
  if (/youtube|ютуб|16.9|landscape|горизон|horizontal|widescreen/i.test(p))
    return { w: 1920, h: 1080, name: 'landscape', hint: 'HORIZONTAL 16:9 format (YouTube). Standard layout, wide axes x_range=[-5,5], font_size up to 48.' };
  if (/square|квадрат|1.1|instagram.post/i.test(p))
    return { w: 1080, h: 1080, name: 'square', hint: 'SQUARE 1:1 format. Keep x_range=[-3,3], y_range=[-3,3]. font_size≤36. Center everything.' };
  return { w: 854, h: 480, name: 'default', hint: '' };
}

function injectConfig(code, fmt) {
  const fps = fmt.name === 'vertical' ? 24 : 30;
  const configBlock =
    `config.pixel_width  = ${fmt.w}\n` +
    `config.pixel_height = ${fmt.h}\n` +
    `config.frame_rate   = ${fps}\n`;
  return code.replace(/^(from manim import \*\s*\n)/m, `$1${configBlock}`);
}

// Auto-scale font sizes, axis ranges, shape sizes to fit the target format
function scaleForFormat(code, fmt) {
  // ── helpers ──────────────────────────────────────────────────────────────
  const clampFontSize = (maxSize) =>
    code = code.replace(/font_size\s*=\s*(\d+)/g, (m, n) => {
      const s = parseInt(n);
      if (s > maxSize * 1.5) return `font_size=${Math.round(s * 0.50)}`;
      if (s > maxSize * 1.1) return `font_size=${Math.round(s * 0.72)}`;
      return m;
    });

  const clampSideLength = (maxSide) =>
    code = code.replace(/side_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) => {
      const s = parseFloat(n);
      return s > maxSide ? `side_length=${maxSide}` : m;
    });

  const clampWidthHeight = (maxVal) => {
    code = code.replace(/(?<!\w)width\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > maxVal ? `width=${maxVal}` : m);
    code = code.replace(/(?<!\w)height\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > maxVal ? `height=${maxVal}` : m);
  };

  const clampXRange = (maxAbs) =>
    code = code.replace(/x_range\s*=\s*\[\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/g, (m, lo, hi) => {
      const l = parseFloat(lo), h = parseFloat(hi);
      if (l < -maxAbs || h > maxAbs) return `x_range=[${Math.max(l,-maxAbs)}, ${Math.min(h,maxAbs)}`;
      return m;
    });

  // ── per-format rules ──────────────────────────────────────────────────────
  if (fmt.name === 'vertical') {
    // Frame 4.5 wide × 8 tall — clamp WIDTH, use full HEIGHT
    clampFontSize(58);       // allow large fonts (52-56 recommended)
    clampSideLength(2.0);
    clampWidthHeight(3.8);   // objects can't be wider than frame
    clampXRange(2.2);        // x axis stays narrow
    // x_length: fit the narrow width
    code = code.replace(/x_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > 4.0 ? `x_length=3.8` : m);
    // y_length: must be BIG to fill tall frame — boost if too small
    code = code.replace(/y_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) => {
      const v = parseFloat(n);
      if (v < 5.0) return `y_length=6.0`;   // too small → fill the height
      if (v > 7.5) return `y_length=7.0`;   // cap at 7
      return m;
    });
    // In vertical, zoom scale must be subtle (0.7-0.85 range) to not lose content
    code = code.replace(/self\.camera\.frame\.animate\.scale\(\s*([\d.]+)\s*\)/g, (m, s) => {
      const v = parseFloat(s);
      if (v < 0.5) return `self.camera.frame.animate.scale(0.75)`;  // too extreme
      if (v > 1.5) return `self.camera.frame.animate.scale(1.1)`;   // zoom out slightly
      return m;
    });
  }

  if (fmt.name === 'square') {
    // Frame ~8 × 8 units
    clampFontSize(34);
    clampSideLength(2.0);
    clampWidthHeight(3.5);
    clampXRange(3.0);
  }

  if (fmt.name === 'default') {
    // Frame ~14.2 × 8 — still guard against very large shapes/fonts
    clampFontSize(44);
    clampSideLength(2.0);
    clampWidthHeight(4.0);
    // Clamp axes to CENTER zone so they never reach title/equation zone
    code = code.replace(/y_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > 4.2 ? `y_length=4.0` : m);
    code = code.replace(/x_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > 9.6 ? `x_length=9.0` : m);
  }

  if (fmt.name === 'landscape') {
    // Frame ~14.2 × 8 — wide, so be generous
    clampFontSize(52);
    clampSideLength(2.5);
    clampWidthHeight(5.0);
    // Clamp axes to CENTER zone
    code = code.replace(/y_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > 4.2 ? `y_length=4.0` : m);
    code = code.replace(/x_length\s*=\s*(\d+(?:\.\d+)?)/g, (m, n) =>
      parseFloat(n) > 9.6 ? `x_length=9.0` : m);
  }

  return code;
}

function fixCode(code) {
  // 1. Strip invalid kwargs from constructors line-by-line
  const BAD_AXES_KWARGS = /background_line_style\s*=/;
  const BAD_CONSTRUCTOR_KWARGS = /^\s*(opacity|rate_func)\s*=\s*[^,)]+,?\s*$/;

  const lines = code.split('\n');
  const result = [];
  let insideConstructor = null; // 'axes' or null
  let parenDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/\bAxes\s*\(/.test(line)) insideConstructor = 'axes';

    if (insideConstructor === 'axes') {
      for (const ch of line) {
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
      }
      // Drop background_line_style from Axes()
      if (BAD_AXES_KWARGS.test(line)) continue;
      result.push(line);
      if (parenDepth <= 0) { insideConstructor = null; parenDepth = 0; }
      continue;
    }

    // Strip standalone bad kwargs in any constructor (opacity=X on its own line)
    if (BAD_CONSTRUCTOR_KWARGS.test(line)) continue;

    result.push(line);
  }

  let joined = result.join('\n')
    // Fix single-line NumberPlane/etc with bare opacity= kwarg
    .replace(/(\w+)\s*\(\s*opacity\s*=\s*[\d.]+\s*\)/g, '$1()')
    // Fix AnimationGroup with lag_ratio → LaggedStart
    .replace(/AnimationGroup\s*\((\*\[[\s\S]*?\]),\s*lag_ratio\s*=\s*([\d.]+)\)/g,
             (_, inner, ratio) => `LaggedStart(${inner}, lag_ratio=${ratio})`)
    // Ensure MovingCameraScene (vertical format uses Scene separately via buildVerticalCode)
    .replace(/class AnimationScene\(Scene\)/, 'class AnimationScene(MovingCameraScene)');

  // Fix ghost-text overlap: when a variable is reassigned to a new Text/MathTex
  // and then FadeIn'd again (instead of Transform), insert a FadeOut before the reassignment.
  // Pattern: variable = Text/MathTex(...) followed later by self.play(FadeIn(variable))
  // when that variable was already FadeIn'd before.
  const codeLines2 = joined.split('\n');
  const seenFadeIn = new Set();
  const out2 = [];
  for (let i = 0; i < codeLines2.length; i++) {
    const ln = codeLines2[i];
    // Detect rebinding: "    varname = Text(" or "    varname = MathTex("
    const rebind = ln.match(/^(\s+)(\w+)\s*=\s*(?:Text|MathTex|Tex|MarkupText)\s*\(/);
    if (rebind) {
      const varName = rebind[2];
      if (seenFadeIn.has(varName)) {
        // Insert FadeOut before rebind
        out2.push(`${rebind[1]}self.play(FadeOut(${varName}))`);
        seenFadeIn.delete(varName);
      }
    }
    // Track FadeIn(varname)
    const fi = ln.match(/self\.play\(FadeIn\(\s*(\w+)/);
    if (fi) seenFadeIn.add(fi[1]);
    out2.push(ln);
  }

  return out2.join('\n');
}

async function buildCode(prompt, fmt, summary, explainInside) {
  const isVertical = fmt.name === 'vertical';
  const isSquare   = fmt.name === 'square';
  const sceneClass = (isVertical || isSquare) ? 'Scene' : 'MovingCameraScene';
  const frameRate  = isVertical ? 24 : 30;

  const frameExtra = isVertical
    ? 'config.frame_width  = 4.5\nconfig.frame_height = 8.0\n'
    : isSquare
    ? 'config.frame_width  = 8.0\nconfig.frame_height = 8.0\n'
    : '';

  const titleY    = isVertical ? 3.4 : isSquare ? 3.2 : 3.3;
  const titleMaxW = isVertical ? 4.1 : isSquare ? 7.2 : 11.0;
  const titleFS   = isVertical ? 28  : isSquare ? 30  : 36;
  const formulaFS = isVertical ? 32  : isSquare ? 28  : 32;
  // Step cards layout
  const cardBoxW    = isVertical ? 3.8   : isSquare ? 2.1   : 3.1;
  const cardBoxH    = isVertical ? 0.80  : isSquare ? 1.5   : 1.6;
  const cardFS      = isVertical ? 17    : isSquare ? 19    : 21;
  const cardWrapW   = isVertical ? 22    : isSquare ? 15    : 22;
  const cardMaxW    = isVertical ? 3.9   : isSquare ? 6.8   : 10.5;
  const cardsY      = isVertical ? -1.8  : isSquare ? -2.4  : -2.5;
  const cardArrange = isVertical ? 'DOWN': 'RIGHT';
  const cardBuff    = isVertical ? 0.10  : 0.18;

  const summaryNote = (explainInside && summary)
    ? `\n\nAfter the main animation, add a SUMMARY SLIDE (5s): fade everything, show solution in the user's language:\n${summary.slice(0, 250)}`
    : '';

  const header = `from manim import *

config.pixel_width  = ${fmt.w}
config.pixel_height = ${fmt.h}
config.frame_rate   = ${frameRate}
${frameExtra}
class AnimationScene(${sceneClass}):
    def show_step_cards(self, steps):
        import re, textwrap
        cards = VGroup()
        for txt, color in steps:
            clean = re.sub(r'\$+', '', str(txt)).strip()
            lines = textwrap.wrap(clean, width=${cardWrapW})
            wrapped = '\n'.join(lines[:2]) if lines else txt[:40]
            rect = RoundedRectangle(
                width=${cardBoxW}, height=${cardBoxH}, corner_radius=0.15,
                stroke_color=color, stroke_width=2.2,
                fill_color=color, fill_opacity=0.10
            )
            label = Text(wrapped, font_size=${cardFS}, color=color, line_spacing=1.1)
            if label.width > ${cardBoxW} - 0.28:
                label.scale_to_fit_width(${cardBoxW} - 0.28)
            label.move_to(rect.get_center())
            cards.add(VGroup(rect, label))
        if not cards:
            return
        cards.arrange(${cardArrange}, buff=${cardBuff})
        if cards.width > ${cardMaxW}:
            cards.scale_to_fit_width(${cardMaxW})
        cards.move_to([0, ${cardsY}, 0])
        for card in cards:
            self.play(FadeIn(card, shift=UP * 0.12), run_time=0.4)
            self.wait(0.7)
        self.wait(2.5)
        self.play(FadeOut(cards), run_time=0.5)

    def construct(self):
        config.background_color = ManimColor("#050505")
        C_GOLD   = ManimColor("#e8a020")
        C_PURPLE = ManimColor("#a855f7")
        C_ORANGE = ManimColor("#fb923c")
        C_GREEN  = ManimColor("#10b981")
        C_YELLOW = ManimColor("#ffd200")
        C_BLUE   = ManimColor("#63b3ff")
        C_PINK   = ManimColor("#ff4fa3")
        C_SLATE  = ManimColor("#8899aa")`;

  const vizMaxH = isVertical ? 2.2 : isSquare ? 2.6 : 2.8;
  const vizMaxW = isVertical ? 4.0 : isSquare ? 7.2 : 11.0;
  const vizCenterY = isVertical ? 0.5 : isSquare ? 0.1 : 0.0;

  const systemPrompt = `You are a Manim CE v0.19.2 expert creating math education videos. Generate complete, working Manim Python code.

STRICT LAYOUT — 4 NON-OVERLAPPING ZONES:
┌─────────────────────────────────┐
│  ZONE 1: TITLE   (top)          │  y = ${titleY}
│  ZONE 2: FORMULA (below title)  │  next_to title DOWN
│  ZONE 3: VISUAL  (center)       │  y ≈ ${vizCenterY}, max height ${vizMaxH}, max width ${vizMaxW}
│  ZONE 4: CARDS   (bottom)       │  center at y = ${cardsY}
└─────────────────────────────────┘
NO element from one zone may overlap another zone. ENFORCE THIS.

ZONE 1 — TITLE:
title = Text("...", font_size=${titleFS}, weight=BOLD)
title.set_color_by_gradient(C_GOLD, WHITE)
title.move_to([0, ${titleY}, 0])
if title.width > ${titleMaxW}: title.scale_to_fit_width(${titleMaxW})
self.play(Write(title))  # stays on screen

ZONE 2 — FORMULA (short key formula only, NOT the full visualization):
eq = MathTex("short_formula", font_size=${formulaFS}, color=C_YELLOW)
if eq.width > ${titleMaxW}: eq.scale_to_fit_width(${titleMaxW})
eq.next_to(title, DOWN, buff=0.22)
self.play(Write(eq))  # stays on screen

ZONE 3 — VISUALIZATION (choose best approach, fit within height=${vizMaxH}, width=${vizMaxW}):
• Function curves → Axes(axis_config={"color": ManimColor("#1e2a36"), "stroke_width": 1.2}) centered at y=${vizCenterY}. Plot curve with gradient C_PURPLE→C_PINK→C_ORANGE + glow.
• Circles/ellipses → Circle()/Ellipse() centered at [0, ${vizCenterY}, 0]. Colored stroke.
• Triangles → Polygon(), sides labeled with MathTex. Center the whole group at [0, ${vizCenterY}, 0].
• Geometry → Line/Arc/Dot/Arrow centered at [0, ${vizCenterY}, 0].
• Matrices → Matrix([...], h_buff=1.2, v_buff=1.0) centered at [0, ${vizCenterY}, 0]. Use a SMALL concrete matrix (2×2 or 3×3 with numbers). Scale to fit: if mat.height > ${vizMaxH}: mat.scale(${vizMaxH} / mat.height). NEVER use symbolic m×n matrices — use concrete values like [[1,2],[3,4]].
• Algebraic identity → show terms building with Transform/TransformMatchingTex.
• Vectors → Arrow from ORIGIN to point.
• Statistics → BarChart or Rectangle bars at y=${vizCenterY}.
IMPORTANT: After creating the visualization object, ALWAYS check and scale:
  if obj.width > ${vizMaxW}: obj.scale_to_fit_width(${vizMaxW})
  if obj.height > ${vizMaxH}: obj.scale(${vizMaxH} / obj.height)
  obj.move_to([0, ${vizCenterY}, 0])

ZONE 4 — STEP CARDS (rounded boxes with text inside):
Call show_step_cards ONCE with ALL 3 steps as a list of (text, color) tuples.
MANDATORY — use ONLY this pattern:
self.show_step_cards([
    ("First step explanation", C_BLUE),
    ("Second step explanation", C_ORANGE),
    ("Third step explanation", C_GREEN),
])
RULES:
  - NO LaTeX $...$ inside text strings
  - Plain words only — math notation as plain text (e.g. "a^2 + b^2 = c^2" not "$a^2$")
  - Call show_step_cards exactly ONCE, after the visualization
  - Do NOT create Text() or Rectangle() objects for steps yourself

OUTRO:
self.play(FadeOut(Group(*self.mobjects)), run_time=0.7)
outro = Text("AnimateMath AI", font_size=${isVertical ? 22 : 20}, color=ManimColor("#444444"))
self.play(FadeIn(outro)); self.wait(1.5); self.play(FadeOut(outro))

LANGUAGE: Detect language of the prompt. ALL Text() and Tex() strings → same language. MathTex → language-neutral math only.
RETURN: complete Python file including the header provided. No markdown fences, raw Python only.`;

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Math topic: "${prompt}"${summaryNote}\n\nComplete this file (fill in the construct body):\n${header}\n        # complete here` }
    ],
    max_tokens: 2500,
    temperature: 0.25,
  });

  let code = resp.choices[0].message.content.trim()
    .replace(/^```python\n?/, '').replace(/\n?```$/, '').trim();

  // Guarantee correct config values
  code = code
    .replace(/config\.pixel_width\s*=\s*\S+/g,  `config.pixel_width  = ${fmt.w}`)
    .replace(/config\.pixel_height\s*=\s*\S+/g, `config.pixel_height = ${fmt.h}`)
    .replace(/config\.frame_rate\s*=\s*\S+/g,   `config.frame_rate   = ${frameRate}`);

  // Guarantee correct scene class
  if (isVertical || isSquare) {
    code = code.replace(/class AnimationScene\(MovingCameraScene\)/g, 'class AnimationScene(Scene)');
  } else {
    code = code.replace(/class AnimationScene\(Scene\)\b/g, 'class AnimationScene(MovingCameraScene)');
  }

  // Inject show_step_cards method if GPT-4o omitted it
  if (!code.includes('def show_step_cards')) {
    const cardMethodPy = `
    def show_step_cards(self, steps):
        import re, textwrap
        cards = VGroup()
        for txt, color in steps:
            clean = re.sub(r'\\$+', '', str(txt)).strip()
            lines = textwrap.wrap(clean, width=${cardWrapW})
            wrapped = '\\n'.join(lines[:2]) if lines else txt[:40]
            rect = RoundedRectangle(
                width=${cardBoxW}, height=${cardBoxH}, corner_radius=0.15,
                stroke_color=color, stroke_width=2.2,
                fill_color=color, fill_opacity=0.10
            )
            label = Text(wrapped, font_size=${cardFS}, color=color, line_spacing=1.1)
            if label.width > ${cardBoxW} - 0.28:
                label.scale_to_fit_width(${cardBoxW} - 0.28)
            label.move_to(rect.get_center())
            cards.add(VGroup(rect, label))
        if not cards:
            return
        cards.arrange(${cardArrange}, buff=${cardBuff})
        if cards.width > ${cardMaxW}:
            cards.scale_to_fit_width(${cardMaxW})
        cards.move_to([0, ${cardsY}, 0])
        for card in cards:
            self.play(FadeIn(card, shift=UP * 0.12), run_time=0.4)
            self.wait(0.7)
        self.wait(2.5)
        self.play(FadeOut(cards), run_time=0.5)

`;
    code = code.replace(/(\n    def construct\(self\):)/, cardMethodPy + '$1');
  }

  return code;
}

async function buildVerticalCode(prompt, fmt, summary, explainInside) {
  const contentResp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Math topic: "${prompt}"

Detect the language of the prompt. Return ONLY valid JSON (no explanation):
{
  "title": "topic title IN DETECTED LANGUAGE, max 22 chars",
  "formula": "main LaTeX formula (NO $ signs), e.g. a^2+b^2=c^2",
  "curve_type": "function" for y=f(x) curves, "parametric" for circles/ellipses/spirals, OR "right_triangle" for Pythagorean theorem and right triangle topics. IMPORTANT: a^2+b^2=c^2 must use right_triangle NOT parametric",
  "curve_expr": "Python/numpy expr using variable x ONLY (required when curve_type=function). E.g. np.sin(x), x**2, np.exp(x/3). Use numeric constants, NOT undefined variables.",
  "param_x_expr": "x(t) expr using ONLY t and numeric constants (for parametric). E.g. 2*np.cos(t). NEVER use undefined variables.",
  "param_y_expr": "y(t) expr using ONLY t and numeric constants (for parametric). E.g. 2*np.sin(t). NEVER use undefined variables.",
  "t_min": 0, "t_max": 6.2832,
  "tri_a": 3,
  "tri_b": 4,
  "x_min": -3, "x_max": 3, "y_min": -2, "y_max": 3,
  "key_x": 1, "key_y": 1,
  "step1": "first key insight, max 26 chars, IN DETECTED LANGUAGE",
  "step2": "second key insight, max 26 chars, IN DETECTED LANGUAGE",
  "step3": "conclusion, max 26 chars, IN DETECTED LANGUAGE",
  "solution_word": "word for Solution IN DETECTED LANGUAGE"
}`
    }],
    max_tokens: 550,
    temperature: 0.3,
  });

  let c;
  try { c = JSON.parse(contentResp.choices[0].message.content); }
  catch(_) { throw new Error('Content JSON parse failed'); }

  const safeStr   = s => JSON.stringify(String(s || ''));
  const safeLaTeX = s => JSON.stringify(String(s || 'f(x)'));
  const num       = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
  const curveExpr  = String(c.curve_expr   || 'np.sin(x)').replace(/[`'"]/g, '');
  const curveType  = String(c.curve_type   || 'function').toLowerCase().trim();
  const paramX     = String(c.param_x_expr || 'np.cos(t)').replace(/[`'"]/g, '');
  const paramY     = String(c.param_y_expr || 'np.sin(t)').replace(/[`'"]/g, '');
  const tMin       = num(c.t_min, 0);
  const tMax       = num(c.t_max, 6.2832);
  const triA       = num(c.tri_a, 3);
  const triB       = num(c.tri_b, 4);
  const triC       = Math.sqrt(triA * triA + triB * triB).toFixed(1);
  const isRightTri = curveType === 'right_triangle';

  const xmin  = isRightTri ? parseFloat((-triA * 0.2).toFixed(2)) : num(c.x_min, -3);
  const xmax  = isRightTri ? parseFloat((triA * 1.4).toFixed(2))  : num(c.x_max, 3);
  const ymin  = isRightTri ? parseFloat((-triB * 0.2).toFixed(2)) : num(c.y_min, -2);
  const ymax  = isRightTri ? parseFloat((triB * 1.4).toFixed(2))  : num(c.y_max, 3);
  const key_x = num(c.key_x, 0),  key_y = num(c.key_y, 1);

  const isParamV  = curveType === 'parametric' || isRightTri;
  const axesXLenV = isParamV ? '2.8' : '4.0';
  let curveLine;
  if (curveType === 'parametric') {
    curveLine = `curve = ParametricFunction(lambda t: axes.c2p(${paramX}, ${paramY}), t_range=[${tMin}, ${tMax}, 0.01], stroke_width=3.5)`;
  } else if (isRightTri) {
    curveLine = `curve = ParametricFunction(lambda t: axes.c2p(np.where(t<=1, ${triA}*t, np.where(t<=2, ${triA}*(2-t), 0.0)), np.where(t<=1, 0.0, np.where(t<=2, ${triB}*(t-1), ${triB}*(3-t)))), t_range=[0, 3, 0.02], stroke_width=3.5)`;
  } else {
    curveLine = `curve = axes.plot(lambda x: ${curveExpr}, x_range=[${xmin}, ${xmax}], stroke_width=3.5)`;
  }

  const triLabelsV = isRightTri ? `
        lbl_a = MathTex("a={${triA}}", font_size=22, color=C_YELLOW)
        lbl_a.next_to(axes.c2p(${triA / 2}, 0), DOWN, buff=0.12)
        lbl_b = MathTex("b={${triB}}", font_size=22, color=C_YELLOW)
        lbl_b.next_to(axes.c2p(0, ${triB / 2}), LEFT, buff=0.12)
        lbl_c = MathTex("c \\\\approx ${triC}", font_size=20, color=C_GOLD)
        lbl_c.move_to(axes.c2p(${triA / 2 + 0.3}, ${triB / 2 + 0.2}))
        right_sq = Polygon(axes.c2p(0.22, 0), axes.c2p(0.22, 0.22), axes.c2p(0, 0.22), color=C_SLATE, stroke_width=1.5)
        self.play(Write(lbl_a), Write(lbl_b), Write(lbl_c), Create(right_sq), run_time=0.8)` : '';

  const keyDotV = isRightTri ? `
        self.wait(0.5)` : `
        # ── KEY POINT ──
        try:
            kd = Dot(axes.c2p(${key_x}, ${key_y}), color=C_YELLOW, radius=0.09).set_z_index(4)
            self.play(GrowFromCenter(kd), run_time=0.6)
        except Exception:
            pass
        self.wait(0.5)`;

  const titleW = wrapText(c.title || 'Math', 22);
  const step1W = wrapText(c.step1 || '', 26);
  const step2W = wrapText(c.step2 || '', 26);
  const step3W = wrapText(c.step3 || '', 26);

  const _plain = summary.replace(/\$\$[\s\S]*?\$\$/g,'').replace(/\$[^$\n]*\$/g,'').replace(/\s+/g,' ').trim();
  const _sent  = (_plain.split(/(?<=[.!?])\s/)[0] || _plain).trim();
  const _rawV  = _sent.slice(0, 60);
  const _short = _sent.length > 60 ? (_rawV.lastIndexOf(' ') > 20 ? _rawV.slice(0,_rawV.lastIndexOf(' ')).trim() : _rawV) : _sent;
  const _fmMatch = summary.match(/\$\$([^$]+)\$\$/) || summary.match(/\$([^$\n]{1,60})\$/);
  const _summaryLatex = _fmMatch ? _fmMatch[1].trim() : '';

  const insideSummarySlide = (explainInside && summary) ? `
        # ── SUMMARY SLIDE ──
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6)
        sol_lbl = Text(${safeStr(c.solution_word || 'Solution')}, font_size=34, weight=BOLD)
        sol_lbl.set_color_by_gradient(ManimColor("#63b3ff"), ManimColor("#ff4fa3"))
        sol_lbl.move_to([0, 2.6, 0])
        self.play(Write(sol_lbl))
        sol_txt = Text(${safeStr(wrapText(_short, 20))}, font_size=26, color=WHITE, line_spacing=1.4)
        if sol_txt.width > 4.0: sol_txt.scale_to_fit_width(4.0)
        sol_txt.next_to(sol_lbl, DOWN, buff=0.4)
        self.play(FadeIn(sol_txt))
${_summaryLatex ? `        sol_eq = MathTex(${JSON.stringify(_summaryLatex)}, font_size=34, color=ManimColor("#ffd200"))
        if sol_eq.width > 4.0: sol_eq.scale_to_fit_width(4.0)
        sol_eq.next_to(sol_txt, DOWN, buff=0.35)
        self.play(Write(sol_eq, run_time=1.0))` : ''}
        self.wait(4)` : '';

  return `from manim import *

config.pixel_width  = ${fmt.w}
config.pixel_height = ${fmt.h}
config.frame_rate   = 24
config.frame_width  = 4.5
config.frame_height = 8.0

class AnimationScene(Scene):
    def construct(self):
        config.background_color = ManimColor("#050505")
        C_GOLD   = ManimColor("#e8a020")
        C_PURPLE = ManimColor("#a855f7")
        C_ORANGE = ManimColor("#fb923c")
        C_GREEN  = ManimColor("#10b981")
        C_YELLOW = ManimColor("#ffd200")
        C_BLUE   = ManimColor("#63b3ff")
        C_PINK   = ManimColor("#ff4fa3")
        C_SLATE  = ManimColor("#8899aa")

        # ── TITLE — gradient, stays at top throughout ──
        title = Text(${safeStr(titleW)}, font_size=28, weight=BOLD)
        title.set_color_by_gradient(C_GOLD, WHITE)
        if title.width > 4.1:
            title.scale_to_fit_width(4.1)
        title.move_to([0, 3.4, 0])
        self.play(Write(title, run_time=0.8))

        # ── FORMULA below title — stays throughout ──
        eq = MathTex(${safeLaTeX(c.formula)}, font_size=32, color=C_YELLOW)
        if eq.width > 3.8:
            eq.scale_to_fit_width(3.8)
        eq.next_to(title, DOWN, buff=0.22)
        self.play(Write(eq, run_time=1.0))
        self.wait(1.2)

        # ── AXES — center zone, subtle dark axis color ──
        axes = Axes(
            x_range=[${xmin}, ${xmax}, 1],
            y_range=[${ymin}, ${ymax}, 1],
            x_length=${axesXLenV}, y_length=2.8,
            axis_config={"color": ManimColor("#1e2a36"), "stroke_width": 1.2})
        axes.move_to([0, 0.0, 0])
        xl = MathTex("x", color=C_SLATE, font_size=18).next_to(axes.x_axis.get_end(), RIGHT, buff=0.07)
        yl = MathTex("y", color=C_SLATE, font_size=18).next_to(axes.y_axis.get_end(), UP, buff=0.07)
        self.play(Write(axes), Write(xl), Write(yl), run_time=1.0)

        # ── CURVE — gradient + double glow ──
        try:
            ${curveLine}
        except Exception:
            curve = axes.plot(lambda x: np.sin(x), x_range=[-3, 3], stroke_width=3.5)
        curve.set_color_by_gradient(C_PURPLE, C_PINK, C_ORANGE)
        glow_o = curve.copy().set_stroke(width=16, opacity=0.09)
        glow_i = curve.copy().set_stroke(width=9,  opacity=0.19)
        self.add(glow_o, glow_i)
        self.play(Create(curve), run_time=2.5)
${triLabelsV}${keyDotV}

        # ── STEPS — each appears then fades, never stack ──
        steps_data = [${[step1W, step2W, step3W].filter(s => s.trim()).map(safeStr).join(', ')}]
        step_colors = [C_BLUE, C_ORANGE, C_GREEN]
        for idx, txt in enumerate(steps_data):
            if not txt.strip():
                continue
            s = Text(txt, font_size=21, color=step_colors[idx % 3])
            if s.width > 4.0:
                s.scale_to_fit_width(4.0)
            s.move_to([0, -2.5, 0])
            self.play(FadeIn(s, shift=UP * 0.08), run_time=0.4)
            self.wait(2.0)
            self.play(FadeOut(s), run_time=0.35)
${insideSummarySlide}
        # ── OUTRO ──
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.7)
        outro = Text("AnimateMath AI", font_size=22, color=ManimColor("#444444"))
        self.play(FadeIn(outro))
        self.wait(1.5)
        self.play(FadeOut(outro))
`;
}

async function buildHorizontalCode(prompt, fmt, summary, explainInside) {
  const contentResp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Math topic: "${prompt}"

Detect the language of the prompt. Return ONLY valid JSON (no explanation):
{
  "title": "topic title IN DETECTED LANGUAGE, max 40 chars",
  "formula": "main LaTeX formula (NO $ signs), e.g. f(x) = \\\\sin(x)",
  "curve_type": "function" for y=f(x) curves, "parametric" for circles/ellipses/spirals, OR "right_triangle" for Pythagorean theorem. IMPORTANT: a^2+b^2=c^2 must use right_triangle NOT parametric",
  "curve_expr": "Python/numpy expr using variable x ONLY (for function type). E.g. np.sin(x), x**2. Use numeric constants, NOT undefined variables.",
  "param_x_expr": "x(t) expr using ONLY t and numeric constants (for parametric). E.g. 2*np.cos(t). NEVER use undefined variables.",
  "param_y_expr": "y(t) expr using ONLY t and numeric constants (for parametric). E.g. 2*np.sin(t). NEVER use undefined variables.",
  "t_min": 0, "t_max": 6.2832,
  "tri_a": 3,
  "tri_b": 4,
  "x_min": -4, "x_max": 4, "y_min": -2, "y_max": 2,
  "key_x": 0, "key_y": 0,
  "step1": "first key annotation, max 40 chars IN DETECTED LANGUAGE",
  "step2": "second key annotation, max 40 chars IN DETECTED LANGUAGE",
  "step3": "third key annotation, max 40 chars IN DETECTED LANGUAGE",
  "insight": "main takeaway, max 32 chars IN DETECTED LANGUAGE",
  "solution_word": "word for Solution IN DETECTED LANGUAGE"
}`
    }],
    max_tokens: 600,
    temperature: 0.3,
  });

  let c;
  try { c = JSON.parse(contentResp.choices[0].message.content); }
  catch(_) { throw new Error('Content JSON parse failed for horizontal'); }

  const safeStr   = s => JSON.stringify(String(s || ''));
  const safeLaTeX = s => JSON.stringify(String(s || 'f(x)'));
  const num       = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
  const curveExpr  = String(c.curve_expr   || 'np.sin(x)').replace(/[`'"]/g, '');
  const curveType  = String(c.curve_type   || 'function').toLowerCase().trim();
  const paramX     = String(c.param_x_expr || 'np.cos(t)').replace(/[`'"]/g, '');
  const paramY     = String(c.param_y_expr || 'np.sin(t)').replace(/[`'"]/g, '');
  const tMin       = num(c.t_min, 0);
  const tMax       = num(c.t_max, 6.2832);
  const triA       = num(c.tri_a, 3);
  const triB       = num(c.tri_b, 4);
  const triC       = Math.sqrt(triA * triA + triB * triB).toFixed(1);
  const isRightTri = curveType === 'right_triangle';

  const xmin  = isRightTri ? parseFloat((-triA * 0.2).toFixed(2)) : num(c.x_min, -4);
  const xmax  = isRightTri ? parseFloat((triA * 1.4).toFixed(2))  : num(c.x_max, 4);
  const ymin  = isRightTri ? parseFloat((-triB * 0.2).toFixed(2)) : num(c.y_min, -2);
  const ymax  = isRightTri ? parseFloat((triB * 1.4).toFixed(2))  : num(c.y_max, 2);
  const key_x = num(c.key_x, 0),  key_y = num(c.key_y, 0);

  const isParamH  = curveType === 'parametric' || isRightTri;
  const axesXLenH = isParamH ? '3.5' : '9.5';
  let curveLine;
  if (curveType === 'parametric') {
    curveLine = `curve = ParametricFunction(lambda t: axes.c2p(${paramX}, ${paramY}), t_range=[${tMin}, ${tMax}, 0.01], stroke_width=4)`;
  } else if (isRightTri) {
    curveLine = `curve = ParametricFunction(lambda t: axes.c2p(np.where(t<=1, ${triA}*t, np.where(t<=2, ${triA}*(2-t), 0.0)), np.where(t<=1, 0.0, np.where(t<=2, ${triB}*(t-1), ${triB}*(3-t)))), t_range=[0, 3, 0.02], stroke_width=4)`;
  } else {
    curveLine = `curve = axes.plot(lambda x: ${curveExpr}, x_range=[${xmin}, ${xmax}], stroke_width=4)`;
  }

  const triLabelsH = isRightTri ? `
        lbl_a = MathTex("a={${triA}}", font_size=26, color=C_YELLOW)
        lbl_a.next_to(axes.c2p(${triA / 2}, 0), DOWN, buff=0.14)
        lbl_b = MathTex("b={${triB}}", font_size=26, color=C_YELLOW)
        lbl_b.next_to(axes.c2p(0, ${triB / 2}), LEFT, buff=0.14)
        lbl_c = MathTex("c \\\\approx ${triC}", font_size=24, color=C_GOLD)
        lbl_c.move_to(axes.c2p(${triA / 2 + 0.35}, ${triB / 2 + 0.25}))
        right_sq = Polygon(axes.c2p(0.25, 0), axes.c2p(0.25, 0.25), axes.c2p(0, 0.25), color=C_SLATE, stroke_width=1.5)
        self.play(Write(lbl_a), Write(lbl_b), Write(lbl_c), Create(right_sq), run_time=0.8)` : '';

  const keyDotH = isRightTri ? `
        self.wait(0.4)` : `
        # ── KEY POINT ──
        try:
            kd = Dot(axes.c2p(${key_x}, ${key_y}), color=C_YELLOW, radius=0.12).set_z_index(4)
            self.play(GrowFromCenter(kd), run_time=0.7)
        except Exception:
            pass
        self.wait(0.4)`;

  const titleW   = wrapText(c.title   || 'Math', 40);
  const step1W   = wrapText(c.step1   || '',     40);
  const step2W   = wrapText(c.step2   || '',     40);
  const step3W   = wrapText(c.step3   || '',     40);
  const insightW = wrapText(c.insight || '',     32);

  const _plain = summary.replace(/\$\$[\s\S]*?\$\$/g,'').replace(/\$[^$\n]*\$/g,'').replace(/\s+/g,' ').trim();
  const _sent  = (_plain.split(/(?<=[.!?])\s/)[0] || _plain).trim();
  const _rawH  = _sent.slice(0, 80);
  const _short = _sent.length > 80 ? (_rawH.lastIndexOf(' ') > 30 ? _rawH.slice(0,_rawH.lastIndexOf(' ')).trim() : _rawH) : _sent;
  const _fmMatch = summary.match(/\$\$([^$]+)\$\$/) || summary.match(/\$([^$\n]{1,60})\$/);
  const _summaryLatex = _fmMatch ? _fmMatch[1].trim() : '';

  const insideSummarySlide = (explainInside && summary) ? `
        # ── SUMMARY SLIDE ──
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
        sol_lbl = Text(${safeStr(c.solution_word || 'Solution')}, font_size=38, weight=BOLD)
        sol_lbl.set_color_by_gradient(ManimColor("#63b3ff"), ManimColor("#ff4fa3"))
        sol_lbl.move_to([0, 2.8, 0])
        self.play(Write(sol_lbl))
        sol_txt = Text(${safeStr(wrapText(_short, 50))}, font_size=28, color=WHITE, line_spacing=1.35)
        if sol_txt.width > 10.0: sol_txt.scale_to_fit_width(10.0)
        sol_txt.next_to(sol_lbl, DOWN, buff=0.4)
        self.play(FadeIn(sol_txt))
${_summaryLatex ? `        sol_eq = MathTex(${JSON.stringify(_summaryLatex)}, font_size=38, color=ManimColor("#ffd200"))
        if sol_eq.width > 10.0: sol_eq.scale_to_fit_width(10.0)
        sol_eq.next_to(sol_txt, DOWN, buff=0.4)
        self.play(Write(sol_eq, run_time=1.0))` : ''}
        self.wait(4)` : '';

  return `from manim import *

config.pixel_width  = ${fmt.w}
config.pixel_height = ${fmt.h}
config.frame_rate   = 30

class AnimationScene(MovingCameraScene):
    def construct(self):
        config.background_color = ManimColor("#050505")
        C_GOLD   = ManimColor("#e8a020")
        C_PURPLE = ManimColor("#a855f7")
        C_ORANGE = ManimColor("#fb923c")
        C_GREEN  = ManimColor("#10b981")
        C_YELLOW = ManimColor("#ffd200")
        C_BLUE   = ManimColor("#63b3ff")
        C_PINK   = ManimColor("#ff4fa3")
        C_SLATE  = ManimColor("#8899aa")

        # ── TITLE — stays throughout ──
        title = Text(${safeStr(titleW)}, font_size=36, weight=BOLD)
        title.set_color_by_gradient(C_GOLD, WHITE)
        if title.width > 11.0:
            title.scale_to_fit_width(11.0)
        title.move_to([0, 3.3, 0])
        self.play(Write(title, run_time=0.8))

        # ── FORMULA — stays throughout ──
        eq = MathTex(${safeLaTeX(c.formula)}, font_size=32, color=C_YELLOW)
        if eq.width > 10.0:
            eq.scale_to_fit_width(10.0)
        eq.next_to(title, DOWN, buff=0.18)
        self.play(Write(eq, run_time=1.0))
        self.wait(1.0)

        # ── AXES — center zone, subtle dark axis color ──
        axes = Axes(
            x_range=[${xmin}, ${xmax}, 1],
            y_range=[${ymin}, ${ymax}, 1],
            x_length=${axesXLenH}, y_length=3.5,
            axis_config={"color": ManimColor("#1e2a36"), "stroke_width": 1.3})
        axes.move_to([0, -0.55, 0])
        xl = MathTex("x", color=C_SLATE, font_size=24).next_to(axes.x_axis.get_end(), RIGHT, buff=0.1)
        yl = MathTex("y", color=C_SLATE, font_size=24).next_to(axes.y_axis.get_end(), UP, buff=0.1)
        self.play(Write(axes), Write(xl), Write(yl), run_time=1.2)

        # ── CURVE — gradient + double glow ──
        try:
            ${curveLine}
        except Exception:
            curve = axes.plot(lambda x: np.sin(x), x_range=[-4, 4], stroke_width=4)
        curve.set_color_by_gradient(C_PURPLE, C_PINK, C_ORANGE)
        glow_o = curve.copy().set_stroke(width=22, opacity=0.09)
        glow_i = curve.copy().set_stroke(width=12, opacity=0.20)
        self.add(glow_o, glow_i)
        self.play(Create(curve), run_time=3.0)
${triLabelsH}${keyDotH}

        # ── STEP LABELS — Transform keeps one object, no ghost text ──
        lbl = Text(${safeStr(step1W)}, color=C_SLATE, font_size=22).to_corner(DL, buff=0.35)
        self.play(FadeIn(lbl), run_time=0.5)
        self.wait(2.0)
        self.play(Transform(lbl, Text(${safeStr(step2W)}, color=ManimColor("#63b3ff"), font_size=22).to_corner(DL, buff=0.35)))
        self.wait(2.0)
        self.play(Transform(lbl, Text(${safeStr(step3W)}, color=ManimColor("#fb923c"), font_size=22).to_corner(DL, buff=0.35)))
        self.wait(1.5)

        # ── INSIGHT ──
        ins = Text(${safeStr(insightW)}, font_size=20, color=C_GREEN).to_corner(DR, buff=0.35)
        self.play(FadeIn(ins, shift=LEFT * 0.1))
        self.wait(1.0)

        # ── CAMERA ZOOM to key point ──
        try:
            focus = axes.c2p(${key_x}, ${key_y})
            self.play(self.camera.frame.animate.scale(0.72).move_to(focus), run_time=1.8)
            self.wait(1.2)
            self.play(self.camera.frame.animate.scale(1 / 0.72).move_to(ORIGIN), run_time=1.2)
        except Exception:
            self.wait(1)
${insideSummarySlide}
        # ── OUTRO ──
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6)
        outro = Text("AnimateMath AI", font_size=20, color=ManimColor("#444444"))
        self.play(FadeIn(outro, shift=UP * 0.1))
        self.wait(2)
        self.play(FadeOut(outro))
`;
}

async function buildSquareCode(prompt, fmt, summary, explainInside) {
  const contentResp = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Math topic: "${prompt}"

Detect the language of the prompt. Return ONLY valid JSON (no explanation):
{
  "title": "topic title IN DETECTED LANGUAGE, max 28 chars",
  "formula": "main LaTeX formula (NO $ signs)",
  "curve_type": "function" for y=f(x) curves, "parametric" for circles/ellipses/spirals, OR "right_triangle" for Pythagorean theorem. IMPORTANT: a^2+b^2=c^2 must use right_triangle NOT parametric",
  "curve_expr": "Python/numpy expr using variable x ONLY (for function type). E.g. np.sin(x), x**2. Use numeric constants, NOT undefined variables.",
  "param_x_expr": "x(t) expr using ONLY t and numeric constants (for parametric). E.g. 2*np.cos(t). NEVER use undefined variables.",
  "param_y_expr": "y(t) expr using ONLY t and numeric constants (for parametric). E.g. 2*np.sin(t). NEVER use undefined variables.",
  "t_min": 0, "t_max": 6.2832,
  "tri_a": 3,
  "tri_b": 4,
  "x_min": -3, "x_max": 3, "y_min": -2, "y_max": 2,
  "key_x": 0, "key_y": 0,
  "step1": "annotation 1, max 30 chars IN DETECTED LANGUAGE",
  "step2": "annotation 2, max 30 chars IN DETECTED LANGUAGE",
  "step3": "annotation 3, max 30 chars IN DETECTED LANGUAGE",
  "insight": "key takeaway, max 28 chars IN DETECTED LANGUAGE",
  "solution_word": "word for Solution IN DETECTED LANGUAGE"
}`
    }],
    max_tokens: 600,
    temperature: 0.3,
  });

  let c;
  try { c = JSON.parse(contentResp.choices[0].message.content); }
  catch(_) { throw new Error('Content JSON parse failed for square'); }

  const safeStr   = s => JSON.stringify(String(s || ''));
  const safeLaTeX = s => JSON.stringify(String(s || 'f(x)'));
  const num       = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;
  const curveExpr  = String(c.curve_expr   || 'np.sin(x)').replace(/[`'"]/g, '');
  const curveType  = String(c.curve_type   || 'function').toLowerCase().trim();
  const paramX     = String(c.param_x_expr || 'np.cos(t)').replace(/[`'"]/g, '');
  const paramY     = String(c.param_y_expr || 'np.sin(t)').replace(/[`'"]/g, '');
  const tMin       = num(c.t_min, 0);
  const tMax       = num(c.t_max, 6.2832);
  const triA       = num(c.tri_a, 3);
  const triB       = num(c.tri_b, 4);
  const triC       = Math.sqrt(triA * triA + triB * triB).toFixed(1);
  const isRightTri = curveType === 'right_triangle';

  const xmin  = isRightTri ? parseFloat((-triA * 0.2).toFixed(2)) : num(c.x_min, -3);
  const xmax  = isRightTri ? parseFloat((triA * 1.4).toFixed(2))  : num(c.x_max, 3);
  const ymin  = isRightTri ? parseFloat((-triB * 0.2).toFixed(2)) : num(c.y_min, -2);
  const ymax  = isRightTri ? parseFloat((triB * 1.4).toFixed(2))  : num(c.y_max, 2);
  const key_x = num(c.key_x, 0),  key_y = num(c.key_y, 0);

  const isParamS  = curveType === 'parametric' || isRightTri;
  const axesXLenS = isParamS ? '2.8' : '6.5';
  let curveLine;
  if (curveType === 'parametric') {
    curveLine = `curve = ParametricFunction(lambda t: axes.c2p(${paramX}, ${paramY}), t_range=[${tMin}, ${tMax}, 0.01], stroke_width=3.5)`;
  } else if (isRightTri) {
    curveLine = `curve = ParametricFunction(lambda t: axes.c2p(np.where(t<=1, ${triA}*t, np.where(t<=2, ${triA}*(2-t), 0.0)), np.where(t<=1, 0.0, np.where(t<=2, ${triB}*(t-1), ${triB}*(3-t)))), t_range=[0, 3, 0.02], stroke_width=3.5)`;
  } else {
    curveLine = `curve = axes.plot(lambda x: ${curveExpr}, x_range=[${xmin}, ${xmax}], stroke_width=3.5)`;
  }

  const triLabelsS = isRightTri ? `
        lbl_a = MathTex("a={${triA}}", font_size=22, color=C_YELLOW)
        lbl_a.next_to(axes.c2p(${triA / 2}, 0), DOWN, buff=0.12)
        lbl_b = MathTex("b={${triB}}", font_size=22, color=C_YELLOW)
        lbl_b.next_to(axes.c2p(0, ${triB / 2}), LEFT, buff=0.12)
        lbl_c = MathTex("c \\\\approx ${triC}", font_size=20, color=C_GOLD)
        lbl_c.move_to(axes.c2p(${triA / 2 + 0.3}, ${triB / 2 + 0.2}))
        right_sq = Polygon(axes.c2p(0.22, 0), axes.c2p(0.22, 0.22), axes.c2p(0, 0.22), color=C_SLATE, stroke_width=1.5)
        self.play(Write(lbl_a), Write(lbl_b), Write(lbl_c), Create(right_sq), run_time=0.8)` : '';

  const keyDotS = isRightTri ? `
        self.wait(0.4)` : `
        # ── KEY POINT ──
        try:
            kd = Dot(axes.c2p(${key_x}, ${key_y}), color=C_YELLOW, radius=0.11).set_z_index(4)
            self.play(GrowFromCenter(kd), run_time=0.6)
            self.play(Indicate(kd, scale_factor=1.5, color=C_YELLOW), run_time=0.7)
        except Exception:
            pass
        self.wait(0.4)`;

  const titleW   = wrapText(c.title   || 'Math', 28);
  const step1W   = wrapText(c.step1   || '',     30);
  const step2W   = wrapText(c.step2   || '',     30);
  const step3W   = wrapText(c.step3   || '',     30);
  const insightW = wrapText(c.insight || '',     28);

  const _plain = summary.replace(/\$\$[\s\S]*?\$\$/g,'').replace(/\$[^$\n]*\$/g,'').replace(/\s+/g,' ').trim();
  const _sent  = (_plain.split(/(?<=[.!?])\s/)[0] || _plain).trim();
  const _rawS  = _sent.slice(0, 70);
  const _short = _sent.length > 70 ? (_rawS.lastIndexOf(' ') > 25 ? _rawS.slice(0,_rawS.lastIndexOf(' ')).trim() : _rawS) : _sent;
  const _fmMatch = summary.match(/\$\$([^$]+)\$\$/) || summary.match(/\$([^$\n]{1,60})\$/);
  const _summaryLatex = _fmMatch ? _fmMatch[1].trim() : '';

  const insideSummarySlide = (explainInside && summary) ? `
        # ── SUMMARY SLIDE ──
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.5)
        sol_lbl = Text(${safeStr(c.solution_word || 'Solution')}, font_size=32, weight=BOLD)
        sol_lbl.set_color_by_gradient(ManimColor("#63b3ff"), ManimColor("#ff4fa3"))
        sol_lbl.move_to([0, 2.7, 0])
        self.play(Write(sol_lbl))
        sol_txt = Text(${safeStr(wrapText(_short, 32))}, font_size=24, color=WHITE, line_spacing=1.35)
        if sol_txt.width > 7.0: sol_txt.scale_to_fit_width(7.0)
        sol_txt.next_to(sol_lbl, DOWN, buff=0.35)
        self.play(FadeIn(sol_txt))
${_summaryLatex ? `        sol_eq = MathTex(${JSON.stringify(_summaryLatex)}, font_size=32, color=ManimColor("#ffd200"))
        if sol_eq.width > 7.0: sol_eq.scale_to_fit_width(7.0)
        sol_eq.next_to(sol_txt, DOWN, buff=0.32)
        self.play(Write(sol_eq, run_time=1.0))` : ''}
        self.wait(4)` : '';

  return `from manim import *

config.pixel_width  = ${fmt.w}
config.pixel_height = ${fmt.h}
config.frame_rate   = 30
config.frame_width  = 8.0
config.frame_height = 8.0

class AnimationScene(Scene):
    def construct(self):
        config.background_color = ManimColor("#050505")
        C_GOLD   = ManimColor("#e8a020")
        C_PURPLE = ManimColor("#a855f7")
        C_ORANGE = ManimColor("#fb923c")
        C_GREEN  = ManimColor("#10b981")
        C_YELLOW = ManimColor("#ffd200")
        C_BLUE   = ManimColor("#63b3ff")
        C_PINK   = ManimColor("#ff4fa3")
        C_SLATE  = ManimColor("#8899aa")

        # ── TITLE — stays throughout ──
        title = Text(${safeStr(titleW)}, font_size=30, weight=BOLD)
        title.set_color_by_gradient(C_GOLD, WHITE)
        if title.width > 7.2:
            title.scale_to_fit_width(7.2)
        title.move_to([0, 3.2, 0])
        self.play(Write(title, run_time=0.8))

        # ── FORMULA — stays throughout ──
        eq = MathTex(${safeLaTeX(c.formula)}, font_size=28, color=C_YELLOW)
        if eq.width > 7.0:
            eq.scale_to_fit_width(7.0)
        eq.next_to(title, DOWN, buff=0.18)
        self.play(Write(eq, run_time=1.0))
        self.wait(1.0)

        # ── AXES — center zone, subtle dark axis color ──
        axes = Axes(
            x_range=[${xmin}, ${xmax}, 1],
            y_range=[${ymin}, ${ymax}, 1],
            x_length=${axesXLenS}, y_length=2.8,
            axis_config={"color": ManimColor("#1e2a36"), "stroke_width": 1.3})
        axes.move_to([0, -0.5, 0])
        xl = MathTex("x", color=C_SLATE, font_size=22).next_to(axes.x_axis.get_end(), RIGHT, buff=0.08)
        yl = MathTex("y", color=C_SLATE, font_size=22).next_to(axes.y_axis.get_end(), UP, buff=0.08)
        self.play(Write(axes), Write(xl), Write(yl), run_time=1.2)

        # ── CURVE — gradient + double glow ──
        try:
            ${curveLine}
        except Exception:
            curve = axes.plot(lambda x: np.sin(x), x_range=[-3, 3], stroke_width=3.5)
        curve.set_color_by_gradient(C_PURPLE, C_PINK, C_ORANGE)
        glow_o = curve.copy().set_stroke(width=18, opacity=0.09)
        glow_i = curve.copy().set_stroke(width=10, opacity=0.20)
        self.add(glow_o, glow_i)
        self.play(Create(curve), run_time=2.8)
${triLabelsS}${keyDotS}

        # ── STEP LABELS — Transform keeps one object, no ghost text ──
        lbl = Text(${safeStr(step1W)}, color=C_SLATE, font_size=20).to_corner(DL, buff=0.25)
        self.play(FadeIn(lbl), run_time=0.5)
        self.wait(1.8)
        self.play(Transform(lbl, Text(${safeStr(step2W)}, color=ManimColor("#63b3ff"), font_size=20).to_corner(DL, buff=0.25)))
        self.wait(1.8)
        self.play(Transform(lbl, Text(${safeStr(step3W)}, color=ManimColor("#fb923c"), font_size=20).to_corner(DL, buff=0.25)))
        self.wait(1.5)

        # ── INSIGHT ──
        ins = Text(${safeStr(insightW)}, font_size=18, color=C_GREEN).to_corner(DR, buff=0.25)
        self.play(FadeIn(ins, shift=LEFT * 0.1))
        self.wait(1)
${insideSummarySlide}
        # ── OUTRO ──
        self.play(FadeOut(Group(*self.mobjects)), run_time=0.6)
        outro = Text("AnimateMath AI", font_size=18, color=ManimColor("#444444"))
        self.play(FadeIn(outro))
        self.wait(2)
        self.play(FadeOut(outro))
`;
}

app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    const { format, explain } = req.body;
    const explainInside = explain === 'inside';

    const fmt = format && format !== 'default' ? detectFormat(format) : detectFormat(prompt);
    const isVertical = fmt.name === 'vertical';
    const isSquare   = fmt.name === 'square';
    const fmtInstruction = fmt.hint ? `\nVIDEO FORMAT: ${fmt.hint}` : '';

    // If explain=inside, get summary first, then inject into video prompt
    let summary = '';
    try {
      const sumResp = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a math teacher. Write a SHORT answer/solution (2-4 lines) with key formulas using LaTeX ($...$ inline, $$...$$ display). Write in the SAME language as the question. Be concise — key result + formula only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
      });
      summary = sumResp.choices[0].message.content.trim();
    } catch (_) {}

    const insideNote = explainInside && summary
      ? `\n\nAFTER the outro, add a SUMMARY SLIDE (5 seconds) showing the solution in a clean dark panel:
- Black semi-transparent Rectangle covering most of the screen
- Title "Solution" (in the user's language) at top in bright yellow
- Show these lines as Text/MathTex objects, centered, spaced nicely:
${summary}
Use font_size=30 for text, font_size=36 for formulas. Fade everything out at the end.`
      : '';

    const userMsg = `Create a Manim animation explaining: ${prompt}\n\nIMPORTANT: Detect the language of this prompt and write ALL Text() labels, titles, step descriptions, and explanations in that SAME language. Only LaTeX math symbols are language-neutral.${fmtInstruction}${insideNote}`;

    // 1. GPT-4o generates full Manim code for any math topic
    let code;
    code = await buildCode(prompt, fmt, summary, explainInside);

    // 2. Save to temp file
    const id       = Date.now();
    const pyFile   = path.join(TMP_DIR, `scene_${id}.py`);
    const outDir   = path.join(RENDERS_DIR, `${id}`);
    fs.writeFileSync(pyFile, code);
    fs.mkdirSync(outDir, { recursive: true });

    // timeout scales with format pixel count
    const renderTimeout = fmt.name === 'landscape' ? 300000
                        : fmt.name === 'square'    ? 270000
                        : fmt.name === 'vertical'  ? 360000
                        : 210000; // default

    // All formats use templates — fix Python errors only, never touch structure
    const FIX_SYS = 'You are a Python/Manim expert. Fix ONLY the Python error in this Manim code. Do NOT change any positions, font sizes, class names, or config values. Return ONLY Python code, no markdown.';

    const isSceneClass = isVertical || isSquare;
    const processCode = (rawCode) => isSceneClass
      ? rawCode.replace(/class AnimationScene\(MovingCameraScene\)/g, 'class AnimationScene(Scene)')
      : rawCode.replace(/class AnimationScene\(Scene\)\b/g, 'class AnimationScene(MovingCameraScene)');

    function extractError(raw) {
      // skip tqdm progress bar lines (contain "it/s]" or "%|")
      const lines = raw.split('\n').filter(l => !/(?:%\||\bit\/s\]|Animation \d+:.*\|)/.test(l));
      const joined = lines.join('\n');
      return joined.match(/(?:Error|Exception|Traceback)[^\n]*/)?.[0]
          || lines.filter(l => /\bError\b|\bException\b/i.test(l)).pop()
          || 'Render error — the generated code may have a logic issue.';
    }

    // 3. Run Manim
    try {
      execSync(
        `python3 -m manim "${pyFile}" AnimationScene -qm -r ${fmt.h},${fmt.w} --media_dir "${outDir}" --disable_caching`,
        { timeout: renderTimeout, stdio: 'pipe' }
      );
    } catch (e) {
      const detail = (e.stderr?.toString() || '') + (e.stdout?.toString() || '');
      console.error('RENDER ERROR:\n', detail.slice(0, 800));

      const timedOut = e.killed || e.signal === 'SIGTERM' || String(e.code) === 'ETIMEDOUT';
      const errorLine = timedOut ? 'Render timed out — code too complex, retrying with simpler version…' : extractError(detail);
      console.log('Asking GPT-4o to fix the error…');
      let fixedCode;
      try {
        const fixMessages = [
          { role: 'system', content: FIX_SYS },
          { role: 'user', content: `Fix this error:\n${errorLine}\n\nCode:\n${code}\n\nReturn ONLY corrected Python.` }
        ];
        const fix = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: fixMessages,
        });
        fixedCode = fix.choices[0].message.content.trim()
          .replace(/^```python\n?/, '').replace(/\n?```$/, '').trim();
        fixedCode = processCode(fixedCode);
      } catch (_) {
        fixedCode = processCode(code);
      }

      fs.writeFileSync(pyFile, fixedCode);
      try {
        execSync(
          `python3 -m manim "${pyFile}" AnimationScene -qm -r ${fmt.h},${fmt.w} --media_dir "${outDir}" --disable_caching`,
          { timeout: renderTimeout + 60000, stdio: 'pipe' }
        );
        code = fixedCode;
      } catch(e2) {
        const detail2 = (e2.stderr?.toString() || '') + (e2.stdout?.toString() || '');
        console.error('SECOND RENDER ERROR:\n', detail2.slice(0, 600));

        // 3rd attempt: ask GPT-4o to write a minimal but still beautiful version
        const err2Line = extractError(detail2);
        console.log('Attempting 3rd render with simplified code…');
        let code3;
        try {
          const fix3Messages = [
            { role: 'system', content: FIX_SYS },
            { role: 'user', content: `Still failing: ${err2Line}\n\nFix this Manim code:\n${fixedCode}\n\nReturn ONLY corrected Python.` }
          ];
          const fix3 = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: fix3Messages,
          });
          code3 = fix3.choices[0].message.content.trim()
            .replace(/^```python\n?/, '').replace(/\n?```$/, '').trim();
          code3 = processCode(code3);
        } catch(_) {
            if (fs.existsSync(pyFile)) fs.unlinkSync(pyFile);
          return res.status(500).json({ error: 'Render failed after auto-fix', detail: err2Line, code: fixedCode });
        }

        fs.writeFileSync(pyFile, code3);
        try {
          execSync(
            `python3 -m manim "${pyFile}" AnimationScene -qm -r ${fmt.h},${fmt.w} --media_dir "${outDir}" --disable_caching`,
            { timeout: renderTimeout + 120000, stdio: 'pipe' }
          );
          code = code3;
        } catch(e3) {
          const detail3 = (e3.stderr?.toString() || '') + (e3.stdout?.toString() || '');
          const err3Line = extractError(detail3);
          if (fs.existsSync(pyFile)) fs.unlinkSync(pyFile);
          return res.status(500).json({ error: 'Render failed after auto-fix', detail: err3Line, code: code3 });
        }
      }
    }

    // 4. Find output video
    const videos = [];
    const walk = (dir) => {
      fs.readdirSync(dir).forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (f.endsWith('.mp4')) videos.push(full);
      });
    };
    walk(outDir);
    fs.unlinkSync(pyFile);

    if (!videos.length) return res.status(500).json({ error: 'No video produced', code });

    const videoUrl = '/renders/' + path.relative(RENDERS_DIR, videos[0]);

    // 5. Summary: already generated above; send it only for 'outside' mode
    res.json({ videoUrl, code, summary: explainInside ? '' : summary });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`AnimateMath AI → http://localhost:${PORT}`));
