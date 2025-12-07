import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const grid = input.split('\n').map(row => row.split(''));
const rowCount = grid.length;
const columnCount = grid[0].length;

const columns = Array.from({ length: columnCount }, (_, colIndex) => 
    grid.map(row => row[colIndex])
);
const rows = Array.from({ length: rowCount }, (_, rowIndex) => 
    grid.map(col => col[rowIndex])
);

let columnsWithBeam = new Set<number>();
let splitCount = 0;

for (let i = 0; i < columnCount; i++) {
    if (columns[i].includes('S')) {
        columnsWithBeam.add(i);
    }
}

for (let row = 0; row < rowCount; row++) {
    let newColumnsWithBeam = new Set<number>();

    for (const col of columnsWithBeam) {
        if (grid[row][col] === '^') {
            newColumnsWithBeam.add(col - 1);
            newColumnsWithBeam.add(col + 1);
            splitCount++;
        } else {
            newColumnsWithBeam.add(col);
        }
    }

    columnsWithBeam = newColumnsWithBeam;
}

// part one
console.log(columnsWithBeam);
console.log(splitCount);

// part two - track timeline counts per column instead of just presence
let timelines = new Map<number, number>();

for (let i = 0; i < columnCount; i++) {
    if (columns[i].includes('S')) {
        timelines.set(i, 1);
    }
}

for (let row = 0; row < rowCount; row++) {
    let newTimelines = new Map<number, number>();

    for (const [col, count] of timelines) {
        if (grid[row][col] === '^') {
            // each timeline splits into two
            newTimelines.set(col - 1, (newTimelines.get(col - 1) || 0) + count);
            newTimelines.set(col + 1, (newTimelines.get(col + 1) || 0) + count);
        } else {
            newTimelines.set(col, (newTimelines.get(col) || 0) + count);
        }
    }

    timelines = newTimelines;
}

let totalTimelines = 0;
for (const count of timelines.values()) {
    totalTimelines += count;
}

// part two
console.log(timelines);
console.log(totalTimelines);
