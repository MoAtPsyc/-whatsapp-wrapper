const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

class WhatsAppWrapper {
  constructor() {
    this.mainWindow = null;
    this.config = this.loadConfig();
  }

  loadConfig() {
    const configPath = path.join(__dirname, 'config.json');
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.log('Config file not found, using defaults');
      return {
        showProfilePics: false,
        showTimestamps: true,
        showReadReceipts: false,
        enableNotifications: true,
        focusMode: true,
        replacementType: 'initials' // 'initials', 'abstract', 'empty'
      };
    }
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: true
      },
      icon: path.join(__dirname, 'assets', 'icon.png'),
      titleBarStyle: 'default'
    });

    // Set a modern user agent to avoid Chrome update warnings
    this.mainWindow.webContents.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Load WhatsApp Web
    this.mainWindow.loadURL('https://web.whatsapp.com/');

    // Block navigation to other domains
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('https://web.whatsapp.com/')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    });

    // Block new windows from opening
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https://web.whatsapp.com/')) {
        return { action: 'allow' };
      }
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Inject custom styles and scripts when page loads
    this.mainWindow.webContents.on('did-finish-load', () => {
      this.injectCustomizations();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Create menu
    this.createMenu();
  }

  injectCustomizations() {
    // Inject CSS
    this.mainWindow.webContents.insertCSS(this.getCustomCSS());
    
    // Inject JavaScript
    this.mainWindow.webContents.executeJavaScript(this.getCustomJS());
  }

  getCustomCSS() {
    return `
      /* Hide Status tab */
      [data-tab="3"] { display: none !important; }
      
      /* Hide Communities/Channels */
      [data-tab="4"] { display: none !important; }
      
      /* Hide profile pictures in chat list if disabled */
      ${!this.config.showProfilePics ? `
      [data-testid="cell-frame-container"] img,
      [data-testid="avatar"] img,
      .chat-avatar img { display: none !important; }
      
      [data-testid="cell-frame-container"] [data-testid="avatar"],
      [data-testid="avatar"],
      .chat-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex !important;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
      }
      ` : ''}
      
      /* Hide typing indicators */
      [data-testid="typing-indicator"] { display: none !important; }
      
      /* Hide read receipts if disabled */
      ${!this.config.showReadReceipts ? `
      [data-testid="msg-dblcheck"],
      [data-testid="msg-check"] { display: none !important; }
      ` : ''}
      
      /* Hide timestamps if disabled */
      ${!this.config.showTimestamps ? `
      [data-testid="msg-meta"] { display: none !important; }
      ` : ''}
      
      /* Focus mode toggle button */
      .focus-toggle {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: #25d366;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-size: 18px;
      }
      
      .focus-toggle:hover {
        background: #1fa851;
      }
      
      /* Clean header */
      header { box-shadow: none !important; }
    `;
  }

  getCustomJS() {
    return `
      (function() {
        let focusModeEnabled = ${this.config.focusMode};
        
        // Create focus mode toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'focus-toggle';
        toggleButton.innerHTML = focusModeEnabled ? '🎯' : '👁️';
        toggleButton.title = 'Toggle Focus Mode';
        document.body.appendChild(toggleButton);
        
        toggleButton.addEventListener('click', function() {
          focusModeEnabled = !focusModeEnabled;
          toggleButton.innerHTML = focusModeEnabled ? '🎯' : '👁️';
          
          // Toggle distracting elements
          const statusTab = document.querySelector('[data-tab="3"]');
          const communitiesTab = document.querySelector('[data-tab="4"]');
          
          if (statusTab) statusTab.style.display = focusModeEnabled ? 'none' : 'flex';
          if (communitiesTab) communitiesTab.style.display = focusModeEnabled ? 'none' : 'flex';
        });
        
        // Replace profile pictures with initials or abstract graphics
        function replaceProfilePics() {
          const avatars = document.querySelectorAll('[data-testid="avatar"]:not(.processed)');
          
          avatars.forEach(avatar => {
            avatar.classList.add('processed');
            const img = avatar.querySelector('img');
            if (img && !${this.config.showProfilePics}) {
              img.style.display = 'none';
              
              // Get contact name for initials
              const contactElement = avatar.closest('[data-testid="cell-frame-container"]');
              let initials = '?';
              
              if (contactElement) {
                const nameElement = contactElement.querySelector('[data-testid="cell-frame-title"]');
                if (nameElement) {
                  const name = nameElement.textContent.trim();
                  initials = name.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
                }
              }
              
              if ('${this.config.replacementType}' === 'initials') {
                avatar.textContent = initials;
              } else if ('${this.config.replacementType}' === 'abstract') {
                avatar.innerHTML = '◉';
              }
            }
          });
        }
        
        // Run replacement periodically as new chats load
        setInterval(replaceProfilePics, 1000);
        
        // Initial run
        setTimeout(replaceProfilePics, 2000);
      })();
    `;
  }

  createMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          { role: 'quit' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

// App event handlers
app.whenReady().then(() => {
  const wrapper = new WhatsAppWrapper();
  wrapper.createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  const wrapper = new WhatsAppWrapper();
  if (BrowserWindow.getAllWindows().length === 0) {
    wrapper.createWindow();
  }
});