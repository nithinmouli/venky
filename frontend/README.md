# AI Judge System - Frontend

A modern React-based frontend for the AI Judge legal proceedings system, built with Vite and styled with Tailwind CSS.

## Features

- **Case Management Dashboard** - View and manage legal cases
- **Real-time Updates** - WebSocket integration for live case status updates
- **Document Upload Interface** - Support for PDF, DOC, DOCX, and TXT files
- **AI Judge Interaction** - View AI-powered verdicts and responses
- **Argument System** - Submit follow-up arguments (max 5 per side)
- **Responsive Design** - Modern glassmorphism UI with Tailwind CSS

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast development build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Router DOM** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client for API requests
- **Lucide React** - Beautiful icons

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Configure your backend API URL
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AppLayout.jsx   # Main layout wrapper
│   ├── Header.jsx      # Navigation header
│   ├── Dashboard.jsx   # Cases overview
│   ├── CreateCase.jsx  # New case creation
│   └── CaseView.jsx    # Individual case view
├── stores/
│   └── useAIJudgeStore.js  # Zustand state management
├── App.jsx             # Main app component
├── main.jsx           # React entry point
└── index.css          # Tailwind CSS styles

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Styling

This project uses Tailwind CSS with custom components and utilities:

- **Glass morphism effects** - Modern translucent UI elements
- **Custom color palette** - AI Judge themed colors
- **Responsive design** - Mobile-first approach
- **Component classes** - Reusable button and form styles

## State Management

Uses Zustand for lightweight state management:

- Case data and operations
- WebSocket connection management
- UI state and loading indicators
- Real-time updates integration

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
