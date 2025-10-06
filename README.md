# Dashboard React

A clean, modern React dashboard application with a single-page architecture.

## Features

- **Single Page Application**: Navigation between different modules without page reloads
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Clean, light theme with TailwindCSS styling
- **Task Management**: View and manage tasks with a clean interface
- **Analytics Dashboard**: Charts and statistics for data visualization

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout with sidebar and topbar
│   ├── Sidebar.jsx     # Navigation sidebar
│   ├── Topbar.jsx      # Top navigation bar
│   ├── StatCard.jsx    # Statistics card component
│   ├── AreaChartCard.jsx # Area chart component
│   └── BarChartCard.jsx  # Bar chart component
├── pages/              # Main content pages
│   ├── Overview.jsx    # Dashboard overview
│   ├── AllTasks.jsx    # Task management page
│   ├── MyTasks.jsx     # User's tasks
│   ├── Activity.jsx    # Activity feed
│   ├── Analytics.jsx   # Analytics and metrics
│   └── Projects.jsx    # Project management
├── css/                # Stylesheets
│   └── global.css      # Global styles and TailwindCSS
├── utils.js            # Utility functions
├── App.jsx             # Main application component
└── index.js            # Application entry point
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- **React 18** - Frontend framework
- **React Router 6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Recharts** - Chart library for data visualization

## Navigation

The application uses a sidebar navigation with the following modules:

- **Overview** - Dashboard with statistics and charts
- **All Tasks** - Task management with CRUD operations
- **My Tasks** - User-specific tasks
- **Activity** - Recent activity feed
- **Analytics** - Performance metrics and analytics
- **Projects** - Project management

## Styling

The application uses a light theme with:
- Pure white cards (`bg-card`)
- Slightly darker background (`bg-background`)
- Consistent spacing and typography
- Responsive design for all screen sizes
