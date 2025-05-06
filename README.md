🕰️ TimeSculpt
TimeSculpt er en interaktiv React/Vite-applikasjon for å skape og utforske tidslinjer med rik visuell og tematisk presentasjon. Prosjektet støtter både private og offentlige tidslinjer, samarbeid mellom brukere, og en administrativ oversikt for brukerstyring.

🚀 Teknologi
Frontend: React (Vite)

Backend: Firebase (Auth + Firestore)

Styling: CSS Modules

Autentisering: Google, Firebase

Deploy:  Webhuset/Firebase Hosting

📁 Prosjektstruktur
bash
Copy
Edit
├── public/                     # Statisk innhold og bakgrunnsbilder
├── src/
│   ├── components/            # UI-komponenter og modalvinduer
│   ├── contexts/              # Kontekster som Auth og AdminContext
│   ├── pages/                 # Navigasjonsbaserte sider (eks. MineTidslinjer, AdminDashboard)
│   ├── services/              # Integrasjoner og tjenestelogikk (AI, Firestore)
│   ├── styles/                # CSS-filer
│   └── routes/                # React-router konfigurasjon
├── .env                       # API-nøkler (ikke versjonskontrollert)
├── package.json
├── vite.config.js
└── README.md
