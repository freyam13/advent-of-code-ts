import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8').trim().split('\n').map(line => line.split(' '));

const exampleText = `
[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}
[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}
[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}
`;

// [....]
// [#.#.]
// [.##.]

const exampleInput = exampleText.trim().split('\n').map(line => line.split(' '));

const indicatorDiagrams = input.map(item => item[0]);
const buttonSchematics = input.map(row => row.filter(item => item.includes('(')));
const joltageRequirements = input.map(row => row.filter(item => item.includes('{')));

console.log(indicatorDiagrams);
console.log(buttonSchematics);
console.log(joltageRequirements);


// parse button schematics into arrays of light indices
const parsedButtons = buttonSchematics.map(row => 
    row.map(btn => btn.slice(1, -1).split(',').map(Number))
);

// find minimum presses for a single machine
function findMinPresses(goalLights: number[], buttons: number[][]): number {
    const numLights = goalLights.length;
    const numButtons = buttons.length;
    
    // key insight: pressing a button twice cancels out
    // so each button is either pressed 0 or 1 times
    // we try all 2^numButtons combinations
    
    let minPresses = Infinity;
    
    // calculate total number of combinations: 2^numButtons
    let totalCombinations = 1;
    for (let i = 0; i < numButtons; i++) {
        totalCombinations = totalCombinations * 2;
    }
    
    // iterate through all possible button combinations
    // combination 0 = press no buttons
    // combination 1 = press button 0 only
    // combination 2 = press button 1 only
    // combination 3 = press buttons 0 and 1
    // etc.
    for (let combination = 0; combination < totalCombinations; combination++) {
        // start with all lights off
        const lights = Array(numLights).fill(0);
        let presses = 0;
        
        // build a checklist of which buttons to press for this combination
        // we do this by repeatedly dividing by 2 and checking the remainder
        const buttonChecklist: boolean[] = [];
        let temp = combination;
        for (let b = 0; b < numButtons; b++) {
            // if remainder is 1, this button is "checked" (pressed)
            const isPressed = (temp % 2) === 1;
            buttonChecklist.push(isPressed);
            // divide by 2 (drop the last digit) to check the next button
            temp = Math.floor(temp / 2);
        }
        
        // now apply each button based on the checklist
        for (let b = 0; b < numButtons; b++) {
            if (buttonChecklist[b]) {
                // this button is pressed
                presses = presses + 1;
                // toggle the lights this button affects
                for (let k = 0; k < buttons[b].length; k++) {
                    const lightIndex = buttons[b][k];
                    if (lights[lightIndex] === 0) {
                        lights[lightIndex] = 1;
                    } else {
                        lights[lightIndex] = 0;
                    }
                }
            }
        }
        
        // check if we match the goal
        let matches = true;
        for (let i = 0; i < numLights; i++) {
            if (lights[i] !== goalLights[i]) {
                matches = false;
                break;
            }
        }
        
        if (matches) {
            if (presses < minPresses) {
                minPresses = presses;
            }
        }
    }
    
    return minPresses;
}

let totalPresses = 0;

for (let m = 0; m < indicatorDiagrams.length; m++) {
    const strippedDiagram = indicatorDiagrams[m].slice(1, -1);
    const goalLights = Array.from(strippedDiagram).map(c => c === '#' ? 1 : 0);
    const buttons = parsedButtons[m];
    
    const minForMachine = findMinPresses(goalLights, buttons);
    console.log(`Machine ${m + 1}: ${minForMachine} presses`);
    totalPresses += minForMachine;
}

// part one
console.log(`Total: ${totalPresses}`);

// part two
// key difference: buttons ADD to counters (not toggle), and can be pressed multiple times
// approach: recursive search with pruning - try each button 0 to maxPossible times

// parse joltage requirements into arrays of numbers
const parsedJoltage = joltageRequirements.map(row => {
    const str = row[0];
    const inner = str.slice(1, -1);
    const nums = inner.split(',').map(Number);
    return nums;
});

