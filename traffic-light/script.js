const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const epsSlider = document.getElementById('epsilonSlider');
const epsDisplay = document.getElementById('epsValue');
const scoreDisplay = document.getElementById('score');

// Config
let epsilon = 0.2;
let isRunning = false;
let carsPassed = 0;

// State:
// We have 2 roads: 0 (Horizontal/East-West), 1 (Vertical/North-South)
// Light State: 0 (Green for Horz), 1 (Green for Vert)
let queues = [0, 0]; // Number of cars waiting in each road
let lightState = 0;  
let timer = 0; // Minimum time before switching allowed

// Q-Table: Q[State][Action]
// State simplification: 0 = "More cars on Horz", 1 = "More cars on Vert", 2 = "Equal"
// Actions: 0 = Set Green Horz, 1 = Set Green Vert
let Q = [
    [0, 0], // State 0: Horz heavy
    [0, 0], // State 1: Vert heavy
    [0, 0]  // State 2: Equal
];
const ALPHA = 0.1; // Learning Rate
const GAMMA = 0.9; // Discount

epsSlider.addEventListener('input', (e) => {
    epsilon = e.target.value;
    epsDisplay.innerText = epsilon;
});

function toggleSim() {
    isRunning = !isRunning;
    if (isRunning) loop();
}

function getState() {
    if (queues[0] > queues[1]) return 0;
    if (queues[1] > queues[0]) return 1;
    return 2;
}

function step() {
    // 1. Cars Arrive (Random Poisson-ish)
    if (Math.random() < 0.3) queues[0]++;
    if (Math.random() < 0.3) queues[1]++;

    // 2. Agent Decision (Every 20 frames to prevent flickering)
    timer++;
    if (timer > 20) {
        timer = 0;
        let state = getState();
        let action;

        // Epsilon-Greedy Logic
        if (Math.random() < epsilon) {
            action = Math.floor(Math.random() * 2); // Explore
        } else {
            action = Q[state][0] > Q[state][1] ? 0 : 1; // Exploit
        }

        // Apply Action
        lightState = action;

        // Calculate Reward (Negative queue length = penalty)
        let reward = -(queues[0] + queues[1]);

        // Q-Learning Update
        // New State might have changed instantly if we cleared cars, 
        // but for simple Q-learning we look at max Q of next step.
        let nextState = getState();
        let maxNextQ = Math.max(Q[nextState][0], Q[nextState][1]);
        
        Q[state][action] = Q[state][action] + ALPHA * (reward + GAMMA * maxNextQ - Q[state][action]);
    }

    // 3. Move Cars (if light is green)
    if (lightState === 0 && queues[0] > 0) { queues[0]--; carsPassed++; }
    else if (lightState === 1 && queues[1] > 0) { queues[1]--; carsPassed++; }

    scoreDisplay.innerText = carsPassed;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Roads (Cross)
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 120, 600, 60); // Horz
    ctx.fillRect(270, 0, 60, 300); // Vert

    // Draw Cars (Simple count visualization)
    ctx.fillStyle = '#f1c40f'; // Yellow cars
    // Horz Queue
    for(let i=0; i<Math.min(queues[0], 10); i++) {
        ctx.fillRect(250 - (i*25), 135, 20, 30);
    }
    // Vert Queue
    for(let i=0; i<Math.min(queues[1], 10); i++) {
        ctx.fillRect(285, 100 - (i*25), 30, 20);
    }
    
    // Draw Traffic Light
    ctx.fillStyle = lightState === 0 ? '#2ecc71' : '#e74c3c';
    ctx.beginPath(); ctx.arc(200, 200, 10, 0, Math.PI*2); ctx.fill(); 
    ctx.fillStyle = 'black'; ctx.fillText("EW Light", 180, 220);

    ctx.fillStyle = lightState === 1 ? '#2ecc71' : '#e74c3c';
    ctx.beginPath(); ctx.arc(400, 200, 10, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black'; ctx.fillText("NS Light", 380, 220);

    // Draw Q-Table Values
    ctx.fillStyle = '#333';
    ctx.fillText(`Q(EW Heavy, GreenEW): ${Q[0][0].toFixed(1)}`, 10, 20);
    ctx.fillText(`Q(EW Heavy, GreenNS): ${Q[0][1].toFixed(1)}`, 10, 40);
}

function loop() {
    if (!isRunning) return;
    step();
    draw();
    requestAnimationFrame(loop);
}

// Initial Draw
draw();
