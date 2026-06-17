// Game State
const gameState = {
    player: {
        cash: 1000,
        brainrots: [],
        baseUnlocked: true,
        lockTimer: null,
        multiplier: 1,
        hasBat: false,
        holding: null
    },
    enemies: [],
    gameConfig: {
        lockDuration: 15000, // 15 seconds
        incomeUpdateInterval: 1000,
        passiveIncome: 0
    }
};

// Brainrot Types
const brainrotTypes = [
    {
        id: 'goofball',
        name: 'Goofball',
        icon: '🤪',
        price: 100,
        income: 5,
        rarity: 'common'
    },
    {
        id: 'laugher',
        name: 'Laugher',
        icon: '😂',
        price: 250,
        income: 15,
        rarity: 'rare'
    },
    {
        id: 'dizzy',
        name: 'Dizzy',
        icon: '🌀',
        price: 500,
        income: 30,
        rarity: 'epic'
    },
    {
        id: 'chaos',
        name: 'Chaos Fiend',
        icon: '👹',
        price: 1000,
        income: 75,
        rarity: 'legendary'
    },
    {
        id: 'cosmic',
        name: 'Cosmic Brain',
        icon: '🌌',
        price: 2500,
        income: 200,
        rarity: 'mythic'
    },
    {
        id: 'infinity',
        name: 'Infinity Brain',
        icon: '♾️',
        price: 5000,
        income: 500,
        rarity: 'god'
    }
];

// Initialize Game
function initGame() {
    createShop();
    createEnemyBases();
    updateDisplay();
    startIncomeLoop();
    attachEventListeners();
}

// Create Shop
function createShop() {
    const shopContainer = document.getElementById('shopContainer');
    shopContainer.innerHTML = '';

    brainrotTypes.forEach(brainrot => {
        const item = document.createElement('div');
        item.className = 'brainrot-item';
        item.innerHTML = `
            <div class="brainrot-icon">${brainrot.icon}</div>
            <div class="brainrot-name">${brainrot.name}</div>
            <div class="brainrot-rarity rarity-${brainrot.rarity}">${brainrot.rarity.toUpperCase()}</div>
            <div class="brainrot-price">$${brainrot.price}</div>
            <div class="brainrot-income">+$${brainrot.income}/sec</div>
        `;
        item.addEventListener('click', () => buyBrainrot(brainrot));
        shopContainer.appendChild(item);
    });
}

// Buy Brainrot
function buyBrainrot(brainrot) {
    const actualPrice = brainrot.price * gameState.player.multiplier;
    
    if (gameState.player.cash >= actualPrice) {
        gameState.player.cash -= actualPrice;
        const newBrainrot = {
            ...brainrot,
            id: Date.now(),
            actualPrice: actualPrice,
            multiplier: gameState.player.multiplier
        };
        gameState.player.brainrots.push(newBrainrot);
        updateDisplay();
        showNotification(`Bought ${brainrot.name}! 🧠`);
    } else {
        showNotification(`Not enough cash! Need $${actualPrice}`, 'error');
    }
}

// Create Enemy Bases
function createEnemyBases() {
    gameState.enemies = [];
    for (let i = 0; i < 4; i++) {
        const enemyBrainrots = [];
        for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
            const randomBrainrot = brainrotTypes[Math.floor(Math.random() * brainrotTypes.length)];
            enemyBrainrots.push({ ...randomBrainrot, id: Date.now() + Math.random() });
        }
        gameState.enemies.push({
            id: i,
            name: `Player ${i + 1}`,
            brainrots: enemyBrainrots,
            baseUnlocked: Math.random() > 0.3,
            lockTimer: null
        });
    }
    renderEnemyBases();
}

// Render Enemy Bases
function renderEnemyBases() {
    const enemiesGrid = document.getElementById('enemiesGrid');
    enemiesGrid.innerHTML = '';

    gameState.enemies.forEach(enemy => {
        const baseDiv = document.createElement('div');
        baseDiv.className = 'enemy-base';
        baseDiv.innerHTML = `
            <div class="base-header">${enemy.name}</div>
            <div>${enemy.brainrots.map(b => `<div class="enemy-brainrot">${b.icon}</div>`).join('')}</div>
            ${!enemy.baseUnlocked ? '<div class="enemy-locked">🔒 LOCKED</div>' : ''}
        `;
        baseDiv.addEventListener('click', () => attackEnemy(enemy));
        enemiesGrid.appendChild(baseDiv);
    });
}

// Attack Enemy / Steal
function attackEnemy(enemy) {
    if (enemy.baseUnlocked === false) {
        showNotification('Base is locked! 🔒', 'warning');
        return;
    }

    if (enemy.brainrots.length === 0) {
        showNotification('No brainrots to steal! 😅', 'warning');
        return;
    }

    const stolenBrainrot = enemy.brainrots.pop();
    gameState.player.holding = stolenBrainrot;
    showNotification(`Stole ${stolenBrainrot.name}! Run back to your base! 🏃`, 'info');
    updateDisplay();
}

