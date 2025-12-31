const canvas = document.getElementById('cliffCanvas');
const ctx = canvas.getContext('2d');
const algoSelect = document.getElementById('algoSelect');
const epDisplay = document.getElementById('episodes');

// Grid Config (4 rows x 12 cols)
const ROWS = 4;
const COLS = 12;
const CELL_SIZE = 50;

// RL Config
const ALPHA = 0.5; // High learning rate for fast demo
const GAMMA = 1.0;
const EPSILON = 0.1; // 10% chance of slipping (exploration)

let Q = []; // State-Action table
let currentAlgo = 'qlearning';
let episodes = 0;
let agentPos = {r: 3, c: 0}; // Start at bottom-left

function init() {
    // Initialize Q-table: 4x12 grid, each cell has 4 actions (0:Up, 1:Right, 2:Down, 3:Left)
    Q = Array(ROWS).fill().map(() => Array(COLS).fill().map(() => [0, 0, 0, 0]));
    episodes = 0;
    resetAgent();
    loop();
}

function resetAgent() {
    agentPos = {r: 3, c: 0};
}

function getAction(r, c) {
    if (Math.random() < EPSILON) return Math.floor(Math.random() * 4); // Explore
    
    // Exploit: Find max Q
    let bestA = 0;
    let maxQ = -Infinity;
    for(let a=0; a<4; a++) {
        if(Q[r][c][a] > maxQ) { maxQ = Q[r][c][a]; bestA = a; }
    }
    return bestA;
}

function step() {
    // 1. Current State
    let r = agentPos.r;
    let c = agentPos.c;
    let action = getAction(r, c);

    // 2. Take Action
    let nr = r, nc = c;
    if (action === 0) nr = Math.max(0, r - 1); // Up
    if (action === 1) nc = Math.min(COLS - 1, c + 1); // Right
    if (action === 2) nr = Math.min(ROWS - 1, r + 1); // Down
    if (action === 3) nc = Math.max(0, c - 1); // Left

    // 3. Calculate Reward
    let reward = -1; // Standard step cost
    let done = false;

    // Check Cliff (Row 3, Cols 1 to 10)
    if (nr === 3 && nc > 0 && nc < 11) {
        reward = -100; // Fell off cliff
        done = true; 
    }
    // Check Goal (Row 3, Col 11)
    else if (nr === 3 && nc === 11) {
        reward = 10; // Reached goal
        done = true;
    }

    // 4. Update Q-Value
    let currentQ = Q[r][c][action];
    let target = 0;

    if (currentAlgo === 'qlearning') {
        // Q-Learning: max over next actions (Off-Policy)
        // Even if we explore next, we update based on the BEST action we *could* take
        let maxNextQ = done ? 0 : Math.max(...Q[nr][nc]);
        target = reward + GAMMA * maxNextQ;
    } else {
        // SARSA: actual next action (On-Policy)
        // We look at what the agent actually plans to do next (risk included)
        let nextAction = getAction(nr, nc); // We simulate the next step selection
        let nextQ = done ? 0 : Q[nr][nc][nextAction];
        target = reward + GAMMA * nextQ;
    }

    Q[r][c][action] += ALPHA * (target - currentQ);

    // Move Agent
    if (done) {
        resetAgent();
        episodes++;
        epDisplay.innerText = episodes;
    } else {
        agentPos = {r: nr, c: nc};
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    for(let r=0; r<ROWS; r++) {
        for(let c=0; c<COLS; c++) {
            let x = c * CELL_SIZE;
            let y = r * CELL_SIZE;

            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

            // Draw Cliff
            if (r===3 && c > 0 && c < 11) {
                ctx.fillStyle = '#ccc';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = '#555';
                ctx.fillText("Cliff", x+10, y+30);
            }
            // Draw Goal
            if (r===3 && c === 11) {
                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = 'white';
                ctx.fillText("Goal", x+10, y+30);
            }
            
            // Visualize Value (Heatmap)
            // Just show max Q for this cell as a subtle background color
            let maxQ = Math.max(...Q[r][c]);
            if (maxQ < 0 && !(r===3 && c > 0 && c < 11)) {
                // Red tint for bad spots
                ctx.fillStyle = `rgba(231, 76, 60, ${Math.min(Math.abs(maxQ)/100, 0.5)})`;
                ctx.fillRect(x+2, y+2, CELL_SIZE-4, CELL_SIZE-4);
            }
        }
    }

    // Draw Agent
    ctx.fillStyle = '#3742fa';
    ctx.beginPath();
    ctx.arc(agentPos.c * CELL_SIZE + 25, agentPos.r * CELL_SIZE + 25, 15, 0, Math.PI*2);
    ctx.fill();
}

function loop() {
    // Run multiple steps per frame to speed up learning
    for(let i=0; i<10; i++) step();
    draw();
    requestAnimationFrame(loop);
}

function resetSim() {
    currentAlgo = algoSelect.value;
    init();
}

// Handle Dropdown Change
algoSelect.addEventListener('change', () => {
    resetSim();
});

init();
