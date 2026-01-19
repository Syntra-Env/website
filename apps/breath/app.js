// State
const state = {
    currentView: 'home',
    breathingPhase: 'idle', // idle, inhale, hold, exhale, retention
    timerStartTime: null,
    timerAnimationId: null,
    currentSession: {
        cycles: [],
        currentCycle: {
            inhale: null,
            hold: null,
            exhale: null,
            retention: null
        }
    },
    cycleCount: 0
};

// DOM Elements
const homeView = document.getElementById('home-view');
const breathingView = document.getElementById('breathing-view');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const endSessionBtn = document.getElementById('end-session-btn');
const breathingCircle = document.getElementById('breathing-circle');
const timerDisplay = document.getElementById('timer-display');
const phaseLabel = document.getElementById('phase-label');
const cycleCountEl = document.getElementById('cycle-count');
const currentInhaleEl = document.getElementById('current-inhale');
const currentHoldEl = document.getElementById('current-hold');
const currentExhaleEl = document.getElementById('current-exhale');
const currentRetentionEl = document.getElementById('current-retention');
const emptyState = document.getElementById('empty-state');

// Storage key
const STORAGE_KEY = 'breath_sessions';

// Load sessions from localStorage
function loadSessions() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { sessions: [] };
}

// Save sessions to localStorage
function saveSessions(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Switch views
function showView(viewName) {
    state.currentView = viewName;

    if (viewName === 'home') {
        homeView.classList.remove('hidden');
        breathingView.classList.add('hidden');
        renderChart();
    } else {
        homeView.classList.add('hidden');
        breathingView.classList.remove('hidden');
    }
}

// Start a new breathing session
function startSession() {
    state.breathingPhase = 'idle';
    state.currentSession = {
        cycles: [],
        currentCycle: { inhale: null, hold: null, exhale: null, retention: null }
    };
    state.cycleCount = 0;

    resetCircleState();
    updateCycleDisplay();
    showView('breathing');
}

// Reset circle to idle state
function resetCircleState() {
    breathingCircle.classList.remove('inhale', 'hold', 'exhale', 'retention');
    timerDisplay.textContent = '0.0';
    phaseLabel.textContent = 'Tap to start';
}

// Update current cycle display
function updateCycleDisplay() {
    cycleCountEl.textContent = `Cycle: ${state.cycleCount}`;
    currentInhaleEl.textContent = state.currentSession.currentCycle.inhale
        ? state.currentSession.currentCycle.inhale.toFixed(1) + 's'
        : '-';
    currentHoldEl.textContent = state.currentSession.currentCycle.hold
        ? state.currentSession.currentCycle.hold.toFixed(1) + 's'
        : '-';
    currentExhaleEl.textContent = state.currentSession.currentCycle.exhale
        ? state.currentSession.currentCycle.exhale.toFixed(1) + 's'
        : '-';
    currentRetentionEl.textContent = state.currentSession.currentCycle.retention
        ? state.currentSession.currentCycle.retention.toFixed(1) + 's'
        : '-';
}

// Start timer
function startTimer() {
    state.timerStartTime = performance.now();
    updateTimer();
}

// Stop timer and return elapsed time
function stopTimer() {
    if (state.timerAnimationId) {
        cancelAnimationFrame(state.timerAnimationId);
        state.timerAnimationId = null;
    }

    if (state.timerStartTime) {
        const elapsed = (performance.now() - state.timerStartTime) / 1000;
        state.timerStartTime = null;
        return elapsed;
    }
    return 0;
}

// Update timer display
function updateTimer() {
    if (!state.timerStartTime) return;

    const elapsed = (performance.now() - state.timerStartTime) / 1000;
    timerDisplay.textContent = elapsed.toFixed(1);

    state.timerAnimationId = requestAnimationFrame(updateTimer);
}

// Handle circle click
function handleCircleClick() {
    switch (state.breathingPhase) {
        case 'idle':
            // Start inhale
            state.breathingPhase = 'inhale';
            state.cycleCount++;
            breathingCircle.classList.add('inhale');
            phaseLabel.textContent = 'Inhale';
            startTimer();
            break;

        case 'inhale':
            // Stop inhale, start hold
            const inhaleTime = stopTimer();
            state.currentSession.currentCycle.inhale = inhaleTime;

            state.breathingPhase = 'hold';
            breathingCircle.classList.remove('inhale');
            breathingCircle.classList.add('hold');
            phaseLabel.textContent = 'Hold';
            startTimer();
            break;

        case 'hold':
            // Stop hold, start exhale
            const holdTime = stopTimer();
            state.currentSession.currentCycle.hold = holdTime;

            state.breathingPhase = 'exhale';
            breathingCircle.classList.remove('hold');
            breathingCircle.classList.add('exhale');
            phaseLabel.textContent = 'Exhale';
            startTimer();
            break;

        case 'exhale':
            // Stop exhale, start retention (hold after exhale)
            const exhaleTime = stopTimer();
            state.currentSession.currentCycle.exhale = exhaleTime;

            state.breathingPhase = 'retention';
            breathingCircle.classList.remove('exhale');
            breathingCircle.classList.add('retention');
            phaseLabel.textContent = 'Retention';
            startTimer();
            break;

        case 'retention':
            // Stop retention, save cycle, start new inhale
            const retentionTime = stopTimer();
            state.currentSession.currentCycle.retention = retentionTime;

            // Save completed cycle
            state.currentSession.cycles.push({...state.currentSession.currentCycle});

            // Start new cycle
            state.currentSession.currentCycle = { inhale: null, hold: null, exhale: null, retention: null };
            state.cycleCount++;

            state.breathingPhase = 'inhale';
            breathingCircle.classList.remove('retention');
            breathingCircle.classList.add('inhale');
            phaseLabel.textContent = 'Inhale';
            startTimer();
            break;
    }

    updateCycleDisplay();
}

// End session and save
function endSession() {
    stopTimer();

    // If we have any partial cycle data, save it
    const currentCycle = state.currentSession.currentCycle;
    if (currentCycle.inhale !== null) {
        // Only save if we have at least inhale data
        if (currentCycle.hold === null) currentCycle.hold = 0;
        if (currentCycle.exhale === null) currentCycle.exhale = 0;
        if (currentCycle.retention === null) currentCycle.retention = 0;
        state.currentSession.cycles.push({...currentCycle});
    }

    // Only save session if we have completed cycles
    if (state.currentSession.cycles.length > 0) {
        const cycles = state.currentSession.cycles;

        // Calculate averages
        const averages = {
            inhale: cycles.reduce((sum, c) => sum + c.inhale, 0) / cycles.length,
            hold: cycles.reduce((sum, c) => sum + c.hold, 0) / cycles.length,
            exhale: cycles.reduce((sum, c) => sum + c.exhale, 0) / cycles.length,
            retention: cycles.reduce((sum, c) => sum + c.retention, 0) / cycles.length
        };

        const session = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            cycles: cycles,
            averages: averages
        };

        const data = loadSessions();
        data.sessions.push(session);
        saveSessions(data);
    }

    // Reset state and go home
    state.breathingPhase = 'idle';
    showView('home');
}

// Go back without saving
function goBack() {
    stopTimer();
    state.breathingPhase = 'idle';
    showView('home');
}

// Initialize
function init() {
    // Event listeners
    startBtn.addEventListener('click', startSession);
    backBtn.addEventListener('click', goBack);
    endSessionBtn.addEventListener('click', endSession);
    breathingCircle.addEventListener('click', handleCircleClick);

    // Initial render
    showView('home');
}

// Start app
init();