// Deposit Brainrot at Base
function depositBrainrot() {
    if (gameState.player.holding) {
        gameState.player.brainrots.push(gameState.player.holding);
        showNotification(`Deposited ${gameState.player.holding.name}! 🏠`, 'info');
        gameState.player.holding = null;
        updateDisplay();
    }
}

// Calculate Passive Income
function calculatePassiveIncome() {
    let income = 0;
    gameState.player.brainrots.forEach(b => {
        income += b.income * b.multiplier;
    });
    return Math.floor(income);
}

// Start Income Loop
function startIncomeLoop() {
    setInterval(() => {
        const income = calculatePassiveIncome();
        if (income > 0) {
            gameState.player.cash += income;
            updateDisplay();
        }
    }, gameState.gameConfig.incomeUpdateInterval);
}

// Lock/Unlock Base
function toggleBaseLock() {
    const lockBtn = document.getElementById('lockBtn');
    const lockStatus = document.getElementById('lockStatus');

    if (gameState.player.baseUnlocked) {
        gameState.player.baseUnlocked = false;
        lockBtn.textContent = '🔒 Lock Base';
        lockBtn.classList.add('locked');
        lockStatus.textContent = 'Locked';
        lockStatus.classList.add('locked');
        showNotification('Base locked! Enemies cannot steal for 15 seconds! 🔒');

        setTimeout(() => {
            gameState.player.baseUnlocked = true;
            lockBtn.textContent = '🔓 Unlock Base';
            lockBtn.classList.remove('locked');
            lockStatus.textContent = 'Unlocked';
            lockStatus.classList.remove('locked');
            showNotification('Base unlocked! 🔓');
        }, gameState.gameConfig.lockDuration);
    }
}

// Combat System
function toggleBat() {
    const combatBtn = document.getElementById('combatBtn');
    const combatStatus = document.getElementById('combatStatus');

    gameState.player.hasBat = !gameState.player.hasBat;

    if (gameState.player.hasBat) {
        combatBtn.classList.add('active');
        combatBtn.textContent = '🔨 Bat Equipped';
        combatStatus.innerHTML = '⚔️ <strong>Bat Ready!</strong><br/>Click enemies to attack!';
        showNotification('Bat equipped! 🔨 You can now hit enemies!', 'info');
    } else {
        combatBtn.classList.remove('active');
        combatBtn.textContent = '🔨 Equip Bat';
        combatStatus.innerHTML = '';
        showNotification('Bat unequipped!');
    }
}

// Rebirth System
function rebirth() {
    const confirmed = confirm('Rebirth will reset your brainrots but give you a x2 multiplier!\n\nContinue?');
    if (confirmed) {
        gameState.player.multiplier *= 2;
        gameState.player.brainrots = [];
        gameState.player.cash = 1000;
        gameState.player.holding = null;
        createEnemyBases();
        showNotification(`🔄 Rebirthd! New Multiplier: x${gameState.player.multiplier}`);
        updateDisplay();
    }
}

// Update Display
function updateDisplay() {
    // Update stats
    document.getElementById('playerCash').textContent = `$${gameState.player.cash.toLocaleString()}`;
    document.getElementById('playerIncome').textContent = `$${calculatePassiveIncome()}`;
    document.getElementById('playerBrainrots').textContent = gameState.player.brainrots.length;

    // Update your base
    const yourBase = document.getElementById('yourBase');
    yourBase.innerHTML = '';
    gameState.player.brainrots.forEach(b => {
        const brainrotDiv = document.createElement('div');
        brainrotDiv.className = 'brainrot-display';
        brainrotDiv.innerHTML = `${b.icon}<small>${b.name}</small>`;
        yourBase.appendChild(brainrotDiv);
    });

    // Update inventory/holding
    const inventory = document.getElementById('inventory');
    if (gameState.player.holding) {
        inventory.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 3em;">${gameState.player.holding.icon}</div>
                <div style="font-weight: bold; margin-top: 10px;">${gameState.player.holding.name}</div>
                <button onclick="depositBrainrot()" style="margin-top: 10px; padding: 10px 15px; background: #27ae60; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    📦 Deposit at Base
                </button>
            </div>
        `;
    } else {
        inventory.innerHTML = '<p>Nothing in hand</p>';
    }

    // Render enemies
    renderEnemyBases();
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Attach Event Listeners
function attachEventListeners() {
    document.getElementById('lockBtn').addEventListener('click', toggleBaseLock);
    document.getElementById('combatBtn').addEventListener('click', toggleBat);
    document.querySelector('.btn-rebirth').addEventListener('click', rebirth);

    // Keyboard shortcuts
    document.addEventListener('keypress', (e) => {
        if (e.key === 'l' || e.key === 'L') toggleBaseLock();
        if (e.key === 'b' || e.key === 'B') toggleBat();
    });
}

// Start the game
window.addEventListener('DOMContentLoaded', initGame);