// Admin Panel System
const ADMIN_PASSWORD = 'pepe27967d'; // Change this to your password
let adminLoggedIn = false;
let selectedBrainrotForSpawn = null;

// Initialize Admin Access
function initAdminAccess() {
    // Press 'A' + 'D' + 'M' + 'I' + 'N' to show admin button
    let keySequence = '';
    document.addEventListener('keypress', (e) => {
        keySequence += e.key.toLowerCase();
        if (keySequence.includes('admin')) {
            showAdminAccessBtn();
            keySequence = '';
        }
        if (keySequence.length > 10) keySequence = keySequence.slice(-5);
    });
}

// Show Admin Access Button
function showAdminAccessBtn() {
    const btn = document.getElementById('adminAccessBtn');
    btn.style.display = 'block';
    showNotification('Admin button unlocked! Click the 🔐 button', 'info');
}

// Show Login Modal
function showAdminLogin() {
    document.getElementById('adminLoginModal').classList.remove('hidden');
    document.getElementById('adminPassword').focus();
}

// Close Login Modal
function closeAdminLogin() {
    document.getElementById('adminLoginModal').classList.add('hidden');
    document.getElementById('adminPassword').value = '';
}

// Login to Admin Panel
function loginAdmin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        closeAdminLogin();
        openAdminPanel();
        showNotification('✅ Admin panel unlocked!', 'success');
    } else {
        showNotification('❌ Wrong password!', 'error');
        document.getElementById('adminPassword').value = '';
    }
}

// Open Admin Panel
function openAdminPanel() {
    if (!adminLoggedIn) {
        showAdminLogin();
        return;
    }
    document.getElementById('adminPanel').classList.remove('hidden');
    populateAdminData();
}

// Close Admin Panel
function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
    adminLoggedIn = false;
}

