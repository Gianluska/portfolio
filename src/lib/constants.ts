import type {
  NavSection,
  Project,
  BlogPost,
  Experiment,
  ContactLink,
  AboutCell,
  HeroFragment,
  ColorPalette,
} from "../types";

// Color palette matching CSS variables
export const colors: ColorPalette = {
  void: "#000000",
  abyss: "#0a0a0a",
  smoke: "#1a1a1a",
  ash: "#2a2a2a",
  fog: "#444444",
  mist: "#888888",
  light: "#cccccc",
  pure: "#ffffff",
};

// Navigation sections
export const NAV_SECTIONS: NavSection[] = [
  { id: "hero", label: "LVSK" },
  { id: "projects", label: "WORKS" },
  { id: "lab", label: "LAB" },
  { id: "about", label: "DATA" },
  { id: "blog", label: "STREAM" },
  { id: "contact", label: "SIGNAL" },
];

// Projects data
export const PROJECTS: Project[] = [
  {
    index: "01",
    title: "METAMORPHOSIS",
    meta: "WEBGL / THREE.JS / GSAP",
    year: 2024,
  },
  {
    index: "02",
    title: "VOID EXPERIENCE",
    meta: "REACT / R3F / SHADERS",
    year: 2024,
  },
  {
    index: "03",
    title: "DIGITAL FLORA",
    meta: "CANVAS / GENERATIVE",
    year: 2023,
  },
  {
    index: "04",
    title: "SYNTHETIC WAVES",
    meta: "AUDIO REACTIVE / WEBGL",
    year: 2023,
  },
  {
    index: "05",
    title: "NEURAL GARDEN",
    meta: "ML / TENSORFLOW.JS",
    year: 2023,
  },
];

// Lab experiments (terminal commands)
export const EXPERIMENTS: Experiment[] = [
  { command: "./run particle_system.js" },
  { command: "./run fluid_simulation.glsl" },
  { command: "./run noise_fields.js" },
  { command: "./run mesh_distortion.js" },
  { command: "./run raymarching.glsl" },
  { command: "./run blob_morphing.js" },
  { command: "./run infinite_zoom.js" },
];

// Blog posts
export const BLOG_POSTS: BlogPost[] = [
  { date: "2024.11.15", title: "SHADER MATHEMATICS: A VISUAL GUIDE" },
  { date: "2024.10.28", title: "BUILDING IMMERSIVE 3D EXPERIENCES WITH R3F" },
  { date: "2024.09.12", title: "THE ART OF CREATIVE CODING" },
  { date: "2024.08.05", title: "PERFORMANCE OPTIMIZATION IN WEBGL" },
  { date: "2024.07.19", title: "GENERATIVE ART WITH NOISE ALGORITHMS" },
];

// Contact links
export const CONTACT_LINKS: ContactLink[] = [
  { label: "GITHUB", href: "#" },
  { label: "TWITTER", href: "#" },
  { label: "LINKEDIN", href: "#" },
  { label: "DRIBBBLE", href: "#" },
];

export const CONTACT_EMAIL = "hello@creative.dev";

// About section grid cells
export const ABOUT_CELLS: AboutCell[] = [
  { type: "stat", label: "YEARS", value: "5+", colSpan: 2, rowSpan: 2 },
  {
    type: "highlight",
    text: "CREATIVE DEVELOPER SPECIALIZED IN\nIMMERSIVE AND HYPER VISUAL WEB EXPERIENCES",
    colSpan: 4,
    rowSpan: 2,
  },
  { type: "stat", label: "PROJECTS", value: "40+", colSpan: 2, rowSpan: 2 },
  { type: "text", text: "WEBGL", colSpan: 3 },
  { type: "text", text: "THREE.JS", colSpan: 2 },
  { type: "text", text: "REACT", colSpan: 3 },
  { type: "text", text: "GSAP", colSpan: 2 },
  { type: "text", text: "GLSL", colSpan: 2 },
  { type: "text", text: "R3F", colSpan: 2 },
  { type: "text", text: "CANVAS", colSpan: 2 },
  {
    type: "text",
    text: "TRANSFORMING CREATIVE CONCEPTS\nINTO DIGITAL REALITY THROUGH\nCODE, DESIGN AND EXPERIMENTATION",
    colSpan: 4,
    rowSpan: 2,
  },
  { type: "stat", label: "EXPERIMENTS", value: "15+", colSpan: 2, rowSpan: 2 },
  { type: "highlight", label: "STATUS", value: "∞", colSpan: 2, rowSpan: 2 },
];

// Hero info fragments
export const HERO_FRAGMENTS: HeroFragment[] = [
  {
    label: "FUNCTION",
    value: "CREATIVE\nDEVELOPER",
    position: "top-left",
    delay: 4000,
  },
  {
    label: "LOCATION",
    value: "SÃO PAULO\n-23.5505°",
    position: "top-right",
    delay: 4300,
  },
  {
    label: "FOCUS",
    value: "HYPER\nVISUAL",
    position: "bottom-left",
    delay: 4600,
  },
  {
    label: "STATUS",
    value: "ONLINE\n████████",
    position: "bottom-right",
    delay: 4900,
  },
];

// Boot sequence messages
export const BOOT_MESSAGES = [
  "INITIALIZING SYSTEM...",
  "LOADING MODULES...",
  "ESTABLISHING CONNECTION...",
  "RENDERING UNIVERSE...",
  "█████████████████ READY",
];

// Animation durations (in ms)
export const ANIMATION_DURATIONS = {
  bootSequence: 3500,
  bootFade: 4000,
  cursorLerp: 0.15,
  scrollDamping: 0.1,
};

// 3D Scene configuration
export const SCENE_CONFIG = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 0, 15] as const,
  },
  rings: {
    count: 8,
    baseRadius: 5,
    radiusStep: 1.2,
  },
  fragments: {
    count: 40,
    minRadius: 8,
    maxRadius: 20,
  },
};

// Glitch characters for letter animation
export const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
