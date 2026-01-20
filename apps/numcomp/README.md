# NumComp - Visual Numerical Computing

A visual programming environment for learning and experimenting with numerical computing concepts. Implements 40+ numerical methods from CST8233 course.

## Features

- **Visual Node-Based Interface**: Custom canvas-based editor with pan/zoom
- **40+ Numerical Methods**: Complete coverage of CST8233 course topics
- **Real-time Execution**: Run workflows and see results instantly
- **Educational Focus**: Learn numerical algorithms through visual programming
- **Dark/Light Theme**: Integrated with Portal's theme system

## Implemented Nodes

### Input/Output (5 nodes)
- **Number Input**: Single numeric values
- **Function Input**: Mathematical functions using math.js expressions
- **Array/Matrix Input**: Arrays and matrices (comma-separated or JSON format)
- **Output**: Display computed results
- **Plot**: Visualize data with Chart.js (line/scatter plots)

### Errors & Precision (2 nodes)
- **Machine Epsilon**: Calculate floating-point precision
- **Error Analysis**: Absolute, relative, and percent error

### Interpolation (3 nodes)
- **Lagrange Interpolation**: Polynomial interpolation using Lagrange basis
- **Newton's Divided Differences**: Efficient polynomial interpolation
- **Cubic Spline**: Natural cubic spline interpolation

### Statistics & Regression (3 nodes)
- **Mean & Std Dev**: Statistical measures (sample/population)
- **Linear Regression**: Least squares linear fit with R²
- **Polynomial Regression**: Polynomial least squares fit

### Root Finding (5 nodes)
- **Bisection Method**: Bracketing method with guaranteed convergence
- **Newton's Method**: Fast convergence using derivatives
- **Secant Method**: Approximates derivative with secant line
- **False Position**: Regula falsi method
- **Fixed Point Iteration**: Iterative method for x = g(x)

### Series Approximation (2 nodes)
- **Maclaurin Series**: Taylor series at x = 0
- **Taylor Series**: Power series expansion around any point

### Differentiation (3 nodes)
- **Forward Difference**: First-order approximation O(h)
- **Central Difference**: Second-order approximation O(h²)
- **Richardson Extrapolation**: Improves accuracy by combining estimates

### Integration (4 nodes)
- **Trapezoidal Rule**: Basic numerical integration
- **Simpson's Rule**: Simpson's 1/3 rule (higher accuracy)
- **Romberg Integration**: Richardson extrapolation for integration
- **Gaussian Quadrature**: Gauss-Legendre quadrature (2-5 points)

### ODE Solvers (4 nodes)
- **Euler's Method**: First-order explicit method
- **Runge-Kutta 2**: Second-order method (Heun's)
- **Runge-Kutta 4**: Fourth-order method (most popular)
- **Adams-Bashforth**: Multi-step predictor method (2nd-4th order)

### Linear Systems (4 nodes)
- **Gaussian Elimination**: Direct solver with pivoting
- **LU Decomposition**: Doolittle factorization
- **Jacobi Method**: Iterative solver (diagonal dominance required)
- **Gauss-Seidel**: Iterative solver (faster than Jacobi)

## Usage

1. **Add Nodes**: Click node buttons in the left sidebar
2. **Position Nodes**: Drag nodes on the canvas to organize your workflow
3. **Edit Controls**: Adjust parameters directly on each node
4. **Run Workflow**: Click the "Run" button in the toolbar
5. **View Results**: Check the results panel on the right

## Example Workflows

### Root Finding
Find root of f(x) = x² - 4:
- Function Input: `x^2 - 4`
- Number Input: `1.0` (initial guess)
- Newton's Method
- Output
- Run → Result: 2.000

### Numerical Integration
Integrate f(x) = x² from 0 to 1:
- Function Input: `x^2`
- Number Inputs: `0` (lower), `1` (upper)
- Simpson's Rule: intervals = 100
- Output
- Run → Result: 0.333...

### Linear Regression
Fit line to data:
- Array Input: `1,2,3,4,5` (x data)
- Array Input: `2,4,6,8,10` (y data)
- Linear Regression
- Output
- Run → Result: slope = 2.0, intercept = 0.0, R² = 1.0

## Technology

- **Visual Programming**: Custom canvas-based node editor
- **Numerical Computing**: math.js library
- **Visualization**: Chart.js for plotting
- **UI**: Vanilla JavaScript with Portal theme integration

## Usage Notes

- **Visual Connections**: Drag from output sockets (right side, orange) to input sockets (left side, blue)
- **Connection Validation**: Prevents self-connections and circular dependencies
- **Remove Connections**: Click on an input socket to remove its connection
- **Workflow Execution**: Follows connection graph using topological sort

## Coming Soon

- Save/load workflows to localStorage
- Export results and plots
- Step-by-step algorithm visualization
- Interactive control editing with click-to-edit interface
- More chart types for Plot node
