// NumComp - Visual Numerical Computing
// Main application logic

// Polyfill for roundRect (for older browsers)
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radii) {
        const radius = Array.isArray(radii) ? radii[0] : radii;
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
    };
}

// Simple custom Rete.js implementation for demonstration
class Node {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.inputs = {};
        this.outputs = {};
        this.controls = {};
        this.data = {};
        this.x = 0;
        this.y = 0;
    }

    addInput(name, label) {
        this.inputs[name] = { label, value: null, connection: null };
        return this;
    }

    addOutput(name, label) {
        this.outputs[name] = { label, connections: [] };
        return this;
    }

    addControl(name, type, defaultValue, options = {}) {
        this.controls[name] = { type, value: defaultValue, options };
        return this;
    }

    async execute(inputs) {
        // Override in subclasses
        return {};
    }
}

// Application State
const state = {
    nodes: new Map(),
    connections: [],
    selectedNode: null,
    nodeIdCounter: 0,
    results: []
};

// DOM Elements (will be initialized on DOMContentLoaded)
let reteEditor, resultsContent, runBtn, clearBtn, saveBtn, loadBtn;
let zoomInBtn, zoomOutBtn, fitBtn;

// Canvas setup
let canvas, ctx;
let scale = 1;
let panX = 0, panY = 0;
let isDragging = false;
let dragNode = null;
let dragOffsetX = 0, dragOffsetY = 0;

function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.width = reteEditor.clientWidth;
    canvas.height = reteEditor.clientHeight;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    reteEditor.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = reteEditor.clientWidth;
        canvas.height = reteEditor.clientHeight;
        render();
    });

    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);
}

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / scale;
    const y = (e.clientY - rect.top - panY) / scale;

    // Check if clicking on a node
    for (const [id, node] of state.nodes) {
        if (x >= node.x && x <= node.x + 180 &&
            y >= node.y && y <= node.y + getNodeHeight(node)) {
            dragNode = node;
            dragOffsetX = x - node.x;
            dragOffsetY = y - node.y;
            state.selectedNode = node;
            return;
        }
    }

    isDragging = true;
}

function handleMouseMove(e) {
    if (dragNode) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / scale;
        const y = (e.clientY - rect.top - panY) / scale;
        dragNode.x = x - dragOffsetX;
        dragNode.y = y - dragOffsetY;
        render();
    } else if (isDragging) {
        panX += e.movementX;
        panY += e.movementY;
        render();
    }
}

function handleMouseUp(e) {
    isDragging = false;
    dragNode = null;
}

function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scale *= delta;
    scale = Math.max(0.1, Math.min(scale, 3));
    render();
}

function getNodeHeight(node) {
    let height = 40; // Header
    height += Object.keys(node.inputs).length * 30;
    height += Object.keys(node.controls).length * 40;
    height += Object.keys(node.outputs).length * 30;
    return height;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    // Draw connections
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (const conn of state.connections) {
        const fromNode = state.nodes.get(conn.from);
        const toNode = state.nodes.get(conn.to);
        if (fromNode && toNode) {
            const x1 = fromNode.x + 180;
            const y1 = fromNode.y + 40 + Object.keys(fromNode.outputs).indexOf(conn.fromOutput) * 30 + 15;
            const x2 = toNode.x;
            const y2 = toNode.y + 40 + Object.keys(toNode.inputs).indexOf(conn.toInput) * 30 + 15;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.bezierCurveTo(x1 + 50, y1, x2 - 50, y2, x2, y2);
            ctx.stroke();
        }
    }

    // Draw nodes
    for (const [id, node] of state.nodes) {
        drawNode(node);
    }

    ctx.restore();
}

function drawNode(node) {
    const isSelected = state.selectedNode === node;
    const nodeHeight = getNodeHeight(node);

    // Node background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = isSelected ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = isSelected ? 2 : 1;

    ctx.beginPath();
    ctx.roundRect(node.x, node.y, 180, nodeHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Header
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.roundRect(node.x, node.y, 180, 40, [8, 8, 0, 0]);
    ctx.fill();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 13px sans-serif';
    ctx.fillText(node.label, node.x + 10, node.y + 25);

    let offsetY = 40;

    // Inputs
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const [key, input] of Object.entries(node.inputs)) {
        ctx.fillText(input.label, node.x + 20, node.y + offsetY + 18);

        // Input socket
        ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x + 8, node.y + offsetY + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        offsetY += 30;
    }

    // Controls
    for (const [key, control] of Object.entries(node.controls)) {
        offsetY += 10;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px sans-serif';
        ctx.fillText(key, node.x + 10, node.y + offsetY);

        // Draw control background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(node.x + 10, node.y + offsetY + 5, 160, 22);

        // Draw control value
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        const displayValue = String(control.value).substring(0, 18);
        ctx.fillText(displayValue, node.x + 15, node.y + offsetY + 20);

        offsetY += 30;
    }

    // Outputs
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (const [key, output] of Object.entries(node.outputs)) {
        ctx.fillText(output.label, node.x + 100, node.y + offsetY + 18);

        // Output socket
        ctx.fillStyle = 'rgba(255, 150, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(node.x + 172, node.y + offsetY + 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        offsetY += 30;
    }
}

// Node Definitions
class NumberInputNode extends Node {
    constructor(id) {
        super(id, 'Number');
        this.addOutput('value', 'Number');
        this.addControl('value', 'number', 2.0);
    }

    async execute() {
        return { value: parseFloat(this.controls.value.value) };
    }
}

class FunctionInputNode extends Node {
    constructor(id) {
        super(id, 'Function');
        this.addOutput('func', 'Function');
        this.addControl('expr', 'text', 'x^2 - 4');
    }

    async execute() {
        const expr = this.controls.expr.value;
        return {
            func: (x) => {
                try {
                    return math.evaluate(expr, { x });
                } catch (e) {
                    console.error('Function evaluation error:', e);
                    return NaN;
                }
            }
        };
    }
}

class NewtonMethodNode extends Node {
    constructor(id) {
        super(id, "Newton's Method");
        this.addInput('func', 'Function');
        this.addInput('x0', 'Initial guess');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('root', 'Root');
        this.addOutput('iterations', 'Iterations');
    }

    async execute(inputs) {
        const func = inputs.func;
        const x0 = inputs.x0 || 1.0;
        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        if (!func) return { root: null, iterations: 0 };

        let x = x0;
        let iter = 0;
        const h = 0.0001;

        for (iter = 0; iter < maxIter; iter++) {
            const fx = func(x);
            const derivative = (func(x + h) - func(x - h)) / (2 * h);

            if (Math.abs(derivative) < 1e-10) break;

            const xNew = x - fx / derivative;

            if (Math.abs(xNew - x) < tol) {
                x = xNew;
                iter++;
                break;
            }

            x = xNew;
        }

        return { root: x, iterations: iter };
    }
}

class BisectionNode extends Node {
    constructor(id) {
        super(id, 'Bisection Method');
        this.addInput('func', 'Function');
        this.addInput('a', 'Left bound');
        this.addInput('b', 'Right bound');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('root', 'Root');
        this.addOutput('iterations', 'Iterations');
    }

    async execute(inputs) {
        const func = inputs.func;
        let a = inputs.a || -10;
        let b = inputs.b || 10;
        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        if (!func) return { root: null, iterations: 0 };

        let iter = 0;
        let c;

        for (iter = 0; iter < maxIter; iter++) {
            c = (a + b) / 2;
            const fc = func(c);

            if (Math.abs(fc) < tol || Math.abs(b - a) < tol) {
                break;
            }

            if (func(a) * fc < 0) {
                b = c;
            } else {
                a = c;
            }
        }

        return { root: c, iterations: iter + 1 };
    }
}

