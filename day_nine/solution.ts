import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8');

const coordinates: [number, number][] = input
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',').map(Number) as [number, number]);

let maxArea = 0;

for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[j];
        
        const width = Math.abs(x2 - x1) + 1;
        const height = Math.abs(y2 - y1) + 1;
        const area = width * height;
        
        maxArea = Math.max(maxArea, area);
    }
}

// part one
console.log(maxArea);

// part two; attempt one

// const boundaryTiles = new Set<string>();

// for (const [x, y] of coordinates) {
//     boundaryTiles.add(`${x},${y}`);
// }

// // console.log(boundaryTiles);

// for (let i = 0; i < coordinates.length; i++) {
//     const [x1, y1] = coordinates[i];
//     const [x2, y2] = coordinates[(i + 1) % coordinates.length]; // wrap around
    
//     // console.log(x1, y1, x2, y2);

//     if (x1 === x2) {
//         // vertical line
//         const startY = Math.min(y1, y2);
//         const endY = Math.max(y1, y2);
//         for (let y = startY; y <= endY; y++) {
//             boundaryTiles.add(`${x1},${y}`);
//         }
//     } else {
//         // horizontal line
//         const startX = Math.min(x1, x2);
//         const endX = Math.max(x1, x2);
//         for (let x = startX; x <= endX; x++) {
//             boundaryTiles.add(`${x},${y1}`);
//         }
//     }
// }

// // console.log(boundaryTiles);

// const verticalSegments: { x: number, yMin: number, yMax: number }[] = [];

// // build list of vertical segments
// for (let i = 0; i < coordinates.length; i++) {
//     const [x1, y1] = coordinates[i];
//     const [x2, y2] = coordinates[(i + 1) % coordinates.length];
    
//     if (x1 === x2) {
//         verticalSegments.push({ x: x1, yMin: Math.min(y1, y2), yMax: Math.max(y1, y2) });
//     }
// }

// verticalSegments.sort((a, b) => a.x - b.x);

// // console.log(verticalSegments);

// // TIL: ray casting algorithm to check if a point is inside a polygon
// function isInside(px: number, py: number): boolean {
//     if (boundaryTiles.has(`${px},${py}`)) return true;
    
//     // count vertical segments to the left that cross this y
//     let crossings = 0;
//     for (const seg of verticalSegments) {
//         if (seg.x >= px) break; // only look left
//         if (py > seg.yMin && py < seg.yMax) {
//             crossings++;
//         }
//     }
//     return crossings % 2 === 1;
// }

// let maxAreaPartTwo = 0;

// // for each pair of red tiles ...
// for (let i = 0; i < coordinates.length; i++) {
//     for (let j = i + 1; j < coordinates.length; j++) {
//         const [x1, y1] = coordinates[i];
//         const [x2, y2] = coordinates[j];
        
//         const startX = Math.min(x1, x2);
//         const endX = Math.max(x1, x2);
//         const startY = Math.min(y1, y2);
//         const endY = Math.max(y1, y2);
        
//         // check if all tiles in rectangle are inside
//         let valid = true;
//         for (let y = startY; y <= endY && valid; y++) {
//             for (let x = startX; x <= endX && valid; x++) {
//                 if (!isInside(x, y)) {
//                     valid = false;
//                 }
//             }
//         }
        
//         // if all tiles in rectangle are inside, calculate area
//         if (valid) {
//             const width = endX - startX + 1;
//             const height = endY - startY + 1;
//             const area = width * height;
//             maxAreaPartTwo = Math.max(maxAreaPartTwo, area);
//         }
//     }
// }

// console.log(maxAreaPartTwo);

// part two; attempt two
// TIL: instead of checking every tile in a rectangle,
// I should check if the rectangle's corners are all inside AND
// no boundary segments cross through the interior of the rectangle.

// build vertical and horizontal segments from the polygon boundary
const vertSegments: { x: number, yMin: number, yMax: number }[] = [];
const horizSegments: { y: number, xMin: number, xMax: number }[] = [];

for (let i = 0; i < coordinates.length; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[(i + 1) % coordinates.length];
    
    if (x1 === x2) {
        vertSegments.push({ x: x1, yMin: Math.min(y1, y2), yMax: Math.max(y1, y2) });
    } else {
        horizSegments.push({ y: y1, xMin: Math.min(x1, x2), xMax: Math.max(x1, x2) });
    }
}

// sort for efficient lookup
vertSegments.sort((a, b) => a.x - b.x);

// check if a point is inside using ray casting
// for proper handling, we count a crossing if the ray passes through the segment
// we use yMin < py <= yMax to avoid double-counting at corners
function isInsidePolygon(px: number, py: number): boolean {
    let crossings = 0;
    for (const seg of vertSegments) {
        if (seg.x >= px) break;
        // count crossing if py is strictly above yMin and at or below yMax
        if (py > seg.yMin && py <= seg.yMax) {
            crossings++;
        }
    }
    return crossings % 2 === 1;
}

// check if a rectangle is fully inside the polygon
// a rectangle is valid if:
// 1. all 4 corners are inside (or on boundary)
// 2. no boundary segment crosses through the rectangle's interior
function isRectangleValid(x1: number, y1: number, x2: number, y2: number): boolean {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    // check all 4 corners are inside
    const corners = [[minX, minY], [minX, maxY], [maxX, minY], [maxX, maxY]];
    for (const [cx, cy] of corners) {
        if (!isInsidePolygon(cx, cy)) {
            // check if it's on the boundary (a red tile)
            const isRedTile = coordinates.some(([rx, ry]) => rx === cx && ry === cy);
            if (!isRedTile) {
                // check if on a boundary segment
                let onBoundary = false;
                for (const seg of vertSegments) {
                    if (seg.x === cx && cy >= seg.yMin && cy <= seg.yMax) {
                        onBoundary = true;
                        break;
                    }
                }
                if (!onBoundary) {
                    for (const seg of horizSegments) {
                        if (seg.y === cy && cx >= seg.xMin && cx <= seg.xMax) {
                            onBoundary = true;
                            break;
                        }
                    }
                }
                if (!onBoundary) return false;
            }
        }
    }
    
    // check no vertical boundary segment crosses through the interior
    for (const seg of vertSegments) {
        // segment is strictly inside the rectangle horizontally
        if (seg.x > minX && seg.x < maxX) {
            // check if segment crosses through the rectangle vertically
            if (seg.yMin < maxY && seg.yMax > minY) {
                return false; // boundary cuts through rectangle
            }
        }
    }
    
    // check no horizontal boundary segment crosses through the interior
    for (const seg of horizSegments) {
        // segment is strictly inside the rectangle vertically
        if (seg.y > minY && seg.y < maxY) {
            // check if segment crosses through the rectangle horizontally
            if (seg.xMin < maxX && seg.xMax > minX) {
                return false; // boundary cuts through rectangle
            }
        }
    }
    
    return true;
}

let maxAreaPartTwo = 0;

for (let i = 0; i < coordinates.length; i++) {
    for (let j = i + 1; j < coordinates.length; j++) {
        const [x1, y1] = coordinates[i];
        const [x2, y2] = coordinates[j];
        
        if (isRectangleValid(x1, y1, x2, y2)) {
            const width = Math.abs(x2 - x1) + 1;
            const height = Math.abs(y2 - y1) + 1;
            const area = width * height;
            maxAreaPartTwo = Math.max(maxAreaPartTwo, area);
        }
    }
}

console.log(maxAreaPartTwo);
