import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const instructions = input.trim().split('\n');

const operations = instructions.map(instruction => instruction.split(/(?<=\D)(?=\d)|(?<=\d)(?=\D)/));

let currentPosition = 50;
let zeroCount = 0;
let zeroCrossings = 0;

for (const operation of operations) {
    move(operation);
}

function move(operation: string[]) {
    const direction = operation[0];
    const steps = parseInt(operation[1]);

    if (direction === 'L') {
        if (currentPosition === 0) {
            zeroCrossings += Math.floor(steps / 100);
        } else if (steps >= currentPosition) {
            zeroCrossings += Math.floor((steps - currentPosition) / 100) + 1;
        }
        currentPosition = ((currentPosition - steps) % 100 + 100) % 100;
        
    } else {
        if (currentPosition === 0) {
            zeroCrossings += Math.floor(steps / 100);
        } else if (steps >= 100 - currentPosition) {
            zeroCrossings += Math.floor((steps + currentPosition) / 100);
        }
        currentPosition = (currentPosition + steps) % 100;
    }

    if (currentPosition === 0) {
        zeroCount++;
    }
}

// part one
console.log(zeroCount);

// part two
console.log(zeroCrossings);
