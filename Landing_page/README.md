# Clipper — Landing Page

Bunq-style minimal landing for Clipper. Next.js 14 + Tailwind + GSAP + Lenis. Deploy-ready for Vercel.

## Run

```bash
npm install
npm run dev
```

## 3D wiring

- Hero "Messy State": `components/MessyHeroScene.jsx` (R3F + drei + postprocessing, seeded via
  seedrandom/simplex-noise). Card textures live in `public/textures/card-1.jpg` … `card-11.jpg` —
  swap in real screenshots 1:1. Fixed blurred trio: indices [2, 5, 8].
- Search field R3F scene: `// R3F SCENE POINT` in `components/HowItWorks.tsx`. Scoped canvas, mounts only in view.
- Ambient gradients: `// SHADERGRADIENT POINT` in `components/GradientBackdrop.tsx` (Problem→Solution + Waitlist only).

## Image slots

- `[IMAGE PLACEHOLDER: dashboard-analytics]` and `[IMAGE PLACEHOLDER: connections-page]` in `components/Features.tsx`.
  Demo previews hotlink Stitch screenshots (Analytics Vercel Dark + Connections). Drop final 16:9 PNG/WebM in `public/` and swap `src`.
