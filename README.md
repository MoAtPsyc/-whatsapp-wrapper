# WhatsApp Web Wrapper

A distraction-free wrapper for WhatsApp Web built with Electron.

## Features

- **Security First**: Uses official WhatsApp Web (https://web.whatsapp.com/) - no data interception
- **Distraction-Free**: Hides Status, Communities, and other distracting elements
- **Profile Picture Control**: Replace profile pics with initials or abstract graphics
- **Focus Mode**: Toggle button to enable/disable distractions
- **Customizable**: JSON configuration file for user preferences

## Installation

1. Clone or download this project
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Build Executable
```bash
npm run build
```

## Configuration

Edit `config.json` to customize the wrapper:

- `showProfilePics`: Show/hide original profile pictures
- `showTimestamps`: Show/hide message timestamps  
- `showReadReceipts`: Show/hide read receipts (blue checkmarks)
- `enableNotifications`: Enable/disable all notifications
- `focusMode`: Enable focus mode by default
- `replacementType`: How to replace profile pics (`"initials"`, `"abstract"`, `"empty"`)

## Security

- Only loads official WhatsApp Web
- Blocks navigation to other domains
- No external servers or data collection
- All customizations happen client-side

## Focus Mode

Click the focus button (🎯) in the top-right corner to toggle distracting elements on/off.