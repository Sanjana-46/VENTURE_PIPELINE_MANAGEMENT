Venture Pipeline – Auth (Sign In / Sign Up)

A polished authentication UI for the Venture Pipeline Management System, built with React + TypeScript and Tailwind CSS, using lucide-react icons.
This module provides a single component that cleanly toggles between Sign In and Sign Up, includes client-side validation, a password strength indicator, and a modern, accessible UI that matches the Venture Pipeline design language (green/emerald accents, soft shadows, rounded corners).

✨ Features

Unified Auth component that switches between Sign In / Sign Up states

Client-side validation with friendly, inline error messages

Password strength meter (length, upper/lowercase, number, symbol)

Show/Hide password toggles (for password & confirm password)

Loading state on submit (with animated spinner)

Remember me (Sign In)

TOS / Privacy notice (Sign Up)

Clean, responsive UI built with Tailwind CSS

Iconography via lucide-react (Mail, Lock, Eye, EyeOff, User, Building)

Accessible labels and focus styles

📁 What’s inside
src/
  Auth.tsx      # Your main component (Sign In / Sign Up)
  index.css     # Tailwind base/styles (or your global CSS)


Main component: Auth.tsx (as you shared)

isSignUp – toggles between Sign In and Sign Up

formData – typed via FormData interface

errors – typed via FormErrors interface

validateForm() – email & password checks; extra fields on Sign Up

getPasswordStrength() – 0–5 scale with visual bars and label

Simulated submit (fake 2s API delay) → replace with real API or NextAuth

🧰 Tech stack

React 18 + TypeScript

Tailwind CSS

lucide-react (icons)

Works in Next.js (App Router or Pages Router) or Vite (React).
If you don’t have Tailwind set up yet, see the Tailwind Setup section below.

🚀 Getting started
1) Install dependencies
# If you already have a React+TS project, just add:
npm i lucide-react
# If you need Tailwind:
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

2) Tailwind setup (if not already configured)

tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // If Next.js (App Router):
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
}


src/index.css (or your global CSS)
Make sure you include Tailwind’s base layers at the top of your app.

@tailwind base;
@tailwind components;
@tailwind utilities;

🔌 Using the component
Option A — Next.js (App Router)

Put your Auth.tsx in app/(auth)/components/Auth.tsx (or components/Auth.tsx).

Create a Sign In page at app/(auth)/sign-in/page.tsx:

// app/(auth)/sign-in/page.tsx
import Auth from "../components/Auth";

export default function SignInPage() {
  return <Auth />;
}


If you also want Sign Up, create app/(auth)/sign-up/page.tsx with the same:

import Auth from "../components/Auth";

export default function SignUpPage() {
  return <Auth />;
}


The component itself toggles Sign In/Up internally. If you’d rather have each page default to a specific state, you can add a prop to Auth like defaultMode="signup" and set the initial isSignUp accordingly.

Option B — Vite (React)

Place Auth.tsx in src/Auth.tsx.

Render it in your app:

// src/main.tsx or App.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import Auth from "./Auth";
import "./index.css"; // tailwind

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Auth />
  </React.StrictMode>
);


Start the dev server:

npm run dev

🧪 Validation rules

Email: required, must match ^[^\s@]+@[^\s@]+\.[^\s@]+$

Password: required, minimum 8 characters

Sign Up only: firstName, lastName, company, and confirmPassword required

Confirm Password: must match password

Password Strength (0–5):
1 = length ≥ 8
+1 = contains uppercase
+1 = contains lowercase
+1 = contains number
+1 = contains symbol

Error messages appear beneath each field. Inputs turn red when invalid.

🖌️ Customization
Colors & theme

Primary accents use green/emerald gradient:

from-green-500 to-emerald-600 (button bg)

hover states: hover:from-green-600 hover:to-emerald-700

To match a different palette, swap Tailwind classes on:

Submit button

Logo square (the “VP” tile)

Focus rings (focus:ring-green-500 → your brand color)

Icons

Icons come from lucide-react. Change or add icons by importing:

import { Eye, EyeOff, Mail, Lock, User, Building } from "lucide-react";


You can swap or extend icon usage without changing any logic.

Layout

Component is mobile-first and centered. To embed in an existing page, wrap <Auth /> with your layout shell and remove the outer min-h-screen container if needed.

🔐 Wiring to real authentication

Right now, submit simulates an API call:

await new Promise(resolve => setTimeout(resolve, 2000));


Replace this with your real flow:

A) Custom API (REST)
const res = await fetch("/api/auth/signin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: formData.email, password: formData.password })
});
if (!res.ok) {
  // read { message } from JSON and show errors
}

B) NextAuth (Credentials or OAuth)

Install next-auth and configure /app/api/auth/[...nextauth]/route.ts.

On the “Continue with Google”/submit button, call:

import { signIn } from "next-auth/react";
await signIn("google"); // or "credentials", { redirect: false, ... }


After success, redirect to /dashboard.

Security note: never log or store raw passwords on the client; send them over HTTPS to a trusted backend only.

♿ Accessibility

Labels are explicitly tied to inputs with htmlFor.

Focus states are visible (focus:ring-*).

Buttons are keyboard-accessible; toggles use <button type="button">.

Inputs provide inline error text and color cues.

Suggested improvements (optional):

Add aria-invalid on invalid fields.

Add aria-live="polite" on the error container for screen readers.

Set meaningful titles/aria-labels on icon-only buttons (e.g., the eye toggle).

📦 Scripts

If you used Vite:

npm run dev       # start dev server
npm run build     # production build
npm run preview   # preview production build


If you used Next.js:

npm run dev
npm run build
npm start

🗺️ Roadmap

Hook up real authentication (NextAuth, Supabase, custom API)

Add field-level async validation (e.g., email availability)

Implement password reset & email verification flows

Expand social login options

Unit tests for validation logic and UI states

🤝 Contributing

PRs welcome!
Please keep changes consistent with the current design language (rounded corners, green/emerald accents, soft shadows). For larger changes, open an issue to discuss first.
