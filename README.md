# egviewer - Image Viewer Application

## Overview
A web-based image viewer application with:
- Modal image display
- Swipe navigation (mobile/touch devices)
- Keyboard navigation (desktop)
- Sortable image grid

## Features
- Responsive image grid display
- Full-screen modal viewer
- Touch gesture support (Hammer.js)
- Accessible keyboard controls
- Path-based navigation

## Tech Stack
- **Backend**: Bun + TypeScript + Hono (web framework)
- **Frontend**: Vanilla JS
- **Dependencies**:
  - Hammer.js (for touch gestures)
  - Custom server implementation

## Project Structure
```
egviewer/
├── docs/            # Documentation
│   ├── plans/       # Development plans
│   └── tasks/       # Task tracking
├── images/          # Image storage
├── src/             # Server source
│   └── server.ts    # Main server
├── static/          # Frontend assets
│   └── index.html   # Main interface
├── bun.lock         # Dependency lock
└── package.json     # Project config
```

## Development
### Setup
```bash
bun install
```

### Running
```bash
bun run start
```

### Building
```bash
bun run build
```

## Contributing
1. Create a new task in `docs/tasks/`
2. Update relevant documentation
3. Submit changes via pull request
