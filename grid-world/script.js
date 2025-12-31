const canvas = document.getElementById('gridCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 10;
const COLS = 10;
const CELL_SIZE = 50;
const GAMMA = 0.9;

// Grid State: 0=Empty, 1=Wall, 2=Fire(-10), 3=Diamond(+10)
let map = [];
let values = []; // The V(s) table

function init() {
    // 1. Build Map
    map = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    values = Array(ROWS).fill().map(() => Array(COLS).fill(0));

    // Place Objects
    map[2][2] = 2; // Fire
    map[2][3] = 2; 
    map[3][2] = 2;
    map[1][8] = 3; // Diamond (Goal)
    
    // Place Walls
    map[5][4] = 1; map[5][5] = 1; map[5][6] = 1;

    draw();
}

function getReward(r, c) {
    if (map[r][c] === 2) return -10; // Fire
    if (map[r][c] === 3) return 10;  // Diamond
    return 0; // Empty step
}

function step() {
    let newValues = JSON.parse(JSON.stringify(values));

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            // Skip walls and terminal states (optional, but usually terminals stay static)
            if (map[r][c] === 1) continue; 
            if (map[r][c] === 2 || map[r][c] === 3) {
                newValues[r][c] = getReward(r, c); // Terminal state value is just reward
                continue;
            }

            // Look at 4 neighbors (Up, Down, Left, Right)
            let moves = [[0,1], [0,-1], [1,0], [-1,0]];
            let maxVal = -Infinity;

            moves.forEach(([dr, dc]) => {
                let nr = r + dr, nc = c + dc;
                
                // Bounce off walls/edges
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || map[nr][nc] === 1) {
                    nr = r; nc = c;
                }
                
                // Bellman Update: V(s) = max_a ( R + gamma * V(s') )
                // Note: Here Reward is on the state s', not the transition
                let val = getReward(nr, nc) + GAMMA * values[nr][nc]; // Simplified deterministic
                if (val > maxVal) maxVal = val;
            });

            newValues[r][c] = maxVal;
        }
    }
    values = newValues;
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            let x = c * CELL_SIZE;
            let y = r * CELL_SIZE;

            // Color based on Value
            let v = values[r][c];
            ctx.fillStyle = 'white';
            if (map[r][c] === 1) ctx.fillStyle = '#333'; // Wall
            else if (v > 0) ctx.fillStyle = `rgba(46, 204, 113, ${Math.min(v/10, 1)})`; // Green
            else if (v < 0) ctx.fillStyle = `rgba(231, 76, 60, ${Math.min(Math.abs(v)/10, 1)})`; // Red

            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

            // Draw Icons
            ctx.fillStyle = 'black';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            if (map[r][c] === 2) ctx.fillText('🔥', x + 25, y + 30);
            if (map[r][c] === 3) ctx.fillText('💎', x + 25, y + 30);
            
            // Draw Value Number
            if (map[r][c] !== 1) {
                ctx.fillStyle = '#000';
                ctx.fillText(v.toFixed(1), x + 25, y + 15);
            }
        }
    }
}

function resetGrid() { init(); }

init();
