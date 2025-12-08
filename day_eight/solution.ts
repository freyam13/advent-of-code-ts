import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const coordinates: [number, number, number][] = input.split('\n').map(line => line.split(',').map(Number) as [number, number, number]);

const getDistance = ([x1, y1, z1]: number[], [x2, y2, z2]: number[]) => 
    (x1-x2) ** 2 + (y1-y2) ** 2 + (z1-z2) ** 2;

const pairs: { i: number, j: number, dist: number }[] = [];
for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
        pairs.push({ i, j, dist: getDistance(coordinates[i], coordinates[j]) });
        // console.log(pairs[pairs.length - 1]);
    }
}

pairs.sort((a, b) => a.dist - b.dist);

// each box starts in its own circuit
let circuits: number[][] = coordinates.map((_, i) => [i]);

const findCircuit = (boxIndex: number): number => {
    for (let i = 0; i < circuits.length; i++) {
        if (circuits[i].includes(boxIndex)) {
            return i;
        }
    }
    return -1;
};

// connect 1000 shortest pairs
for (let i = 0; i < 1000; i++) {
    const boxA = pairs[i].i;
    const boxB = pairs[i].j;

    const circuitA = findCircuit(boxA);
    const circuitB = findCircuit(boxB);

    if (circuitA !== circuitB) {
        for (const box of circuits[circuitB]) {
            circuits[circuitA].push(box);
        }
        circuits.splice(circuitB, 1);
    }
}

const sizes = circuits.map(c => c.length).sort((a, b) => b - a);

// part one
console.log(sizes[0] * sizes[1] * sizes[2]);

// part two - reset circuits and connect until only 1 remains
circuits = coordinates.map((_, i) => [i]);

let lastBoxA = 0;
let lastBoxB = 0;

for (let i = 0; i < pairs.length; i++) {
    const boxA = pairs[i].i;
    const boxB = pairs[i].j;

    const circuitA = findCircuit(boxA);
    const circuitB = findCircuit(boxB);

    if (circuitA !== circuitB) {
        for (const box of circuits[circuitB]) {
            circuits[circuitA].push(box);
        }
        circuits.splice(circuitB, 1);

        lastBoxA = boxA;
        lastBoxB = boxB;

        if (circuits.length === 1) {
            break;
        }
    }
}

const x1 = coordinates[lastBoxA][0];
const x2 = coordinates[lastBoxB][0];
console.log(x1 * x2);
