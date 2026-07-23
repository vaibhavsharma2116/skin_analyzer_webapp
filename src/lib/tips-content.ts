import {
  Droplet, FlaskConical, Leaf, ScanFace, Sparkles, Sun,
  ShieldCheck, HeartPulse, Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Category = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  count: number;
  icon: LucideIcon;
  tone: string; // bg class
  iconTone: string; // text class
};

export const CATEGORIES: Category[] = [
  { key: "basics", label: "Skincare Basics", shortLabel: "Basics", description: "Learn the fundamentals of healthy skin", count: 24, icon: Droplet, tone: "bg-primary/10", iconTone: "text-primary" },
  { key: "ingredients", label: "Ingredients Guide", shortLabel: "Ingredients", description: "Understand powerful ingredients", count: 32, icon: FlaskConical, tone: "bg-coral/10", iconTone: "text-coral" },
  { key: "concerns", label: "Skin Concerns", shortLabel: "Concerns", description: "Solutions for acne, dryness, pigmentation & more", count: 28, icon: ScanFace, tone: "bg-primary/10", iconTone: "text-primary" },
  { key: "routine", label: "Routine & Tips", shortLabel: "Routine", description: "Daily skincare routines, tips & hacks", count: 18, icon: Sun, tone: "bg-amber-500/10", iconTone: "text-amber-600" },
  { key: "lifestyle", label: "Lifestyle & Wellness", shortLabel: "Lifestyle", description: "Diet, sleep, stress & skin health", count: 16, icon: Leaf, tone: "bg-sage/15", iconTone: "text-sage" },
];

export type ArticleSection =
  | { kind: "paragraph"; text: string }
  | { kind: "takeaway"; title: string; text: string }
  | { kind: "protip"; text: string }
  | { kind: "benefits"; items: { icon: LucideIcon; title: string; text: string }[] }
  | { kind: "howto"; text: string };

export type Article = {
  slug: string;
  title: string;
  summary: string;
  category: string; // Category.key
  categoryLabel: string;
  readMinutes: number;
  author: string;
  date: string;
  gradient: string; // hero background
  hero?: string; // optional emoji glyph shown in the hero
  toc: string[];
  sections: ArticleSection[];
  products: { name: string; price: string }[];
};