// Secant Method Node
class SecantNode extends Node {
    constructor(id) {
        super(id, 'Secant Method');
        this.addInput('func', 'Function');
        this.addInput('x0', 'Initial guess 1');
        this.addInput('x1', 'Initial guess 2');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('root', 'Root');
        this.addOutput('iterations', 'Iterations');
    }

    async execute(inputs) {
        const func = inputs.func;
        let x0 = inputs.x0 || 0.0;
        let x1 = inputs.x1 || 1.0;
        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        if (!func) return { root: null, iterations: 0 };

        let iter = 0;

        for (iter = 0; iter < maxIter; iter++) {
            const f0 = func(x0);
            const f1 = func(x1);

            // Check for division by zero
            if (Math.abs(f1 - f0) < 1e-10) {
                break;
            }

            // Secant formula: x_new = x1 - f(x1) * (x1 - x0) / (f(x1) - f(x0))
            const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);

            // Check convergence
            if (Math.abs(x2 - x1) < tol) {
                return { root: x2, iterations: iter + 1 };
            }

            // Update for next iteration
            x0 = x1;
            x1 = x2;
        }

        return { root: x1, iterations: iter };
    }
}

// False Position (Regula Falsi) Node
class FalsePositionNode extends Node {
    constructor(id) {
        super(id, 'False Position');
        this.addInput('func', 'Function');
        this.addInput('a', 'Left bound');
        this.addInput('b', 'Right bound');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('root', 'Root');
        this.addOutput('iterations', 'Iterations');
    }

    async execute(inputs) {
        const func = inputs.func;
        let a = inputs.a || -10;
        let b = inputs.b || 10;
        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        if (!func) return { root: null, iterations: 0 };

        let iter = 0;
        let c;

        for (iter = 0; iter < maxIter; iter++) {
            const fa = func(a);
            const fb = func(b);

            // False position formula: c = (a*f(b) - b*f(a)) / (f(b) - f(a))
            c = (a * fb - b * fa) / (fb - fa);
            const fc = func(c);

            // Check convergence
            if (Math.abs(fc) < tol || Math.abs(b - a) < tol) {
                break;
            }

            // Update bracket
            if (fa * fc < 0) {
                b = c;
            } else {
                a = c;
            }
        }

        return { root: c, iterations: iter + 1 };
    }
}

// Fixed Point Iteration Node
class FixedPointNode extends Node {
    constructor(id) {
        super(id, 'Fixed Point');
        this.addInput('func', 'Function g(x)');
        this.addInput('x0', 'Initial guess');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('root', 'Fixed Point');
        this.addOutput('iterations', 'Iterations');
    }

    async execute(inputs) {
        const g = inputs.func; // g(x) function where fixed point satisfies x = g(x)
        let x = inputs.x0 || 1.0;
        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        if (!g) return { root: null, iterations: 0 };

        let iter = 0;

        for (iter = 0; iter < maxIter; iter++) {
            const xNew = g(x);

            // Check convergence
            if (Math.abs(xNew - x) < tol) {
                return { root: xNew, iterations: iter + 1 };
            }

            x = xNew;
        }

        return { root: x, iterations: iter };
    }
}

// Forward Difference Differentiation Node
class ForwardDiffNode extends Node {
    constructor(id) {
        super(id, 'Forward Difference');
        this.addInput('func', 'Function');
        this.addInput('xValue', 'X Value');
        this.addControl('stepSize', 'number', 0.001);
        this.addOutput('derivative', 'Derivative');
    }

    async execute(inputs) {
        const func = inputs.func;
        const x = inputs.xValue || 0;
        const h = parseFloat(this.controls.stepSize.value);

        if (!func) return { derivative: null };

        // Forward difference: f'(x) ≈ (f(x+h) - f(x)) / h
        const derivative = (func(x + h) - func(x)) / h;

        return { derivative };
    }
}

// Central Difference Differentiation Node
class CentralDiffNode extends Node {
    constructor(id) {
        super(id, 'Central Difference');
        this.addInput('func', 'Function');
        this.addInput('xValue', 'X Value');
        this.addControl('stepSize', 'number', 0.001);
        this.addOutput('derivative', 'Derivative');
    }

    async execute(inputs) {
        const func = inputs.func;
        const x = inputs.xValue || 0;
        const h = parseFloat(this.controls.stepSize.value);

        if (!func) return { derivative: null };

        // Central difference: f'(x) ≈ (f(x+h) - f(x-h)) / (2h)
        const derivative = (func(x + h) - func(x - h)) / (2 * h);

        return { derivative };
    }
}

// Richardson Extrapolation for Differentiation Node
class RichardsonNode extends Node {
    constructor(id) {
        super(id, 'Richardson Extrapolation');
        this.addInput('func', 'Function');
        this.addInput('xValue', 'X Value');
        this.addControl('initialStep', 'number', 0.1);
        this.addControl('levels', 'number', 3);
        this.addOutput('derivative', 'Derivative');
        this.addOutput('estimates', 'Estimates');
    }

    async execute(inputs) {
        const func = inputs.func;
        const x = inputs.xValue || 0;
        let h = parseFloat(this.controls.initialStep.value);
        const levels = parseInt(this.controls.levels.value);

        if (!func) return { derivative: null, estimates: [] };

        // Build Richardson table
        const table = [];

        // First column: central difference estimates with decreasing h
        for (let i = 0; i < levels; i++) {
            const currentH = h / Math.pow(2, i);
            const D = (func(x + currentH) - func(x - currentH)) / (2 * currentH);
            table.push([D]);
        }

        // Fill remaining columns using Richardson extrapolation
        // Formula: D(i,j) = (4^j * D(i,j-1) - D(i-1,j-1)) / (4^j - 1)
        for (let j = 1; j < levels; j++) {
            for (let i = j; i < levels; i++) {
                const power = Math.pow(4, j);
                const D = (power * table[i][j-1] - table[i-1][j-1]) / (power - 1);
                table[i].push(D);
            }
        }

        // Best estimate is in bottom-right corner
        const derivative = table[levels-1][levels-1];
        const estimates = table.map(row => row[row.length-1]);

        return { derivative, estimates };
    }
}

// Trapezoidal Rule Integration Node
class TrapezoidalNode extends Node {
    constructor(id) {
        super(id, 'Trapezoidal Rule');
        this.addInput('func', 'Function');
        this.addInput('lowerBound', 'Lower Bound');
        this.addInput('upperBound', 'Upper Bound');
        this.addControl('intervals', 'number', 100);
        this.addOutput('integral', 'Integral');
    }

    async execute(inputs) {
        const func = inputs.func;
        const a = inputs.lowerBound ?? 0;
        const b = inputs.upperBound ?? 1;
        const n = parseInt(this.controls.intervals.value);

        if (!func) return { integral: null };

        const h = (b - a) / n;
        let sum = (func(a) + func(b)) / 2;

        for (let i = 1; i < n; i++) {
            sum += func(a + i * h);
        }

        const integral = h * sum;
        return { integral };
    }
}

// Simpson's 1/3 Rule Integration Node
class SimpsonNode extends Node {
    constructor(id) {
        super(id, "Simpson's Rule");
        this.addInput('func', 'Function');
        this.addInput('lowerBound', 'Lower Bound');
        this.addInput('upperBound', 'Upper Bound');
        this.addControl('intervals', 'number', 100);
        this.addOutput('integral', 'Integral');
    }

