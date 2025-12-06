import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const grid = input.split('\n').map(row => row.trim().split(/\s+/));
const rows = grid.length;
const cols = grid[0].length;

const operations: Record<string, (a: number, b: number) => number> = {
    '+': (a, b) => a + b,
    '*': (a, b) => a * b,
};

const columns = Array.from({ length: cols }, (_, colIndex) => 
    grid.map(row => row[colIndex])
);

let total = 0;

for (const column of columns) {
    let operator = column[column.length - 1];
    let values = column.slice(0, -1).map(Number);

    // prevents duplicating the first value when using multiplication
    let initialValue = operator === '+' ? 0 : 1;
    let result = values.reduce((result, value) => operations[operator](result, value), initialValue);

    total += result;
}

// part one
console.log(total);

// part two - read by character position
// 7329921182115
const lines = input.split('\n').filter(line => line.length > 0);
const operatorLine = lines[lines.length - 1];
const numLines = lines.slice(0, -1);
const maxLen = Math.max(...lines.map(l => l.length));

let totalPartTwo = 0;
let values: number[] = [];
let op = '';

const calc = () => values.reduce((a, b) => op === '+' ? a + b : a * b, op === '+' ? 0 : 1);

for (let pos = 0; pos < maxLen; pos++) {
    const opChar = operatorLine[pos] || ' ';
    const digits = numLines.map(l => l[pos] || ' ').join('').trim();

    if (digits) values.push(Number(digits));
    if (opChar === '+' || opChar === '*') op = opChar;

    if (!digits && values.length > 0 && op) {
        totalPartTwo += calc();
        values = [];
        op = '';
    }
}

// calculate the last problem
if (values.length > 0 && op) totalPartTwo += calc();

console.log(totalPartTwo);