// find minimum presses for a single machine (part 2)
// approach: ILP solver using Simplex + Branch and Bound
// ported from the reference JavaScript implementation

const EPSILON = 1e-9;

interface Constraint {
    relation: string;
    rhs: number;
    coeffs: number[];
}

interface Model {
    numVars: number;
    objective: { sense: string; coeffs: number[] };
    constraints: Constraint[];
}

function normalizeModel(model: Model): Model {
    return {
        numVars: model.numVars,
        objective: {
            sense: model.objective.sense || 'min',
            coeffs: [...model.objective.coeffs]
        },
        constraints: model.constraints.map(c => ({
            relation: c.relation,
            rhs: c.rhs,
            coeffs: [...c.coeffs]
        }))
    };
}

function cloneModelWithConstraint(model: Model, varIndex: number, relation: string, rhs: number): Model {
    const cloned = normalizeModel(model);
    const coeffs = Array(cloned.numVars).fill(0);
    coeffs[varIndex] = 1;
    cloned.constraints.push({ relation, rhs, coeffs });
    return cloned;
}

function pivot(tableau: number[][], basis: number[], pivotRow: number, pivotCol: number): void {
    const width = tableau[0].length;
    const pivotValue = tableau[pivotRow][pivotCol];
    for (let col = 0; col < width; col++) {
        tableau[pivotRow][col] /= pivotValue;
    }
    for (let row = 0; row < tableau.length; row++) {
        if (row === pivotRow) continue;
        const factor = tableau[row][pivotCol];
        if (Math.abs(factor) < EPSILON) continue;
        for (let col = 0; col < width; col++) {
            tableau[row][col] -= factor * tableau[pivotRow][col];
        }
    }
    basis[pivotRow] = pivotCol;
}

function simplex(tableau: number[][], basis: number[], columnCount: number): { status: string } {
    const rows = tableau.length;
    const rhsColumn = tableau[0].length - 1;
    while (true) {
        let entering = -1;
        let mostNegative = -EPSILON;
        for (let col = 0; col < columnCount; col++) {
            const value = tableau[rows - 1][col];
            if (value < mostNegative) {
                mostNegative = value;
                entering = col;
            }
        }
        if (entering === -1) return { status: 'optimal' };
        
        let leaving = -1;
        let bestRatio = Infinity;
        for (let row = 0; row < rows - 1; row++) {
            const coefficient = tableau[row][entering];
            if (coefficient > EPSILON) {
                const ratio = tableau[row][rhsColumn] / coefficient;
                if (ratio < bestRatio - EPSILON) {
                    bestRatio = ratio;
                    leaving = row;
                }
            }
        }
        if (leaving === -1) return { status: 'unbounded' };
        pivot(tableau, basis, leaving, entering);
    }
}

function setObjectiveRow(tableau: number[][], basis: number[], coeffs: number[], columnCount: number): void {
    const rows = tableau.length;
    const rhsColumn = tableau[0].length - 1;
    const lastRow = rows - 1;
    for (let col = 0; col < columnCount; col++) {
        tableau[lastRow][col] = -(coeffs[col] || 0);
    }
    tableau[lastRow][rhsColumn] = 0;
    for (let row = 0; row < rows - 1; row++) {
        const basicVar = basis[row];
        if (basicVar == null || basicVar < 0) continue;
        const coefficient = coeffs[basicVar] || 0;
        if (Math.abs(coefficient) < EPSILON) continue;
        for (let col = 0; col <= rhsColumn; col++) {
            tableau[lastRow][col] += coefficient * tableau[row][col];
        }
    }
}