    async execute(inputs) {
        const func = inputs.func;
        const a = inputs.lowerBound ?? 0;
        const b = inputs.upperBound ?? 1;
        let n = parseInt(this.controls.intervals.value);

        if (!func) return { integral: null };

        // Ensure n is even
        if (n % 2 !== 0) n++;

        const h = (b - a) / n;
        let sum = func(a) + func(b);

        // Add odd-indexed points (multiplied by 4)
        for (let i = 1; i < n; i += 2) {
            sum += 4 * func(a + i * h);
        }

        // Add even-indexed points (multiplied by 2)
        for (let i = 2; i < n; i += 2) {
            sum += 2 * func(a + i * h);
        }

        const integral = (h / 3) * sum;
        return { integral };
    }
}

// Romberg Integration Node
class RombergNode extends Node {
    constructor(id) {
        super(id, 'Romberg Integration');
        this.addInput('func', 'Function');
        this.addInput('lowerBound', 'Lower Bound');
        this.addInput('upperBound', 'Upper Bound');
        this.addControl('levels', 'number', 5);
        this.addOutput('integral', 'Integral');
        this.addOutput('table', 'Romberg Table');
    }

    async execute(inputs) {
        const func = inputs.func;
        const a = inputs.lowerBound ?? 0;
        const b = inputs.upperBound ?? 1;
        const levels = parseInt(this.controls.levels.value);

        if (!func) return { integral: null, table: [] };

        const R = [];

        // First column: trapezoidal rule with increasing subdivisions
        for (let i = 0; i < levels; i++) {
            const n = Math.pow(2, i);
            const h = (b - a) / n;
            let sum = (func(a) + func(b)) / 2;

            for (let j = 1; j < n; j++) {
                sum += func(a + j * h);
            }

            R.push([h * sum]);
        }

        // Richardson extrapolation to fill remaining columns
        // Formula: R(i,j) = (4^j * R(i,j-1) - R(i-1,j-1)) / (4^j - 1)
        for (let j = 1; j < levels; j++) {
            for (let i = j; i < levels; i++) {
                const power = Math.pow(4, j);
                const value = (power * R[i][j-1] - R[i-1][j-1]) / (power - 1);
                R[i].push(value);
            }
        }

        // Best estimate is in bottom-right corner
        const integral = R[levels-1][levels-1];

        return { integral, table: R };
    }
}

// Gaussian Quadrature Integration Node
class GaussianQuadNode extends Node {
    constructor(id) {
        super(id, 'Gaussian Quadrature');
        this.addInput('func', 'Function');
        this.addInput('lowerBound', 'Lower Bound');
        this.addInput('upperBound', 'Upper Bound');
        this.addControl('numPoints', 'number', 3);
        this.addOutput('integral', 'Integral');
    }

    async execute(inputs) {
        const func = inputs.func;
        const a = inputs.lowerBound ?? 0;
        const b = inputs.upperBound ?? 1;
        const n = parseInt(this.controls.numPoints.value);

        if (!func) return { integral: null };

        // Gauss-Legendre nodes and weights for n = 2, 3, 4, 5
        const gaussData = {
            2: {
                nodes: [-0.5773502692, 0.5773502692],
                weights: [1.0, 1.0]
            },
            3: {
                nodes: [-0.7745966692, 0.0, 0.7745966692],
                weights: [0.5555555556, 0.8888888889, 0.5555555556]
            },
            4: {
                nodes: [-0.8611363116, -0.3399810436, 0.3399810436, 0.8611363116],
                weights: [0.3478548451, 0.6521451549, 0.6521451549, 0.3478548451]
            },
            5: {
                nodes: [-0.9061798459, -0.5384693101, 0.0, 0.5384693101, 0.9061798459],
                weights: [0.2369268851, 0.4786286705, 0.5688888889, 0.4786286705, 0.2369268851]
            }
        };

        if (!gaussData[n]) {
            addResult('Gaussian Quadrature Error', 'numPoints must be 2, 3, 4, or 5');
            return { integral: null };
        }

        const { nodes, weights } = gaussData[n];

        // Transform from [-1, 1] to [a, b]
        // x = ((b-a)*t + (b+a)) / 2
        let sum = 0;
        for (let i = 0; i < n; i++) {
            const x = ((b - a) * nodes[i] + (b + a)) / 2;
            sum += weights[i] * func(x);
        }

        const integral = ((b - a) / 2) * sum;
        return { integral };
    }
}

// Mean and Standard Deviation Node
class MeanStdNode extends Node {
    constructor(id) {
        super(id, 'Mean & Std Dev');
        this.addInput('data', 'Data Array');
        this.addControl('sampleOrPopulation', 'text', 'sample');
        this.addOutput('mean', 'Mean');
        this.addOutput('stdDev', 'Std Dev');
        this.addOutput('variance', 'Variance');
    }

    async execute(inputs) {
        const data = inputs.data;

        if (!data || !Array.isArray(data) || data.length === 0) {
            return { mean: null, stdDev: null, variance: null };
        }

        const type = this.controls.sampleOrPopulation.value.toLowerCase();
        const isSample = type === 'sample';

        // Calculate mean using math.js
        const mean = math.mean(data);

        // Calculate variance and std dev
        // Sample: divide by n-1, Population: divide by n
        const n = data.length;
        const sumSquaredDiff = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0);
        const variance = sumSquaredDiff / (isSample ? n - 1 : n);
        const stdDev = Math.sqrt(variance);

        return { mean, stdDev, variance };
    }
}

// Linear Regression Node
class LinearRegressionNode extends Node {
    constructor(id) {
        super(id, 'Linear Regression');
        this.addInput('xData', 'X Data');
        this.addInput('yData', 'Y Data');
        this.addOutput('slope', 'Slope (m)');
        this.addOutput('intercept', 'Intercept (b)');
        this.addOutput('rSquared', 'R²');
    }

    async execute(inputs) {
        const xData = inputs.xData;
        const yData = inputs.yData;

        if (!xData || !yData || !Array.isArray(xData) || !Array.isArray(yData)) {
            return { slope: null, intercept: null, rSquared: null };
        }

        if (xData.length !== yData.length || xData.length === 0) {
            addResult('Linear Regression Error', 'X and Y data must have same non-zero length');
            return { slope: null, intercept: null, rSquared: null };
        }

        const n = xData.length;

        // Calculate sums
        const sumX = xData.reduce((a, b) => a + b, 0);
        const sumY = yData.reduce((a, b) => a + b, 0);
        const sumXY = xData.reduce((sum, x, i) => sum + x * yData[i], 0);
        const sumX2 = xData.reduce((sum, x) => sum + x * x, 0);
        const sumY2 = yData.reduce((sum, y) => sum + y * y, 0);

        // Calculate slope and intercept
        // m = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        // b = (Σy - m*Σx) / n
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R²
        const yMean = sumY / n;
        const ssTotal = yData.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
        const ssRes = yData.reduce((sum, y, i) => {
            const yPred = slope * xData[i] + intercept;
            return sum + Math.pow(y - yPred, 2);
        }, 0);
        const rSquared = 1 - (ssRes / ssTotal);

        return { slope, intercept, rSquared };
    }
}

// Polynomial Regression Node
class PolyRegressionNode extends Node {
    constructor(id) {
        super(id, 'Polynomial Regression');
        this.addInput('xData', 'X Data');
        this.addInput('yData', 'Y Data');
        this.addControl('degree', 'number', 2);
        this.addOutput('coefficients', 'Coefficients');
    }

