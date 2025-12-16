import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8').trim();

const blocks = input.split('\n\n');
const shapeBlocks: string[] = [];
const regionLines: string[] = [];

for (const block of blocks) {
    if (block.match(/^\d+:/)) {
        shapeBlocks.push(block);
    } else {
        regionLines.push(...block.split('\n'));
    }
}

// count cells in each shape
function countCells(block: string): number {
    const lines = block.split('\n').slice(1); // skip "N:" line
    let count = 0;
    for (const line of lines) {
        for (const ch of line) {
            if (ch === '#') count++;
        }
    }
    return count;
}

const shapeSizes = shapeBlocks.map(countCells);

// process regions - just check if total area fits
let count = 0;
for (const line of regionLines) {
    const [dims, ...counts] = line.split(' ');
    const [width, height] = dims.replace(':', '').split('x').map(Number);
    const presents = counts.map(Number);
    
    const regionArea = width * height;
    const presentsArea = presents.reduce((sum, qty, i) => sum + qty * shapeSizes[i], 0);
    
    if (presentsArea <= regionArea) {
        count++;
    }
}

// part one
console.log(count);
