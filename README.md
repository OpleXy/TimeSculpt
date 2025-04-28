# TimeSculpt - Interactive Timeline Creator

A React application for creating interactive, customizable timelines with user authentication.

## Features

- Create horizontal or vertical timelines
- Add events to your timeline
- Drag events to customize their position
- Zoom and pan the timeline view
- User authentication with Firebase
- Save and load your timelines

## Setup

### Prerequisites

- Node.js (version 18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone <repository-url>
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up Firebase:
   
   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   
   b. Enable Firebase Authentication with Email/Password method:
      - In the Firebase console, go to Authentication > Sign-in method
      - Enable Email/Password provider
   
   c. Create a Firestore database:
      - In the Firebase console, go to Firestore Database
      - Create a new database (Start in production mode)
      - Choose a location closest to your users
   
   d. Get your Firebase configuration:
      - Go to Project Settings > General
      - Scroll down to "Your apps" section
      - Click the web app icon (</>) to create a new app if you haven't already
      - Copy the firebaseConfig object
   
   e. Update the Firebase configuration in `src/firebase.js`:
      - Replace the placeholder config with your own Firebase project config

4. Start the development server
   ```
   npm run dev
   ```

## Using the Application

1. Create a timeline by providing a title, start date, end date, and orientation
2. Add events to your timeline with titles and dates
3. Drag events vertically (for horizontal timelines) or horizontally (for vertical timelines) to adjust their position
4. Use Ctrl+Scroll to zoom the timeline, Ctrl+Drag to pan, and double-click to reset the view
5. Log in or register to save your timelines to your account
6. Access your saved timelines from the sidebar

## Deployment

To build the application for production, run:
```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Technology Stack

- React 19
- Vite
- Firebase Authentication
- Firestore Database

## License

This project is licensed under the MIT License - see the LICENSE file for details.