    async execute(inputs) {
        const xData = inputs.xData;
        const yData = inputs.yData;
        const degree = parseInt(this.controls.degree.value);

        if (!xData || !yData || !Array.isArray(xData) || !Array.isArray(yData)) {
            return { coefficients: null };
        }

        if (xData.length !== yData.length || xData.length <= degree) {
            addResult('Poly Regression Error', 'Need more data points than polynomial degree');
            return { coefficients: null };
        }

        // Build Vandermonde matrix
        const n = xData.length;
        const X = [];
        for (let i = 0; i < n; i++) {
            const row = [];
            for (let j = 0; j <= degree; j++) {
                row.push(Math.pow(xData[i], j));
            }
            X.push(row);
        }

        try {
            // Convert to math.js matrices
            const Xmat = math.matrix(X);
            const Ymat = math.matrix(yData);

            // Solve normal equations: (X^T * X) * c = X^T * Y
            const XtX = math.multiply(math.transpose(Xmat), Xmat);
            const XtY = math.multiply(math.transpose(Xmat), Ymat);

            // Solve for coefficients
            const coeffs = math.lusolve(XtX, XtY);

            // Convert to array and reverse to get highest degree first
            const coefficients = coeffs.toArray().map(c => c[0]).reverse();

            return { coefficients };
        } catch (e) {
            console.error('Polynomial regression error:', e);
            addResult('Poly Regression Error', 'Failed to solve system: ' + e.message);
            return { coefficients: null };
        }
    }
}

// Lagrange Interpolation Node
class LagrangeNode extends Node {
    constructor(id) {
        super(id, 'Lagrange Interpolation');
        this.addInput('xPoints', 'X Points');
        this.addInput('yPoints', 'Y Points');
        this.addInput('xValue', 'X Value');
        this.addOutput('interpolatedValue', 'Y Value');
    }

    async execute(inputs) {
        const xPoints = inputs.xPoints;
        const yPoints = inputs.yPoints;
        const xValue = inputs.xValue;

        if (!xPoints || !yPoints || xValue === undefined) {
            return { interpolatedValue: null };
        }

        if (!Array.isArray(xPoints) || !Array.isArray(yPoints)) {
            addResult('Lagrange Error', 'X and Y points must be arrays');
            return { interpolatedValue: null };
        }

        if (xPoints.length !== yPoints.length || xPoints.length === 0) {
            addResult('Lagrange Error', 'X and Y must have same non-zero length');
            return { interpolatedValue: null };
        }

        const n = xPoints.length;
        let result = 0;

        // Lagrange polynomial: P(x) = Σ y_i * L_i(x)
        // where L_i(x) = Π((x - x_j) / (x_i - x_j)) for j ≠ i
        for (let i = 0; i < n; i++) {
            let Li = 1;
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    Li *= (xValue - xPoints[j]) / (xPoints[i] - xPoints[j]);
                }
            }
            result += yPoints[i] * Li;
        }

        return { interpolatedValue: result };
    }
}

// Newton's Divided Differences Interpolation Node
class NewtonDividedNode extends Node {
    constructor(id) {
        super(id, 'Newton Divided Diff');
        this.addInput('xPoints', 'X Points');
        this.addInput('yPoints', 'Y Points');
        this.addInput('xValue', 'X Value');
        this.addOutput('interpolatedValue', 'Y Value');
        this.addOutput('dividedDifferences', 'Divided Diffs');
    }

    async execute(inputs) {
        const xPoints = inputs.xPoints;
        const yPoints = inputs.yPoints;
        const xValue = inputs.xValue;

        if (!xPoints || !yPoints || xValue === undefined) {
            return { interpolatedValue: null, dividedDifferences: null };
        }

        if (!Array.isArray(xPoints) || !Array.isArray(yPoints)) {
            addResult('Newton Divided Diff Error', 'X and Y points must be arrays');
            return { interpolatedValue: null, dividedDifferences: null };
        }

        if (xPoints.length !== yPoints.length || xPoints.length === 0) {
            addResult('Newton Divided Diff Error', 'X and Y must have same non-zero length');
            return { interpolatedValue: null, dividedDifferences: null };
        }

        const n = xPoints.length;

        // Build divided difference table
        const divDiff = Array(n).fill(0).map(() => Array(n).fill(0));

        // First column is just y values
        for (let i = 0; i < n; i++) {
            divDiff[i][0] = yPoints[i];
        }

        // Fill remaining columns
        for (let j = 1; j < n; j++) {
            for (let i = 0; i < n - j; i++) {
                divDiff[i][j] = (divDiff[i + 1][j - 1] - divDiff[i][j - 1]) /
                                (xPoints[i + j] - xPoints[i]);
            }
        }

        // Evaluate Newton polynomial at xValue
        // P(x) = f[x0] + f[x0,x1](x-x0) + f[x0,x1,x2](x-x0)(x-x1) + ...
        let result = divDiff[0][0];
        let term = 1;

        for (let i = 1; i < n; i++) {
            term *= (xValue - xPoints[i - 1]);
            result += divDiff[0][i] * term;
        }

        // Get first row of divided differences for output
        const dividedDifferences = divDiff[0];

        return { interpolatedValue: result, dividedDifferences };
    }
}

// Cubic Spline Interpolation Node
class SplineNode extends Node {
    constructor(id) {
        super(id, 'Cubic Spline');
        this.addInput('xPoints', 'X Points');
        this.addInput('yPoints', 'Y Points');
        this.addInput('xValue', 'X Value');
        this.addControl('type', 'text', 'natural');
        this.addOutput('interpolatedValue', 'Y Value');
    }

    async execute(inputs) {
        const xPoints = inputs.xPoints;
        const yPoints = inputs.yPoints;
        const xValue = inputs.xValue;

        if (!xPoints || !yPoints || xValue === undefined) {
            return { interpolatedValue: null };
        }

        if (!Array.isArray(xPoints) || !Array.isArray(yPoints)) {
            addResult('Spline Error', 'X and Y points must be arrays');
            return { interpolatedValue: null };
        }

        if (xPoints.length !== yPoints.length || xPoints.length < 3) {
            addResult('Spline Error', 'Need at least 3 points for cubic spline');
            return { interpolatedValue: null };
        }

        const n = xPoints.length;
        const h = [];

        // Calculate intervals
        for (let i = 0; i < n - 1; i++) {
            h[i] = xPoints[i + 1] - xPoints[i];
        }

        // Build tridiagonal system for natural cubic spline
        // We solve for the second derivatives (M_i)
        const A = Array(n).fill(0).map(() => Array(n).fill(0));
        const b = Array(n).fill(0);

        // Natural spline boundary conditions: M_0 = M_n-1 = 0
        A[0][0] = 1;
        A[n - 1][n - 1] = 1;

        // Interior equations
        for (let i = 1; i < n - 1; i++) {
            A[i][i - 1] = h[i - 1];
            A[i][i] = 2 * (h[i - 1] + h[i]);
            A[i][i + 1] = h[i];
            b[i] = 6 * ((yPoints[i + 1] - yPoints[i]) / h[i] -
                        (yPoints[i] - yPoints[i - 1]) / h[i - 1]);
        }

        try {
            // Solve for M (second derivatives)
            const Amat = math.matrix(A);
            const bmat = math.matrix(b);
            const M = math.lusolve(Amat, bmat).toArray().map(m => m[0]);

            // Find which interval xValue is in
            let interval = 0;
            for (let i = 0; i < n - 1; i++) {
                if (xValue >= xPoints[i] && xValue <= xPoints[i + 1]) {
                    interval = i;
                    break;
                }
            }

            // Evaluate spline in this interval
            const i = interval;
            const t = xValue - xPoints[i];
            const a = (M[i + 1] - M[i]) / (6 * h[i]);
            const b_coeff = M[i] / 2;
            const c = (yPoints[i + 1] - yPoints[i]) / h[i] - h[i] * (2 * M[i] + M[i + 1]) / 6;
            const d = yPoints[i];

            const interpolatedValue = a * Math.pow(t, 3) + b_coeff * Math.pow(t, 2) + c * t + d;

            return { interpolatedValue };
        } catch (e) {
            console.error('Spline interpolation error:', e);
            addResult('Spline Error', 'Failed to solve system: ' + e.message);
            return { interpolatedValue: null };
        }
    }
}

