import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const grid = input.split('\n').map(row => row.split(''));
const rows = grid.length;
const cols = grid[0].length;

// for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < cols; col++) {
//         const cell = grid[row][col];
//         console.log(cell);
//     }
// }

const inBounds = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;

const neighbors = (r: number, c: number) => [
    [r-1, c], [r+1, c], [r, c-1], [r, c+1], // 4-directional
    [r-1, c-1], [r-1, c+1], [r+1, c-1], [r+1, c+1] // diagonals
].filter(([nr, nc]) => inBounds(nr, nc));

let accessibleCount = 0;

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const cell = grid[row][col];

        if (cell !== '@') {
            continue;
        }

        const adjacentRolls = neighbors(row, col).filter(([nr, nc]) => grid[nr][nc] === '@').length;

        if (adjacentRolls < 4) {
            accessibleCount++;
        }
    }
}

// part one
console.log(accessibleCount);

// part two
const grid2 = input.split('\n').map(row => row.split(''));
let totalRemoved = 0;

while (true) {
    const toRemove: [number, number][] = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid2[row][col] !== '@') {
                continue;
            }

            const adjacentRolls = neighbors(row, col).filter(([nr, nc]) => grid2[nr][nc] === '@').length;

            if (adjacentRolls < 4) {
                toRemove.push([row, col]);
            }
        }
    }

    if (toRemove.length === 0) {
        break;
    }

    toRemove.forEach(([r, c]) => {
        grid2[r][c] = '.';
    });

    totalRemoved += toRemove.length;
}

console.log(totalRemoved);
