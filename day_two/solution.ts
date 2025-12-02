import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const idRanges = input.trim().split(',').map(range => range.split('-'));

console.log(idRanges);

// declared for part two
let repeatedAtLeastTwice: number[] = [];

const invalidIdRanges = filterInvalidIdRanges(idRanges);

console.log(invalidIdRanges);

const totalSum = invalidIdRanges.reduce((sum, id) => sum + id, 0);

// part one
console.log(totalSum);

function filterInvalidIdRanges(idRanges: string[][]): number[] {
    const invalidIds: number[] = [];

    for (const range of idRanges) {
        const start = Number(range[0]);
        const end = Number(range[1]);

        for (let id = start; id <= end; id++) {
            const idStr = id.toString();

            if (isRepeatedSequence(idStr)) {
                invalidIds.push(id);
            }

            if (isRepeatedAtLeastTwiceSequence(idStr)) {
                repeatedAtLeastTwice.push(id);
            }
        }
    }

    return invalidIds;
}

function isRepeatedSequence(numStr: string, sequenceLength: number = 1): boolean {
    if (sequenceLength > numStr.length / 2) {
        return false;
    }

    if (numStr.length === sequenceLength * 2) {
        const firstHalf = numStr.slice(0, sequenceLength);
        const secondHalf = numStr.slice(sequenceLength);
        if (firstHalf === secondHalf) {
            return true;
        }
    }

    return isRepeatedSequence(numStr, sequenceLength + 1);
}

function isRepeatedAtLeastTwiceSequence(numStr: string, sequenceLength: number = 1): boolean {
    if (sequenceLength > numStr.length / 2) {
        return false;
    }

    if (numStr.length % sequenceLength === 0) {
        const sequence = numStr.slice(0, sequenceLength);
        if (isEntirelyMadeOf(numStr, sequence)) {
            return true;
        }
    }

    return isRepeatedAtLeastTwiceSequence(numStr, sequenceLength + 1);
}

function isEntirelyMadeOf(numStr: string, sequence: string, index: number = 0): boolean {
    if (index >= numStr.length) {
        return true;
    }

    const chunk = numStr.slice(index, index + sequence.length);
    if (chunk !== sequence) {
        return false;
    }

    return isEntirelyMadeOf(numStr, sequence, index + sequence.length);
}

// part two
const totalSumPartTwo = repeatedAtLeastTwice.reduce((sum, id) => sum + id, 0);

console.log(totalSumPartTwo);