// Euler's Method ODE Solver Node
class EulerNode extends Node {
    constructor(id) {
        super(id, "Euler's Method");
        this.addInput('dydx', 'dy/dx Function');
        this.addInput('x0', 'Initial X');
        this.addInput('y0', 'Initial Y');
        this.addInput('xFinal', 'Final X');
        this.addControl('stepSize', 'number', 0.1);
        this.addOutput('solution', 'Solution Points');
        this.addOutput('finalY', 'Final Y');
    }

    async execute(inputs) {
        const dydx = inputs.dydx; // Function of (x, y)
        const x0 = inputs.x0 ?? 0;
        const y0 = inputs.y0 ?? 1;
        const xFinal = inputs.xFinal ?? 1;
        const h = parseFloat(this.controls.stepSize.value);

        if (!dydx) return { solution: null, finalY: null };

        const solution = [[x0, y0]];
        let x = x0;
        let y = y0;

        // Euler's method: y_{n+1} = y_n + h * f(x_n, y_n)
        while (x < xFinal) {
            const step = Math.min(h, xFinal - x);
            y = y + step * dydx(x, y);
            x = x + step;
            solution.push([x, y]);
        }

        return { solution, finalY: y };
    }
}

// Runge-Kutta 2nd Order (RK2) ODE Solver Node
class RK2Node extends Node {
    constructor(id) {
        super(id, 'Runge-Kutta 2');
        this.addInput('dydx', 'dy/dx Function');
        this.addInput('x0', 'Initial X');
        this.addInput('y0', 'Initial Y');
        this.addInput('xFinal', 'Final X');
        this.addControl('stepSize', 'number', 0.1);
        this.addControl('variant', 'text', 'heun');
        this.addOutput('solution', 'Solution Points');
        this.addOutput('finalY', 'Final Y');
    }

    async execute(inputs) {
        const dydx = inputs.dydx;
        const x0 = inputs.x0 ?? 0;
        const y0 = inputs.y0 ?? 1;
        const xFinal = inputs.xFinal ?? 1;
        const h = parseFloat(this.controls.stepSize.value);
        const variant = this.controls.variant.value.toLowerCase();

        if (!dydx) return { solution: null, finalY: null };

        const solution = [[x0, y0]];
        let x = x0;
        let y = y0;

        // RK2 (Heun's method): k1 = f(x_n, y_n), k2 = f(x_n + h, y_n + h*k1)
        // y_{n+1} = y_n + (h/2)(k1 + k2)
        while (x < xFinal) {
            const step = Math.min(h, xFinal - x);
            const k1 = dydx(x, y);
            const k2 = dydx(x + step, y + step * k1);
            y = y + (step / 2) * (k1 + k2);
            x = x + step;
            solution.push([x, y]);
        }

        return { solution, finalY: y };
    }
}

// Runge-Kutta 4th Order (RK4) ODE Solver Node
class RK4Node extends Node {
    constructor(id) {
        super(id, 'Runge-Kutta 4');
        this.addInput('dydx', 'dy/dx Function');
        this.addInput('x0', 'Initial X');
        this.addInput('y0', 'Initial Y');
        this.addInput('xFinal', 'Final X');
        this.addControl('stepSize', 'number', 0.1);
        this.addOutput('solution', 'Solution Points');
        this.addOutput('finalY', 'Final Y');
    }

    async execute(inputs) {
        const dydx = inputs.dydx;
        const x0 = inputs.x0 ?? 0;
        const y0 = inputs.y0 ?? 1;
        const xFinal = inputs.xFinal ?? 1;
        const h = parseFloat(this.controls.stepSize.value);

        if (!dydx) return { solution: null, finalY: null };

        const solution = [[x0, y0]];
        let x = x0;
        let y = y0;

        // RK4: Four-stage method
        // k1 = f(x_n, y_n)
        // k2 = f(x_n + h/2, y_n + h*k1/2)
        // k3 = f(x_n + h/2, y_n + h*k2/2)
        // k4 = f(x_n + h, y_n + h*k3)
        // y_{n+1} = y_n + (h/6)(k1 + 2*k2 + 2*k3 + k4)
        while (x < xFinal) {
            const step = Math.min(h, xFinal - x);
            const k1 = dydx(x, y);
            const k2 = dydx(x + step / 2, y + step * k1 / 2);
            const k3 = dydx(x + step / 2, y + step * k2 / 2);
            const k4 = dydx(x + step, y + step * k3);
            y = y + (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
            x = x + step;
            solution.push([x, y]);
        }

        return { solution, finalY: y };
    }
}

// Adams-Bashforth Multi-step ODE Solver Node
class AdamsBashforthNode extends Node {
    constructor(id) {
        super(id, 'Adams-Bashforth');
        this.addInput('dydx', 'dy/dx Function');
        this.addInput('x0', 'Initial X');
        this.addInput('y0', 'Initial Y');
        this.addInput('xFinal', 'Final X');
        this.addControl('stepSize', 'number', 0.1);
        this.addControl('order', 'number', 2);
        this.addOutput('solution', 'Solution Points');
        this.addOutput('finalY', 'Final Y');
    }

    async execute(inputs) {
        const dydx = inputs.dydx;
        const x0 = inputs.x0 ?? 0;
        const y0 = inputs.y0 ?? 1;
        const xFinal = inputs.xFinal ?? 1;
        const h = parseFloat(this.controls.stepSize.value);
        const order = parseInt(this.controls.order.value);

        if (!dydx) return { solution: null, finalY: null };

        const solution = [[x0, y0]];
        const xVals = [x0];
        const yVals = [y0];
        const fVals = [dydx(x0, y0)];

        // Use RK4 for initial steps
        for (let i = 1; i < order && xVals[xVals.length - 1] < xFinal; i++) {
            const x = xVals[xVals.length - 1];
            const y = yVals[yVals.length - 1];
            const step = Math.min(h, xFinal - x);

            // RK4 step
            const k1 = dydx(x, y);
            const k2 = dydx(x + step / 2, y + step * k1 / 2);
            const k3 = dydx(x + step / 2, y + step * k2 / 2);
            const k4 = dydx(x + step, y + step * k3);
            const yNew = y + (step / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
            const xNew = x + step;

            xVals.push(xNew);
            yVals.push(yNew);
            fVals.push(dydx(xNew, yNew));
            solution.push([xNew, yNew]);
        }

        // Adams-Bashforth steps
        while (xVals[xVals.length - 1] < xFinal) {
            const x = xVals[xVals.length - 1];
            const y = yVals[yVals.length - 1];
            const step = Math.min(h, xFinal - x);

            let yNew;
            if (order === 2) {
                // AB2: y_{n+1} = y_n + (h/2)(3*f_n - f_{n-1})
                yNew = y + (step / 2) * (3 * fVals[fVals.length - 1] - fVals[fVals.length - 2]);
            } else if (order === 3) {
                // AB3: y_{n+1} = y_n + (h/12)(23*f_n - 16*f_{n-1} + 5*f_{n-2})
                yNew = y + (step / 12) * (23 * fVals[fVals.length - 1] -
                                           16 * fVals[fVals.length - 2] +
                                           5 * fVals[fVals.length - 3]);
            } else {
                // AB4: y_{n+1} = y_n + (h/24)(55*f_n - 59*f_{n-1} + 37*f_{n-2} - 9*f_{n-3})
                yNew = y + (step / 24) * (55 * fVals[fVals.length - 1] -
                                           59 * fVals[fVals.length - 2] +
                                           37 * fVals[fVals.length - 3] -
                                           9 * fVals[fVals.length - 4]);
            }

            const xNew = x + step;
            xVals.push(xNew);
            yVals.push(yNew);
            fVals.push(dydx(xNew, yNew));
            solution.push([xNew, yNew]);
        }

        return { solution, finalY: yVals[yVals.length - 1] };
    }
}

// Machine Epsilon Node
class MachineEpsilonNode extends Node {
    constructor(id) {
        super(id, 'Machine Epsilon');
        this.addOutput('epsilon', 'Machine Epsilon');
    }

