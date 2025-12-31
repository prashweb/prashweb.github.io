const canvas = document.getElementById('parkCanvas');
const ctx = canvas.getContext('2d');
const form = document.getElementById('rewardForm');

const GRID_SIZE = 20; // 20x20 grid
const TILE = 20; // 20px pixels

let agent = {x: 0, y: 0};
let goal = {x: 15, y: 15};
let Q = []; // Q table

// Reward Mode
let mode = 'sparse';

function init() {
    // Initialize 20x20x4 Q-table
    Q = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill().map(() => [0,0,0,0]));
    agent = {x: 0, y: 0};
    
    // Get current mode
    const formData = new FormData(form);
    mode = formData.get('reward');
}

function getDist(x, y) {
    return Math.abs(x - goal.x) + Math.abs(y - goal.y);
}

function step() {
    let {x, y} = agent;
    
    // Epsilon-Greedy
    let action = 0;
    if (Math.random() < 0.1) action = Math.floor(Math.random() * 4);
    else {
        let max = -Infinity;
        for(let a=0; a<4; a++) if(Q[x][y][a] > max) { max = Q[x][y][a]; action = a; }
    }

    // Move
    let nx = x, ny = y;
    if (action === 0) ny = Math.max(0, y - 1); // Up
    if (action === 1) nx = Math.min(GRID_SIZE - 1, x + 1); // Right
    if (action === 2) ny = Math.min(GRID_SIZE - 1, y + 1); // Down
    if (action === 3) nx = Math.max(0, x - 1); // Left

    // CALCULATE REWARD (The Core Lesson)
    let reward = 0;
    let done = false;

    if (nx === goal.x && ny === goal.y) {
        reward = 100; // Big payoff
        done = true;
    } else {
        if (mode === 'sparse') {
            reward = -1; // Standard "time is money" penalty
        } else if (mode === 'dense') {
            // Reward = Improvement in distance
            let oldDist = getDist(x, y);
            let newDist = getDist(nx, ny);
            if (newDist < oldDist) reward = 1; // Good boy!
            else reward = -1; // Wrong way
        } else if (mode === 'bad') {
            reward = 1; // Reward just for existing/moving
        }
    }

    // Update Q
    let maxNext = done ? 0 : Math.max(...Q[nx][ny]);
    Q[x][y][action] += 0.5 * (reward + 0.9 * maxNext - Q[x][y][action]);

    if (done) agent = {x: 0, y: 0};
    else agent = {x: nx, y: ny};
}

function draw() {
    // Fading trail effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Goal
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(goal.x * TILE, goal.y * TILE, TILE, TILE);

    // Agent
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(agent.x * TILE, agent.y * TILE, TILE, TILE);

    // Draw Q-Values as arrows (Visual Debug)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for(let i=0; i<GRID_SIZE; i++) {
        for(let j=0; j<GRID_SIZE; j++) {
            ctx.strokeRect(i*TILE, j*TILE, TILE, TILE);
        }
    }
}

function loop() {
    for(let k=0; k<50; k++) step(); // Super fast training
    draw();
    requestAnimationFrame(loop);
}

function resetGrid() { init(); }
form.addEventListener('change', init);

init();
loop();
