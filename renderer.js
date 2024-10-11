const { ipcRenderer } = require('electron');

// Handle login button click
document.getElementById('login-btn').addEventListener('click', () => {
    ipcRenderer.send('start-login');
});

// Handle token generation button click
document.getElementById('generate-token-btn').addEventListener('click', () => {
    ipcRenderer.send('generate-token');
});

// Receive the result from the main process for login
ipcRenderer.on('login-result', (event, result) => {
    document.getElementById('result').innerText = result;
});

// Receive the result from the main process for token generation
ipcRenderer.on('token-result', (event, token) => {
    document.getElementById('result').innerText = `Generated token: ${token}`;
});