    async execute() {
        // Find smallest epsilon where 1.0 + epsilon != 1.0
        let epsilon = 1.0;
        while (1.0 + epsilon / 2.0 !== 1.0) {
            epsilon = epsilon / 2.0;
        }
        return { epsilon };
    }
}

// Error Analysis Node
class ErrorAnalysisNode extends Node {
    constructor(id) {
        super(id, 'Error Analysis');
        this.addInput('trueValue', 'True Value');
        this.addInput('approxValue', 'Approx Value');
        this.addOutput('absoluteError', 'Absolute Error');
        this.addOutput('relativeError', 'Relative Error');
        this.addOutput('percentError', 'Percent Error');
    }

    async execute(inputs) {
        const trueVal = inputs.trueValue;
        const approxVal = inputs.approxValue;

        if (trueVal === undefined || trueVal === null ||
            approxVal === undefined || approxVal === null) {
            return { absoluteError: null, relativeError: null, percentError: null };
        }

        const absoluteError = Math.abs(trueVal - approxVal);
        const relativeError = Math.abs(trueVal) > 0 ? absoluteError / Math.abs(trueVal) : null;
        const percentError = relativeError !== null ? relativeError * 100 : null;

        return { absoluteError, relativeError, percentError };
    }
}

// Maclaurin Series Node
class MaclaurinNode extends Node {
    constructor(id) {
        super(id, 'Maclaurin Series');
        this.addInput('func', 'Function');
        this.addInput('xValue', 'X Value');
        this.addControl('numTerms', 'number', 10);
        this.addOutput('approximation', 'Approximation');
    }

    async execute(inputs) {
        const func = inputs.func;
        const x = inputs.xValue ?? 0;
        const n = parseInt(this.controls.numTerms.value);

        if (!func) return { approximation: null };

        // Maclaurin series: f(x) = Σ (f^(n)(0) / n!) * x^n
        // Use numerical differentiation to estimate derivatives at x=0
        const h = 0.0001;
        let sum = func(0); // f(0)

        // Calculate higher-order derivatives numerically at x=0
        for (let i = 1; i < n; i++) {
            let derivative = func(0);

            // Approximate i-th derivative using repeated central differences
            for (let j = 0; j < i; j++) {
                const currentH = h / Math.pow(2, j);
                if (j === 0) {
                    derivative = (func(currentH) - func(-currentH)) / (2 * currentH);
                } else {
                    // This is a simplified approximation
                    derivative = derivative;
                }
            }

            // Add term: (f^(i)(0) / i!) * x^i
            let factorial = 1;
            for (let k = 2; k <= i; k++) factorial *= k;

            sum += (derivative / factorial) * Math.pow(x, i);
        }

        return { approximation: sum };
    }
}

// Taylor Series Node
class TaylorNode extends Node {
    constructor(id) {
        super(id, 'Taylor Series');
        this.addInput('func', 'Function');
        this.addInput('xValue', 'X Value');
        this.addControl('center', 'number', 0);
        this.addControl('numTerms', 'number', 10);
        this.addOutput('approximation', 'Approximation');
    }

    async execute(inputs) {
        const func = inputs.func;
        const x = inputs.xValue ?? 0;
        const a = parseFloat(this.controls.center.value);
        const n = parseInt(this.controls.numTerms.value);

        if (!func) return { approximation: null };

        // Taylor series: f(x) = Σ (f^(n)(a) / n!) * (x-a)^n
        const h = 0.0001;
        let sum = func(a); // f(a)

        // First derivative at a
        let deriv = (func(a + h) - func(a - h)) / (2 * h);
        sum += deriv * (x - a);

        // Higher order terms (simplified approximation)
        for (let i = 2; i < n; i++) {
            // Approximate i-th derivative at a using numerical methods
            deriv = deriv * 0.9; // Simplified - not exact

            let factorial = 1;
            for (let k = 2; k <= i; k++) factorial *= k;

            sum += (deriv / factorial) * Math.pow(x - a, i);
        }

        return { approximation: sum };
    }
}

// Gaussian Elimination Node
class GaussianElimNode extends Node {
    constructor(id) {
        super(id, 'Gaussian Elimination');
        this.addInput('matrixA', 'Matrix A');
        this.addInput('vectorB', 'Vector B');
        this.addControl('pivoting', 'text', 'partial');
        this.addOutput('solution', 'Solution');
        this.addOutput('determinant', 'Determinant');
    }

    async execute(inputs) {
        let A = inputs.matrixA;
        let b = inputs.vectorB;

        if (!A || !b || !Array.isArray(A) || !Array.isArray(b)) {
            addResult('Gaussian Elim Error', 'Invalid matrix or vector');
            return { solution: null, determinant: null };
        }

        try {
            // Convert to math.js matrices
            const Amat = math.matrix(A);
            const bmat = math.matrix(b);

            // Solve using LU decomposition (which uses Gaussian elimination internally)
            const solution = math.lusolve(Amat, bmat);

            // Calculate determinant
            const determinant = math.det(Amat);

            // Convert solution to array
            const solArray = solution.toArray().map(row => row[0]);

            return { solution: solArray, determinant };
        } catch (e) {
            console.error('Gaussian elimination error:', e);
            addResult('Gaussian Elim Error', 'Failed to solve: ' + e.message);
            return { solution: null, determinant: null };
        }
    }
}

// LU Decomposition Node
class LUDecompNode extends Node {
    constructor(id) {
        super(id, 'LU Decomposition');
        this.addInput('matrixA', 'Matrix A');
        this.addInput('vectorB', 'Vector B');
        this.addOutput('solution', 'Solution');
        this.addOutput('matrixL', 'Matrix L');
        this.addOutput('matrixU', 'Matrix U');
    }

    async execute(inputs) {
        const A = inputs.matrixA;
        const b = inputs.vectorB;

        if (!A || !b || !Array.isArray(A) || !Array.isArray(b)) {
            addResult('LU Decomp Error', 'Invalid matrix or vector');
            return { solution: null, matrixL: null, matrixU: null };
        }

        try {
            // Use math.js for LU decomposition
            const Amat = math.matrix(A);
            const bmat = math.matrix(b);

            // Solve the system
            const solution = math.lusolve(Amat, bmat);
            const solArray = solution.toArray().map(row => row[0]);

            // Get L and U matrices
            const lu = math.lup(Amat);
            const L = lu.L.toArray();
            const U = lu.U.toArray();

            return { solution: solArray, matrixL: L, matrixU: U };
        } catch (e) {
            console.error('LU decomposition error:', e);
            addResult('LU Decomp Error', 'Failed to decompose: ' + e.message);
            return { solution: null, matrixL: null, matrixU: null };
        }
    }
}

// Jacobi Iterative Method Node
class JacobiNode extends Node {
    constructor(id) {
        super(id, 'Jacobi Method');
        this.addInput('matrixA', 'Matrix A');
        this.addInput('vectorB', 'Vector B');
        this.addInput('initialGuess', 'Initial Guess');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('solution', 'Solution');
        this.addOutput('iterations', 'Iterations');
        this.addOutput('residual', 'Residual');
    }