// Populate Admin Data
function populateAdminData() {
    // Update player stats
    document.getElementById('adminPlayerCash').textContent = `$${gameState.player.cash.toLocaleString()}`;
    document.getElementById('adminPlayerMultiplier').textContent = `x${gameState.player.multiplier}`;
    document.getElementById('adminPlayerBrainrotCount').textContent = gameState.player.brainrots.length;

    // Populate brainrot dropdown
    const select = document.getElementById('adminBrainrotType');
    select.innerHTML = '<option value="">Select brainrot type</option>';
    brainrotTypes.forEach((b, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${b.name} (${b.rarity})`;
        select.appendChild(option);
    });

    // Populate spawn grid
    const spawnGrid = document.getElementById('spawnBrainrotGrid');
    spawnGrid.innerHTML = '';
    brainrotTypes.forEach((b, index) => {
        const item = document.createElement('div');
        item.className = 'admin-spawn-item';
        item.innerHTML = `<div>${b.icon}</div><div>${b.name}</div>`;
        item.onclick = () => selectBrainrotForSpawn(index, item);
        spawnGrid.appendChild(item);
    });

    // Populate enemy list
    populateEnemyList();

    // Populate enemy select for spawn
    const enemySelect = document.getElementById('spawnEnemySelect');
    enemySelect.innerHTML = '<option value="">Select enemy</option>';
    gameState.enemies.forEach(e => {
        const option = document.createElement('option');
        option.value = e.id;
        option.textContent = e.name;
        enemySelect.appendChild(option);
    });

    // Update game stats
    document.getElementById('adminTotalEnemies').textContent = gameState.enemies.length;
}

// Populate Enemy List
function populateEnemyList() {
    const list = document.getElementById('adminEnemiesList');
    list.innerHTML = '';
    
    gameState.enemies.forEach(enemy => {
        const enemyDiv = document.createElement('div');
        enemyDiv.className = 'admin-enemy-item';
        enemyDiv.innerHTML = `
            <div class="enemy-info">
                <h4>${enemy.name}</h4>
                <p>🧠 Brainrots: ${enemy.brainrots.length}</p>
                <p>🔓 Base: ${enemy.baseUnlocked ? 'Unlocked' : 'Locked'}</p>
            </div>
            <div class="enemy-actions">
                <button onclick="giveEnemyCash(${enemy.id})" class="btn-admin-small">💰 Give Cash</button>
                <button onclick="forceEnemyRebirth(${enemy.id})" class="btn-admin-small">🔄 Rebirth</button>
                <button onclick="clearEnemyBrainrots(${enemy.id})" class="btn-admin-small btn-danger">🗑️ Clear</button>
                <button onclick="kickPlayer(${enemy.id})" class="btn-admin-small btn-danger">👢 Kick</button>
            </div>
        `;
        list.appendChild(enemyDiv);
    });
}

// Switch Admin Tabs
function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    // Update data if enemies tab
    if (tabName === 'enemies') {
        populateEnemyList();
    }
}

// ===== PLAYER MANAGEMENT =====

function setPlayerCash() {
    const amount = parseFloat(document.getElementById('adminCash').value);
    if (isNaN(amount) || amount < 0) {
        showNotification('Invalid amount!', 'error');
        return;
    }
    gameState.player.cash = amount;
    document.getElementById('adminCash').value = '';
    updateDisplay();
    populateAdminData();
    showNotification(`💰 Set cash to $${amount}`, 'success');
}

function setPlayerMultiplier() {
    const multiplier = parseFloat(document.getElementById('adminMultiplier').value);
    if (isNaN(multiplier) || multiplier < 0.1) {
        showNotification('Invalid multiplier!', 'error');
        return;
    }
    gameState.player.multiplier = multiplier;
    document.getElementById('adminMultiplier').value = '';
    updateDisplay();
    populateAdminData();
    showNotification(`📊 Set multiplier to x${multiplier}`, 'success');
}

function forcePlayerRebirth() {
    gameState.player.multiplier *= 2;
    gameState.player.brainrots = [];
    gameState.player.cash = 1000;
    gameState.player.holding = null;
    updateDisplay();
    populateAdminData();
    showNotification(`🔄 Player rebirthd! New multiplier: x${gameState.player.multiplier}`, 'success');
}

function giveBrainrot() {
    const index = document.getElementById('adminBrainrotType').value;
    if (index === '') {
        showNotification('Select a brainrot type!', 'error');
        return;
    }
    const brainrot = brainrotTypes[index];
    const newBrainrot = {
        ...brainrot,
        id: Date.now(),
        actualPrice: brainrot.price,
        multiplier: gameState.player.multiplier
    };
    gameState.player.brainrots.push(newBrainrot);
    updateDisplay();
    populateAdminData();
    showNotification(`🧠 Gave ${brainrot.name} to player!`, 'success');
}

function clearPlayerBrainrots() {
    if (confirm('Clear all player brainrots?')) {
        gameState.player.brainrots = [];
        updateDisplay();
        populateAdminData();
        showNotification('🗑️ Cleared all player brainrots!', 'success');
    }
}

// ===== ENEMY MANAGEMENT =====

function giveEnemyCash(enemyId) {
    const amount = prompt('How much cash to give?', '1000');
    if (amount === null) return;
    
    const cash = parseFloat(amount);
    if (isNaN(cash) || cash < 0) {
        showNotification('Invalid amount!', 'error');
        return;
    }
    
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    if (!enemy.cash) enemy.cash = 0;
    enemy.cash += cash;
    
    showNotification(`💰 Gave ${enemy.name} $${cash}!`, 'success');
    populateEnemyList();
}

function forceEnemyRebirth(enemyId) {
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    enemy.brainrots = [];
    if (!enemy.multiplier) enemy.multiplier = 1;
    enemy.multiplier *= 2;
    
    showNotification(`🔄 ${enemy.name} rebirthd!`, 'success');
    populateEnemyList();
    updateDisplay();
}

function clearEnemyBrainrots(enemyId) {
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    if (confirm(`Clear all brainrots from ${enemy.name}?`)) {
        enemy.brainrots = [];
        showNotification(`🗑️ Cleared ${enemy.name}'s brainrots!`, 'success');
        populateEnemyList();
        updateDisplay();
    }
}

function kickPlayer(enemyId) {
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    if (!enemy) return;
    
    if (confirm(`Kick ${enemy.name} from the game?`)) {
        gameState.enemies = gameState.enemies.filter(e => e.id !== enemyId);
        showNotification(`👢 Kicked ${enemy.name} from the game!`, 'success');
        populateEnemyList();
        updateDisplay();
    }
}

// ===== SPAWN SYSTEM =====

function selectBrainrotForSpawn(index, element) {
    // Remove previous selection
    document.querySelectorAll('.admin-spawn-item').forEach(e => e.classList.remove('selected'));
    
    // Select new one
    element.classList.add('selected');
    selectedBrainrotForSpawn = index;
}

function spawnSelectedBrainrot() {
    if (selectedBrainrotForSpawn === null) {
        showNotification('Select a brainrot first!', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('spawnQuantity').value);
    if (isNaN(quantity) || quantity < 1) {
        showNotification('Invalid quantity!', 'error');
        return;
    }
    
    const brainrot = brainrotTypes[selectedBrainrotForSpawn];
    
    for (let i = 0; i < quantity; i++) {
        const newBrainrot = {
            ...brainrot,
            id: Date.now() + Math.random(),
            actualPrice: brainrot.price,
            multiplier: gameState.player.multiplier
        };
        gameState.player.brainrots.push(newBrainrot);
    }
    
    updateDisplay();
    populateAdminData();
    showNotification(`🧠 Spawned ${quantity} ${brainrot.name} to inventory!`, 'success');
}

function spawnToEnemy() {
    if (selectedBrainrotForSpawn === null) {
        showNotification('Select a brainrot first!', 'error');
        return;
    }
    
    const enemyId = parseInt(document.getElementById('spawnEnemySelect').value);
    if (isNaN(enemyId)) {
        showNotification('Select an enemy!', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('spawnQuantity').value);
    if (isNaN(quantity) || quantity < 1) {
        showNotification('Invalid quantity!', 'error');
        return;
    }
    
    const enemy = gameState.enemies.find(e => e.id === enemyId);
    const brainrot = brainrotTypes[selectedBrainrotForSpawn];
    
    if (!enemy) {
        showNotification('Enemy not found!', 'error');
        return;
    }
    
    for (let i = 0; i < quantity; i++) {
        const newBrainrot = {
            ...brainrot,
            id: Date.now() + Math.random(),
            actualPrice: brainrot.price,
            multiplier: enemy.multiplier || 1
        };
        enemy.brainrots.push(newBrainrot);
    }
    
    updateDisplay();
    populateAdminData();
    showNotification(`🧠 Spawned ${quantity} ${brainrot.name} to ${enemy.name}!`, 'success');
}

// ===== SETTINGS =====

function changeAdminPassword() {
    const newPassword = document.getElementById('newAdminPassword').value;
    if (newPassword.length < 4) {
        showNotification('Password must be at least 4 characters!', 'error');
        return;
    }
    
    // Note: In a real app, you'd send this to a server
    // For now, we'll just show a message
    showNotification('⚠️ Password changes should be done on the server for security!', 'warning');
    document.getElementById('newAdminPassword').value = '';
}

function respawnAllEnemies() {
    if (confirm('Respawn all enemies with random brainrots?')) {
        createEnemyBases();
        populateAdminData();
        showNotification('🔄 All enemies respawned!', 'success');
    }
}

function logoutAdmin() {
    if (confirm('Logout from admin panel?')) {
        closeAdminPanel();
        document.getElementById('adminAccessBtn').style.display = 'none';
        showNotification('Logged out from admin panel', 'info');
    }
}

// Listen for Ctrl+Shift+A to open admin (if already logged in)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        if (adminLoggedIn) {
            openAdminPanel();
        }
    }
});

// Initialize admin access when game starts
window.addEventListener('DOMContentLoaded', () => {
    initAdminAccess();
    
    // Add click listener to admin button
    const adminBtn = document.getElementById('adminAccessBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            if (adminLoggedIn) {
                openAdminPanel();
            } else {
                showAdminLogin();
            }
        });
    }
});