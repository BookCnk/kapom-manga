# RTN Manga Platform

Next.js webtoon/manga platform with App Router, TypeScript, Tailwind CSS, and shadcn/ui.

## Setup Commands

```bash
cd rtn-manga-platform
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Project Structure

```
rtn-manga-platform/
├── app/
│   ├── layout.tsx          # Root layout with Kanit font
│   ├── page.tsx            # Home page (converted from index.html)
│   ├── globals.css         # Tailwind + shadcn theme
│   ├── login/
│   │   └── page.tsx        # Login page
│   └── register/
│       └── page.tsx        # Register page
├── components/
│   ├── navigation.tsx      # Navbar component
│   ├── footer.tsx          # Footer component
│   └── ui/
│       └── button.tsx      # shadcn/ui button
├── lib/
│   └── utils.ts            # cn() utility
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript config
└── next.config.js          # Next.js config
```

## Routes

- `/` - Home page (แนะนำ, อัพเดทล่าสุด, ยอดฮิต)
- `/login` - Login page
- `/register` - Register page

## Dependencies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS 3.4
- shadcn/ui (Radix UI + class-variance-authority)
- Lucide React (icons)

## Features

- Responsive design
- Thai language support with Kanit font
- Featured comic banner
- Latest updates grid
- Popular rankings sidebar
- Genre tags
- Login/Register with password toggle
- Google sign-in button (UI)