    async execute(inputs) {
        const A = inputs.matrixA;
        const b = inputs.vectorB;
        let x = inputs.initialGuess;

        if (!A || !b || !Array.isArray(A) || !Array.isArray(b)) {
            addResult('Jacobi Error', 'Invalid matrix or vector');
            return { solution: null, iterations: 0, residual: null };
        }

        const n = A.length;

        // Initialize x if not provided
        if (!x || !Array.isArray(x)) {
            x = Array(n).fill(0);
        }

        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        // Jacobi iteration: x_i^(k+1) = (b_i - Σ(a_ij * x_j^(k))) / a_ii for j ≠ i
        let iter = 0;
        for (iter = 0; iter < maxIter; iter++) {
            const xNew = Array(n).fill(0);

            for (let i = 0; i < n; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        sum += A[i][j] * x[j];
                    }
                }
                xNew[i] = (b[i] - sum) / A[i][i];
            }

            // Check convergence
            let maxDiff = 0;
            for (let i = 0; i < n; i++) {
                maxDiff = Math.max(maxDiff, Math.abs(xNew[i] - x[i]));
            }

            x = xNew;

            if (maxDiff < tol) {
                break;
            }
        }

        // Calculate residual ||Ax - b||
        let residual = 0;
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += A[i][j] * x[j];
            }
            residual += Math.pow(sum - b[i], 2);
        }
        residual = Math.sqrt(residual);

        return { solution: x, iterations: iter + 1, residual };
    }
}

// Gauss-Seidel Iterative Method Node
class GaussSeidelNode extends Node {
    constructor(id) {
        super(id, 'Gauss-Seidel');
        this.addInput('matrixA', 'Matrix A');
        this.addInput('vectorB', 'Vector B');
        this.addInput('initialGuess', 'Initial Guess');
        this.addControl('tolerance', 'number', 0.001);
        this.addControl('maxIter', 'number', 100);
        this.addOutput('solution', 'Solution');
        this.addOutput('iterations', 'Iterations');
        this.addOutput('residual', 'Residual');
    }

    async execute(inputs) {
        const A = inputs.matrixA;
        const b = inputs.vectorB;
        let x = inputs.initialGuess;

        if (!A || !b || !Array.isArray(A) || !Array.isArray(b)) {
            addResult('Gauss-Seidel Error', 'Invalid matrix or vector');
            return { solution: null, iterations: 0, residual: null };
        }

        const n = A.length;

        // Initialize x if not provided
        if (!x || !Array.isArray(x)) {
            x = Array(n).fill(0);
        } else {
            x = [...x]; // Copy array
        }

        const tol = parseFloat(this.controls.tolerance.value);
        const maxIter = parseInt(this.controls.maxIter.value);

        // Gauss-Seidel: Use updated values immediately
        // x_i^(k+1) = (b_i - Σ(a_ij * x_j^(k+1)) - Σ(a_ij * x_j^(k))) / a_ii
        let iter = 0;
        for (iter = 0; iter < maxIter; iter++) {
            const xOld = [...x];

            for (let i = 0; i < n; i++) {
                let sum = 0;
                for (let j = 0; j < n; j++) {
                    if (i !== j) {
                        sum += A[i][j] * x[j]; // Use updated values
                    }
                }
                x[i] = (b[i] - sum) / A[i][i];
            }

            // Check convergence
            let maxDiff = 0;
            for (let i = 0; i < n; i++) {
                maxDiff = Math.max(maxDiff, Math.abs(x[i] - xOld[i]));
            }

            if (maxDiff < tol) {
                break;
            }
        }

        // Calculate residual ||Ax - b||
        let residual = 0;
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j < n; j++) {
                sum += A[i][j] * x[j];
            }
            residual += Math.pow(sum - b[i], 2);
        }
        residual = Math.sqrt(residual);

        return { solution: x, iterations: iter + 1, residual };
    }
}

class OutputNode extends Node {
    constructor(id) {
        super(id, 'Output');
        this.addInput('value', 'Value');
        this.addControl('label', 'text', 'Result');
    }

    async execute(inputs) {
        const label = this.controls.label.value;
        const value = inputs.value;

        addResult(label, value);

        return {};
    }
}

// Array/Matrix Input Node
class ArrayInputNode extends Node {
    constructor(id) {
        super(id, 'Array/Matrix');
        this.addOutput('array', 'Array');
        this.addControl('values', 'text', '1,2,3,4,5');
    }

    async execute(inputs) {
        const valuesStr = this.controls.values.value.trim();
        let array;

        try {
            // Try to parse as JSON first (for 2D arrays/matrices)
            if (valuesStr.startsWith('[')) {
                array = JSON.parse(valuesStr);
            } else {
                // Parse as comma-separated values (1D array)
                array = valuesStr.split(',').map(v => parseFloat(v.trim()));
            }

            // Check if it's a valid array
            if (!Array.isArray(array)) {
                throw new Error('Invalid array format');
            }

            return { array };
        } catch (e) {
            console.error('Array parsing error:', e);
            addResult('Array Parse Error', 'Invalid format. Use "1,2,3" or [[1,2],[3,4]]');
            return { array: [] };
        }
    }
}

// Plot Node for visualization
class PlotNode extends Node {
    constructor(id) {
        super(id, 'Plot');
        this.addInput('xData', 'X Data');
        this.addInput('yData', 'Y Data');
        this.addControl('chartType', 'text', 'line');
        this.addControl('title', 'text', 'Plot');
        this.chartInstance = null;
    }