export const ARTICLES: Article[] = [
  {
    slug: "hyaluronic-acid-hydration-hero",
    title: "Hyaluronic Acid: The Ultimate Hydration Hero",
    summary: "Benefits, how it works & who should use it.",
    category: "ingredients",
    categoryLabel: "Ingredient Guide",
    readMinutes: 4,
    author: "Skin Pop Team",
    date: "May 12, 2024",
    gradient: "from-primary/20 via-primary/10 to-primary/5",
    hero: "💧",
    toc: [
      "What is Hyaluronic Acid?",
      "Benefits for your skin",
      "Who should use it?",
      "How to use it in your routine",
      "Best products with Hyaluronic Acid",
    ],
    sections: [
      {
        kind: "paragraph",
        text: "Hyaluronic Acid (HA) is a naturally occurring molecule in your skin that attracts and retains moisture. It can hold up to 1000× its weight in water, making it a powerhouse hydrator.",
      },
      { kind: "takeaway", title: "Key Takeaway", text: "HA helps keep your skin plump, hydrated and healthy." },
      {
        kind: "benefits",
        items: [
          { icon: Droplet, title: "Deep Hydration", text: "Provides intense hydration and moisture retention." },
          { icon: Smile, title: "Plump & Smooth Skin", text: "Helps reduce fine lines and keeps skin plump." },
          { icon: ShieldCheck, title: "Strengthens Skin Barrier", text: "Improves skin barrier and reduces moisture loss." },
          { icon: HeartPulse, title: "Suitable for All Skin Types", text: "Gentle and effective for oily, dry, combination & sensitive skin." },
        ],
      },
      {
        kind: "howto",
        text: "Apply on damp skin after cleansing and toning. Follow up with a moisturizer to lock in the hydration.",
      },
      { kind: "protip", text: "Layer HA (Hyaluronic Acid) under heavier creams or oils for maximum hydration." },
    ],
    products: [
      { name: "Hydrating Serum", price: "₹799" },
      { name: "Water Gel Moisturizer", price: "₹699" },
      { name: "HA + B5 Booster", price: "₹849" },
      { name: "Hydra Mist", price: "₹599" },
    ],
  },
  {
    slug: "niacinamide-skins-best-friend",
    title: "Niacinamide: Your Skin's Best Friend",
    summary: "Why this ingredient works wonders for almost everyone.",
    category: "ingredients",
    categoryLabel: "Ingredient Guide",
    readMinutes: 4,
    author: "Skin Pop Team",
    date: "May 08, 2024",
    gradient: "from-amber-200/40 via-primary/10 to-primary/5",
    hero: "✨",
    toc: ["What is Niacinamide?", "Top benefits", "How to layer it", "Who should avoid it"],
    sections: [
      { kind: "paragraph", text: "Niacinamide (Vitamin B3) is a multitasker that calms redness, controls oil, minimizes the look of pores and evens skin tone." },
      { kind: "takeaway", title: "Why we love it", text: "Well-tolerated by most skin types and easy to layer with almost anything." },
      {
        kind: "benefits",
        items: [
          { icon: Sparkles, title: "Evens Tone", text: "Fades post-blemish marks and pigmentation over time." },
          { icon: Droplet, title: "Balances Oil", text: "Regulates sebum without stripping the skin." },
          { icon: ShieldCheck, title: "Barrier Support", text: "Boosts ceramide production to strengthen the barrier." },
        ],
      },
      { kind: "howto", text: "Use 5-10% niacinamide serum morning or night, after cleansing and before moisturizer." },
      { kind: "protip", text: "Avoid pairing with pure Vitamin C at very high strengths in the same layer — space them out AM/PM." },
    ],
    products: [
      { name: "Niacinamide 10% Serum", price: "₹649" },
      { name: "Pore Refining Toner", price: "₹549" },
    ],
  },
  {
    slug: "sunscreen-101",
    title: "Sunscreen 101: How to Protect Your Skin Daily",
    summary: "SPF, PA, reapplication & more you should know.",
    category: "basics",
    categoryLabel: "Skincare Basics",
    readMinutes: 6,
    author: "Skin Pop Team",
    date: "May 02, 2024",
    gradient: "from-amber-200/50 via-primary/10 to-primary/5",
    hero: "☀️",
    toc: ["Why SPF matters", "SPF vs PA", "How much to apply", "Reapplication rules"],
    sections: [
      { kind: "paragraph", text: "UV rays are the #1 driver of premature aging and pigmentation. Daily sunscreen is the single highest-impact step in any routine." },
      { kind: "takeaway", title: "Rule of thumb", text: "Two finger-lengths of sunscreen for the face and neck, every single day." },
      {
        kind: "benefits",
        items: [
          { icon: ShieldCheck, title: "Prevents Aging", text: "UV protection slows fine lines and pigmentation." },
          { icon: Sparkles, title: "Protects Actives", text: "Retinol and acids need SPF to work safely." },
          { icon: Sun, title: "Reduces Dark Spots", text: "Sun exposure re-triggers pigmentation daily." },
        ],
      },
      { kind: "howto", text: "Apply sunscreen as the last step of your morning routine, and reapply every 2-3 hours outdoors." },
      { kind: "protip", text: "Cloudy day? UVA rays still penetrate — SPF is a 365-day habit." },
    ],
    products: [
      { name: "Daily SPF 50 PA++++", price: "₹899" },
      { name: "Tinted Mineral Sunscreen", price: "₹1,099" },
    ],
  },
  {
    slug: "morning-vs-night-routine",
    title: "Morning vs Night Routine: What Your Skin Really Needs",
    summary: "Different times, different goals — here's what changes and why.",
    category: "routine",
    categoryLabel: "Routine & Tips",
    readMinutes: 5,
    author: "Skin Pop Team",
    date: "Apr 28, 2024",
    gradient: "from-coral/20 via-primary/10 to-primary/5",
    hero: "🌗",
    toc: ["Morning goals", "Night goals", "The core stack", "Common mistakes"],
    sections: [
      { kind: "paragraph", text: "In the morning your skin needs protection and hydration. At night it repairs — that's the window for actives like retinol, exfoliants and richer creams." },
      { kind: "takeaway", title: "Simple frame", text: "AM = protect. PM = repair." },
      {
        kind: "benefits",
        items: [
          { icon: Sun, title: "AM: Protect", text: "Gentle cleanser, antioxidant serum, moisturizer, SPF." },
          { icon: Sparkles, title: "PM: Repair", text: "Cleanser, treatment (retinol/acid), moisturizer." },
          { icon: Droplet, title: "Always: Hydrate", text: "A hydrating layer sits in both routines." },
        ],
      },
      { kind: "howto", text: "Start simple: 3 steps AM, 3 steps PM. Add actives one at a time so you can spot what your skin loves." },
      { kind: "protip", text: "Don't stack multiple new actives in the same week — introduce, observe, then layer." },
    ],
    products: [
      { name: "Gentle Cleanser", price: "₹499" },
      { name: "Vitamin C Serum", price: "₹899" },
    ],
  },
];