function solveLinearProgram(model: Model): { feasible: boolean; solution?: number[]; objective?: number } {
    const normalized = normalizeModel(model);
    const numOriginalVars = normalized.numVars;
    const constraints = normalized.constraints;
    const numConstraints = constraints.length;
    
    let slackCount = 0;
    let artificialCount = 0;
    constraints.forEach(c => {
        if (c.relation === '<=') slackCount++;
        else if (c.relation === '>=') { slackCount++; artificialCount++; }
        else if (c.relation === '=') artificialCount++;
    });
    
    let totalVars = numOriginalVars + slackCount + artificialCount;
    const rhsColumn = totalVars;
    const tableau: number[][] = Array.from({ length: numConstraints + 1 }, () => Array(totalVars + 1).fill(0));
    const basis: number[] = new Array(numConstraints).fill(-1);
    
    let slackOffset = numOriginalVars;
    let artificialOffset = numOriginalVars + slackCount;
    const artificialStart = artificialOffset;
    
    constraints.forEach((constraint, rowIndex) => {
        const row = tableau[rowIndex];
        constraint.coeffs.forEach((value, colIndex) => { row[colIndex] = value; });
        if (constraint.relation === '<=') {
            const idx = slackOffset++;
            row[idx] = 1;
            basis[rowIndex] = idx;
        } else if (constraint.relation === '>=') {
            const slackIdx = slackOffset++;
            const artIdx = artificialOffset++;
            row[slackIdx] = -1;
            row[artIdx] = 1;
            basis[rowIndex] = artIdx;
        } else if (constraint.relation === '=') {
            const artIdx = artificialOffset++;
            row[artIdx] = 1;
            basis[rowIndex] = artIdx;
        }
        row[rhsColumn] = constraint.rhs;
    });
    
    const rows = tableau.length;
    
    if (artificialCount > 0) {
        const phaseOneCoeffs = Array(totalVars).fill(0);
        for (let col = artificialStart; col < totalVars; col++) phaseOneCoeffs[col] = -1;
        setObjectiveRow(tableau, basis, phaseOneCoeffs, totalVars);
        const phaseOneResult = simplex(tableau, basis, totalVars);
        if (phaseOneResult.status !== 'optimal') return { feasible: false };
        if (Math.abs(tableau[rows - 1][rhsColumn]) > EPSILON) return { feasible: false };
        
        // eliminate artificial variables from basis
        for (let row = 0; row < basis.length; row++) {
            if (basis[row] >= artificialStart) {
                for (let col = 0; col < artificialStart; col++) {
                    if (Math.abs(tableau[row][col]) > EPSILON) {
                        pivot(tableau, basis, row, col);
                        break;
                    }
                }
            }
        }
        
        // remove artificial columns
        const newTableau = tableau.map(row => {
            const newRow: number[] = [];
            for (let col = 0; col < artificialStart; col++) newRow.push(row[col]);
            newRow.push(row[rhsColumn]);
            return newRow;
        });
        tableau.length = 0;
        newTableau.forEach(r => tableau.push(r));
        totalVars = artificialStart;
    }
    
    // phase 2
    const maximizingCoeffs = Array(totalVars).fill(0);
    for (let col = 0; col < numOriginalVars; col++) {
        maximizingCoeffs[col] = -(normalized.objective.coeffs[col] || 0);
    }
    setObjectiveRow(tableau, basis, maximizingCoeffs, totalVars);
    const phaseTwoResult = simplex(tableau, basis, totalVars);
    if (phaseTwoResult.status !== 'optimal') return { feasible: false };
    
    const solution = Array(numOriginalVars).fill(0);
    const newRhsColumn = tableau[0].length - 1;
    for (let row = 0; row < basis.length; row++) {
        const varIndex = basis[row];
        if (varIndex != null && varIndex >= 0 && varIndex < numOriginalVars) {
            solution[varIndex] = tableau[row][newRhsColumn];
        }
    }
    
    return { feasible: true, solution, objective: -tableau[rows - 1][newRhsColumn] };
}

