import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

let ingredientRanges: [number, number][] = [];
let ingredientsOnHand: number[] = [];

for (const line of input.split('\n')) {
    if (line.includes('-')) {
        const [start, end] = line.split('-').map(Number);
        ingredientRanges.push([start, end]);
    } else if (line.trim() !== '') {
        ingredientsOnHand.push(Number(line));
    }
}

const isFresh = (id: number) => ingredientRanges.some(([start, end]) => id >= start && id <= end);

const freshCount = ingredientsOnHand.filter(isFresh).length;

// part one
console.log(freshCount);

// part two - too many numnbers to enumerate, so we have merge overlapping ranges
const sortedRanges: [number, number][] = [];
for (const range of ingredientRanges) {
    sortedRanges.push([range[0], range[1]]);
}

sortedRanges.sort((a, b) => a[0] - b[0]);

const mergedRanges: [number, number][] = [];
for (const range of sortedRanges) {
    const start = range[0];
    const end = range[1];

    if (mergedRanges.length === 0) {
        mergedRanges.push([start, end]);
    } else {
        const lastRange = mergedRanges[mergedRanges.length - 1];
        const lastEnd = lastRange[1];

        if (start <= lastEnd + 1) {
            if (end > lastEnd) {
                lastRange[1] = end;
            }
        } else {
            mergedRanges.push([start, end]);
        }
    }
}

let totalFreshIds = 0;
for (const range of mergedRanges) {
    const start = range[0];
    const end = range[1];
    const size = end - start + 1;
    totalFreshIds += size;
}

console.log(totalFreshIds);