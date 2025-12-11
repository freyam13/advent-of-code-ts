import fs from 'fs';

const input = fs.readFileSync('input.txt', 'utf8').trim().split('\n').map(line => line.split(' '));

// console.log(input);


const exampleInput = `
aaa: you hhh
you: bbb ccc
bbb: ddd eee
ccc: ddd eee fff
ddd: ggg
eee: out
fff: out
ggg: out
hhh: ccc fff iii
iii: out
`;

const exampleInputArray = exampleInput.trim().split('\n').map(line => line.split(' '));

// graph maps each node to its list of neighbors (outgoing edges)
const graph = new Map<string, string[]>();

for (const line of input) {
    const [fromWithColon, ...tos] = line;
    const from = fromWithColon.replace(':', '');
    
    if (!graph.has(from)) {
        graph.set(from, []);
    }

    for (const to of tos) {
        graph.get(from)!.push(to);
    }
}

// console.log(graph);

let outPath_count = 0;

function dfs(node: string, path: string[]) {
    if (node === 'out') {
        outPath_count++;
        return;
    }
    
    // node might not be in graph (like 'out')
    if (!graph.has(node)) {
        return;
    }
    
    for (const neighbor of graph.get(node)!) {
        dfs(neighbor, path.concat(node));
    }
}

dfs('you', []);

// part one
console.log(outPath_count);

// part two - use dynamic programming to count paths efficiently
// for each node, track counts for 4 states:
// [0] = paths with neither dac nor fft
// [1] = paths with dac only
// [2] = paths with fft only  
// [3] = paths with both dac and fft

// first, get topological order using DFS
const visited = new Set<string>();
const topoOrder: string[] = [];

function topoSort(node: string) {
    if (visited.has(node)) return;
    visited.add(node);
    
    if (graph.has(node)) {
        for (const neighbor of graph.get(node)!) {
            topoSort(neighbor);
        }
    }
    topoOrder.push(node);
}

topoSort('svr');
topoOrder.reverse(); // now in topological order from svr

// dynamic programming: count[node] = [neither, dacOnly, fftOnly, both]
const count = new Map<string, number[]>();

for (const node of topoOrder) {
    // initialize counts for this node
    let neither = 0;
    let dacOnly = 0;
    let fftOnly = 0;
    let both = 0;
    
    if (node === 'svr') {
        // starting point: 1 path with neither
        neither = 1;
    }
    
    // add counts from all predecessors (we need reverse edges)
    // actually, let's do it forward: propagate TO neighbors
    count.set(node, [neither, dacOnly, fftOnly, both]);
}

// re-do: propagate forward through topo order
count.clear();
count.set('svr', [1, 0, 0, 0]); // start with 1 path, no special nodes visited

for (const node of topoOrder) {
    if (!count.has(node)) continue;
    
    const [neither, dacOnly, fftOnly, both] = count.get(node)!;
    
    if (!graph.has(node)) continue;
    
    for (const neighbor of graph.get(node)!) {
        if (!count.has(neighbor)) {
            count.set(neighbor, [0, 0, 0, 0]);
        }
        
        const curr = count.get(neighbor)!;
        
        // when we arrive at neighbor, update based on whether neighbor is dac/fft
        if (neighbor === 'dac') {
            // paths without dac become paths with dac
            curr[1] += neither;   // neither -> dacOnly
            curr[3] += fftOnly;   // fftOnly -> both
            curr[1] += dacOnly;   // dacOnly stays dacOnly
            curr[3] += both;      // both stays both
        } else if (neighbor === 'fft') {
            // paths without fft become paths with fft
            curr[2] += neither;   // neither -> fftOnly
            curr[3] += dacOnly;   // dacOnly -> both
            curr[2] += fftOnly;   // fftOnly stays fftOnly
            curr[3] += both;      // both stays both
        } else {
            // regular node, just pass through
            curr[0] += neither;
            curr[1] += dacOnly;
            curr[2] += fftOnly;
            curr[3] += both;
        }
    }
}

// answer is paths reaching 'out' with both dac and fft
const outCounts = count.get('out') || [0, 0, 0, 0];
console.log(outCounts[3]);
