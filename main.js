const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const puppeteer = require('puppeteer-core'); // Use puppeteer-core to avoid Chromium download

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; // Update path as needed

// Create the main window
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    win.loadFile('index.html');
}

// When the app is ready, create the window
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Close the app when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Handle the login event from the front-end (renderer.js)
ipcMain.on('start-login', async (event) => {
    try {
        const macAddress = getMacAddress();
        if (!macAddress) {
            event.reply('login-result', 'Unable to retrieve MAC address.');
            return;
        }

        const hashedMacAddress = hashMacAddress(macAddress);
        console.log(`Original MAC Address: ${macAddress}`);
        console.log(`Hashed MAC Address: ${hashedMacAddress}`);

        // Puppeteer login logic using real Chrome
        const browser = await puppeteer.launch({
        headless: false, // Open Chrome in visible mode
        executablePath: CHROME_PATH, // Path to your local Chrome installation
        args: ['--start-maximized'],
        defaultViewport: null,
    });
    
    const page = await browser.newPage();

        // Set hashed MAC address as a cookie
        await page.setCookie({
            name: 'hashedMacAddress',
            value: hashedMacAddress,
            domain: 'lms.test.recqarz.com',
            path: '/',
            httpOnly: true,
            secure: true // Set to true for HTTPS
        });

        // Navigate to the login page and perform login
        await page.goto('https://lms.test.recqarz.com/login');
        await page.waitForSelector('.input-boxes');
        await page.type('.input-boxes .input-box input[type="email"]', 'admin@recqarz.com');
        await page.type('.input-boxes .input-box.passw input[type="password"]', 'Admin@123');
        await page.click('.btn-row- button');
        await page.waitForNavigation();

        console.log('Login submitted successfully with Hashed MAC Address:', hashedMacAddress);
        event.reply('login-result', `Login successful! Hashed MAC Address: ${hashedMacAddress}`);
    } catch (error) {
        console.error('Error during login:', error);
        event.reply('login-result', `Error: ${error.message}`);
    }
});

// Handle token generation without logging in
ipcMain.on('generate-token', (event) => {
    try {
        const macAddress = getMacAddress();
        if (!macAddress) {
            event.reply('token-result', 'Unable to retrieve MAC address.');
            return;
        }

        const hashedMacAddress = hashMacAddress(macAddress);
        event.reply('token-result', hashedMacAddress);
    } catch (error) {
        console.error('Error generating token:', error);
        event.reply('token-result', `Error: ${error.message}`);
    }
});

// Function to get the MAC address
function getMacAddress() {
    const networkInterfaces = os.networkInterfaces();
    let macAddress;

    Object.keys(networkInterfaces).forEach(interfaceName => {
        networkInterfaces[interfaceName].forEach(details => {
            if (details.family === 'IPv4' && !details.internal) {
                macAddress = details.mac;
            }
        });
    });

    return macAddress;
}

// Function to hash the MAC address
function hashMacAddress(macAddress) {
    return crypto.createHash('sha256').update(macAddress).digest('hex');
}