function solveIntegerProgram(model: Model): { feasible: boolean; solution?: number[]; objective?: number } {
    const normalized = normalizeModel(model);
    let bestSolution: { feasible: boolean; solution?: number[]; objective?: number } | null = null;
    
    function branch(currentModel: Model): void {
        const lpResult = solveLinearProgram(currentModel);
        if (!lpResult.feasible) return;
        if (bestSolution && lpResult.objective! >= bestSolution.objective! - EPSILON) return;
        
        // find fractional variable
        let fractionalIndex = -1;
        let maxFraction = 0;
        for (let i = 0; i < lpResult.solution!.length; i++) {
            const value = lpResult.solution![i];
            const fractional = Math.abs(value - Math.round(value));
            if (fractional > EPSILON && fractional > maxFraction) {
                maxFraction = fractional;
                fractionalIndex = i;
            }
        }
        
        if (fractionalIndex === -1) {
            if (!bestSolution || lpResult.objective! < bestSolution.objective! - EPSILON) {
                bestSolution = lpResult;
            }
            return;
        }
        
        const value = lpResult.solution![fractionalIndex];
        const floorValue = Math.floor(value);
        const ceilValue = Math.ceil(value);
        
        if (floorValue >= 0) {
            branch(cloneModelWithConstraint(currentModel, fractionalIndex, '<=', floorValue));
        }
        branch(cloneModelWithConstraint(currentModel, fractionalIndex, '>=', ceilValue));
    }
    
    branch(normalized);
    return bestSolution || { feasible: false };
}

function findMinPressesPartTwo(goalCounters: number[], buttons: number[][]): number {
    const numCounters = goalCounters.length;
    const numButtons = buttons.length;
    
    // build ILP model: minimize sum(x) subject to Ax = b, x >= 0
    const model: Model = {
        numVars: numButtons,
        objective: {
            sense: 'min',
            coeffs: Array(numButtons).fill(1) // minimize sum of all button presses
        },
        constraints: []
    };
    
    // for each counter, sum of button presses affecting it = goal
    for (let c = 0; c < numCounters; c++) {
        const coeffs = Array(numButtons).fill(0);
        for (let b = 0; b < numButtons; b++) {
            if (buttons[b].includes(c)) {
                coeffs[b] = 1;
            }
        }
        model.constraints.push({
            relation: '=',
            rhs: goalCounters[c],
            coeffs
        });
    }
    
    // x >= 0 constraints are implicit in Simplex
    const result = solveIntegerProgram(model);
    if (!result.feasible) return Infinity;
    
    // round solution and sum
    let total = 0;
    for (let b = 0; b < numButtons; b++) {
        total += Math.round(result.solution![b]);
    }
    return total;
}

// example input
const exampleButtonSchematics2 = exampleInput.map(row => row.filter(item => item.includes('(')));
const exampleJoltageRequirements2 = exampleInput.map(row => row.filter(item => item.includes('{')));

const exampleParsedButtons2 = exampleButtonSchematics2.map(row => 
    row.map(btn => btn.slice(1, -1).split(',').map(Number))
);

const exampleParsedJoltage2 = exampleJoltageRequirements2.map(row => {
    const str = row[0];
    const inner = str.slice(1, -1);
    const nums = inner.split(',').map(Number);
    return nums;
});

console.log('\n--- Part Two (Example) ---');
let exampleTotalPartTwo = 0;
for (let m = 0; m < exampleParsedJoltage2.length; m++) {
    const goalCounters = exampleParsedJoltage2[m];
    const buttons = exampleParsedButtons2[m];
    
    const minForMachine = findMinPressesPartTwo(goalCounters, buttons);
    console.log(`Machine ${m + 1}: ${minForMachine} presses`);
    exampleTotalPartTwo = exampleTotalPartTwo + minForMachine;
}
console.log(`Example Total: ${exampleTotalPartTwo}`);

// real input
console.log('\n--- Part Two (Real Input) ---');
let totalPartTwo = 0;
for (let m = 0; m < parsedJoltage.length; m++) {
    const goalCounters = parsedJoltage[m];
    const buttons = parsedButtons[m];
    
    const minForMachine = findMinPressesPartTwo(goalCounters, buttons);
    console.log(`Machine ${m + 1}: ${minForMachine} presses`);
    totalPartTwo = totalPartTwo + minForMachine;
}
console.log(`Part Two Total: ${totalPartTwo}`);
