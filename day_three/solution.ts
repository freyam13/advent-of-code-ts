import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const joltageRatings = input.trim().split('\n');

let totalJoltage = 0;

for (const jolt of joltageRatings) {
    let largestJolt = 0;
    let secondLargestJolt = 0;

    const digits = String(jolt).split('');
    digits.forEach((digit, i) => {
        // skip the last digit
        if (i === digits.length - 1) {
            return;
        }

        const numDigit = Number(digit);

        digits.forEach((otherDigit, j) => {
            if (j > i) {
                secondLargestJolt = Math.max(secondLargestJolt, Number(otherDigit));
            }
        });

        const joltage = numDigit * 10 + secondLargestJolt;
        console.log(largestJolt, joltage);
        largestJolt = Math.max(largestJolt, joltage);
        secondLargestJolt = 0;
    });

    totalJoltage += largestJolt;
}

// part one
console.log(totalJoltage);

// part two
const n = 12;
let totalJoltagePartTwo = 0;

for (const jolt of joltageRatings) {
    let largestJolt = '';
    let startIndex = 0;

    const digits = String(jolt).split('');

    for (let picked = 0; picked < n; picked++) {
        let maxDigit = '0';
        let maxIndex = startIndex;

        const latestPosition = digits.length - (n - picked - 1) - 1;

        digits.forEach((digit, i) => {
            if (i >= startIndex && i <= latestPosition && digit > maxDigit) {
                maxDigit = digit;
                maxIndex = i;
            }
        });

        largestJolt += maxDigit;
        startIndex = maxIndex + 1;
    }

    totalJoltagePartTwo += Number(largestJolt);
}

console.log(totalJoltagePartTwo);