export const ARTICLES_BY_SLUG: Record<string, Article> = Object.fromEntries(
  ARTICLES.map((a) => [a.slug, a]),
);

export type Expert = {
  id: string;
  name: string;
  title: string;
  years: string;
  rating: number;
  answers: number;
  followers: string;
  positive: string;
  bio: string;
  initials: string;
  tone: string;
};

export const EXPERTS: Expert[] = [
  { id: "ananya-sharma", name: "Dr. Ananya Sharma", title: "Dermatologist", years: "8+ Years Experience", rating: 4.8, answers: 512, followers: "12k+", positive: "98%", bio: "MBBS, MD Dermatology. Specialized in clinical dermatology, acne treatment and skin rejuvenation.", initials: "AS", tone: "bg-primary/15 text-primary" },
  { id: "raghav-bansal", name: "Dr. Raghav Bansal", title: "Dermatologist", years: "10+ Years Experience", rating: 4.7, answers: 428, followers: "18k+", positive: "97%", bio: "MBBS, DVD. Cosmetic dermatology and laser expert. Focus on pigmentation and anti-aging.", initials: "RB", tone: "bg-coral/15 text-coral" },
  { id: "priya-malhotra", name: "Priya Malhotra", title: "Skincare Expert", years: "6+ Years Experience", rating: 4.6, answers: 310, followers: "9k+", positive: "96%", bio: "Certified cosmetologist. Focus on skin barrier health, hydration and everyday routines.", initials: "PM", tone: "bg-sage/15 text-sage" },
];

export const EXPERTS_BY_ID: Record<string, Expert> = Object.fromEntries(EXPERTS.map((e) => [e.id, e]));

export type ExpertAnswer = {
  id: string;
  expertId: string;
  question: string;
  answer: string;
  daysAgo: string;
  likes: number;
  comments: number;
};

export const ANSWERS: ExpertAnswer[] = [
  { id: "a1", expertId: "ananya-sharma", question: "How can I reduce acne and prevent breakouts naturally?", answer: "A consistent skincare routine, a balanced diet and proper hydration are key…", daysAgo: "2 days ago", likes: 124, comments: 18 },
  { id: "a2", expertId: "ananya-sharma", question: "What is the correct order of applying skincare products?", answer: "The general rule is: Cleanser → Toner → Serum → Moisturizer → Sunscreen.", daysAgo: "5 days ago", likes: 98, comments: 12 },
  { id: "a3", expertId: "ananya-sharma", question: "Can I use Vitamin C serum every day?", answer: "Yes, Vitamin C can be used daily in the morning. Make sure to follow with sunscreen…", daysAgo: "1 week ago", likes: 76, comments: 9 },
  { id: "a4", expertId: "raghav-bansal", question: "How to fade dark spots after acne?", answer: "Combine niacinamide, azelaic acid and daily SPF. Patience is key — 8-12 weeks.", daysAgo: "3 days ago", likes: 88, comments: 14 },
  { id: "a5", expertId: "priya-malhotra", question: "Best routine for sensitive skin?", answer: "Keep it minimal: gentle cleanser, ceramide moisturizer and mineral SPF.", daysAgo: "1 day ago", likes: 65, comments: 7 },
];