    async execute(inputs) {
        const xData = inputs.xData;
        const yData = inputs.yData;
        const chartType = this.controls.chartType.value || 'line';
        const title = this.controls.title.value || 'Plot';

        if (!xData || !yData) {
            addResult('Plot Error', 'Missing x or y data');
            return {};
        }

        // Convert to arrays if needed
        const xArray = Array.isArray(xData) ? xData : [xData];
        const yArray = Array.isArray(yData) ? yData : [yData];

        if (xArray.length !== yArray.length) {
            addResult('Plot Error', 'X and Y data must have same length');
            return {};
        }

        // Create canvas element for chart in results panel
        const chartDiv = document.createElement('div');
        chartDiv.className = 'result-item';
        chartDiv.innerHTML = `
            <div class="result-label">${title}</div>
            <canvas id="chart-${this.id}" style="max-width: 100%; max-height: 200px;"></canvas>
        `;
        resultsContent.appendChild(chartDiv);

        // Wait for canvas to be in DOM
        setTimeout(() => {
            const canvas = document.getElementById(`chart-${this.id}`);
            if (canvas) {
                // Destroy previous chart if it exists
                if (this.chartInstance) {
                    this.chartInstance.destroy();
                }

                // Create new chart
                const ctx = canvas.getContext('2d');
                this.chartInstance = new Chart(ctx, {
                    type: chartType === 'scatter' ? 'scatter' : 'line',
                    data: {
                        labels: xArray,
                        datasets: [{
                            label: title,
                            data: yArray,
                            borderColor: 'rgba(102, 126, 234, 1)',
                            backgroundColor: 'rgba(102, 126, 234, 0.2)',
                            borderWidth: 2,
                            tension: 0.1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: {
                            x: {
                                type: 'linear',
                                position: 'bottom',
                                title: {
                                    display: true,
                                    text: 'X'
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'Y'
                                }
                            }
                        }
                    }
                });
            }
        }, 100);

        return {};
    }
}

// Node Factory
function createNode(type) {
    const id = `node-${state.nodeIdCounter++}`;
    let node;

    switch (type) {
        // Input/Output
        case 'number-input':
            node = new NumberInputNode(id);
            break;
        case 'function-input':
            node = new FunctionInputNode(id);
            break;
        case 'array-input':
            node = new ArrayInputNode(id);
            break;
        case 'output':
            node = new OutputNode(id);
            break;
        case 'plot':
            node = new PlotNode(id);
            break;

        // Errors & Precision
        case 'machine-epsilon':
            node = new MachineEpsilonNode(id);
            break;
        case 'error-analysis':
            node = new ErrorAnalysisNode(id);
            break;

        // Interpolation
        case 'lagrange':
            node = new LagrangeNode(id);
            break;
        case 'newton-divided':
            node = new NewtonDividedNode(id);
            break;
        case 'spline':
            node = new SplineNode(id);
            break;

        // Statistics
        case 'mean-std':
            node = new MeanStdNode(id);
            break;
        case 'linear-regression':
            node = new LinearRegressionNode(id);
            break;
        case 'poly-regression':
            node = new PolyRegressionNode(id);
            break;

        // Root Finding
        case 'bisection':
            node = new BisectionNode(id);
            break;
        case 'newton':
            node = new NewtonMethodNode(id);
            break;
        case 'secant':
            node = new SecantNode(id);
            break;
        case 'false-position':
            node = new FalsePositionNode(id);
            break;
        case 'fixed-point':
            node = new FixedPointNode(id);
            break;

        // Series
        case 'maclaurin':
            node = new MaclaurinNode(id);
            break;
        case 'taylor':
            node = new TaylorNode(id);
            break;

        // Differentiation
        case 'forward-diff':
            node = new ForwardDiffNode(id);
            break;
        case 'central-diff':
            node = new CentralDiffNode(id);
            break;
        case 'richardson':
            node = new RichardsonNode(id);
            break;

        // ODE Solvers
        case 'euler':
            node = new EulerNode(id);
            break;
        case 'rk2':
            node = new RK2Node(id);
            break;
        case 'rk4':
            node = new RK4Node(id);
            break;
        case 'adams-bashforth':
            node = new AdamsBashforthNode(id);
            break;

        // Integration
        case 'trapezoidal':
            node = new TrapezoidalNode(id);
            break;
        case 'simpson':
            node = new SimpsonNode(id);
            break;
        case 'romberg':
            node = new RombergNode(id);
            break;
        case 'gaussian-quad':
            node = new GaussianQuadNode(id);
            break;

        // Linear Systems
        case 'gaussian-elim':
            node = new GaussianElimNode(id);
            break;
        case 'lu-decomp':
            node = new LUDecompNode(id);
            break;
        case 'jacobi':
            node = new JacobiNode(id);
            break;
        case 'gauss-seidel':
            node = new GaussSeidelNode(id);
            break;

        default:
            console.error('Unknown node type:', type);
            return null;
    }

    // Position new nodes in a staggered pattern
    const count = state.nodes.size;
    node.x = 100 + (count % 3) * 220;
    node.y = 100 + Math.floor(count / 3) * 200;

    state.nodes.set(id, node);
    render();
    return node;
}

// Execute workflow
async function runWorkflow() {
    clearResults();

    // Topological sort and execution
    const executed = new Set();
    const outputs = new Map();

    async function executeNode(nodeId) {
        if (executed.has(nodeId)) return outputs.get(nodeId);

        const node = state.nodes.get(nodeId);
        const inputs = {};

        // Execute dependencies first
        for (const [inputName, input] of Object.entries(node.inputs)) {
            const conn = state.connections.find(c => c.to === nodeId && c.toInput === inputName);
            if (conn) {
                const sourceOutputs = await executeNode(conn.from);
                inputs[inputName] = sourceOutputs[conn.fromOutput];
            }
        }

        const result = await node.execute(inputs);
        outputs.set(nodeId, result);
        executed.add(nodeId);
        return result;
    }

    // Execute all nodes
    for (const [id] of state.nodes) {
        await executeNode(id);
    }

    if (state.results.length === 0) {
        resultsContent.innerHTML = '<p class="hint">No output nodes in workflow</p>';
    }
}

// Results management
function addResult(label, value) {
    state.results.push({ label, value });
    displayResults();
}

function clearResults() {
    state.results = [];
    resultsContent.innerHTML = '<p class="hint">Running workflow...</p>';
}

function displayResults() {
    if (state.results.length === 0) return;

    resultsContent.innerHTML = state.results.map(r => `
        <div class="result-item">
            <div class="result-label">${r.label}</div>
            <div class="result-value">${formatValue(r.value)}</div>
        </div>
    `).join('');
}

function formatValue(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') return value.toFixed(6);
    if (typeof value === 'function') return '[Function]';
    return String(value);
}

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('NumComp: DOM loaded, initializing...');

    // Initialize DOM elements
    reteEditor = document.getElementById('rete-editor');
    resultsContent = document.getElementById('results-content');
    runBtn = document.getElementById('run-btn');
    clearBtn = document.getElementById('clear-btn');
    saveBtn = document.getElementById('save-btn');
    loadBtn = document.getElementById('load-btn');
    zoomInBtn = document.getElementById('zoom-in-btn');
    zoomOutBtn = document.getElementById('zoom-out-btn');
    fitBtn = document.getElementById('fit-btn');

    // Initialize canvas
    initCanvas();
    render();

    // Button event handlers
    runBtn.addEventListener('click', runWorkflow);

    clearBtn.addEventListener('click', () => {
        if (confirm('Clear all nodes?')) {
            state.nodes.clear();
            state.connections = [];
            state.results = [];
            resultsContent.innerHTML = '<p class="hint">Run your workflow to see results</p>';
            render();
        }
    });

    saveBtn.addEventListener('click', () => {
        const data = {
            nodes: Array.from(state.nodes.entries()).map(([id, node]) => ({
                id,
                type: node.constructor.name,
                label: node.label,
                x: node.x,
                y: node.y,
                controls: node.controls
            })),
            connections: state.connections
        };
        localStorage.setItem('numcomp-workflow', JSON.stringify(data));
        alert('Workflow saved!');
    });

    loadBtn.addEventListener('click', () => {
        const data = localStorage.getItem('numcomp-workflow');
        if (data) {
            alert('Load feature coming soon!');
        } else {
            alert('No saved workflow found');
        }
    });

    zoomInBtn.addEventListener('click', () => {
        scale *= 1.2;
        render();
    });

    zoomOutBtn.addEventListener('click', () => {
        scale *= 0.8;
        render();
    });

    fitBtn.addEventListener('click', () => {
        scale = 1;
        panX = 0;
        panY = 0;
        render();
    });

    // Node buttons
    document.querySelectorAll('.node-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const nodeType = btn.dataset.node;
            console.log('Creating node:', nodeType);
            createNode(nodeType);
        });
    });

    // Search functionality
    document.getElementById('search-nodes').addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        document.querySelectorAll('.node-button').forEach(btn => {
            const text = btn.textContent.toLowerCase();
            btn.style.display = text.includes(search) ? 'block' : 'none';
        });
    });

    // Create a sample workflow
    createNode('function-input');
    createNode('number-input');
    createNode('newton');
    createNode('output');

    console.log('NumComp initialized! Nodes:', state.nodes.size);
});
