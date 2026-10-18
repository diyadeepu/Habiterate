// --- App State & Local Storage ---
let appState = {
    habits: []
};

// --- First-Time User Onboarding (Default Habits) ---
function getOnboardingHabits() {
    // We set the creation date to 5 days ago so the rolling average has some math to do!
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return [
        {
            id: 101,
            title: "Drink 64oz of Water",
            createdAt: fiveDaysAgo,
            history: {} // User can start logging today!
        },
        {
            id: 102,
            title: "Read 10 Pages",
            createdAt: fiveDaysAgo,
            history: {}
        },
        {
            id: 103,
            title: "Code for 30 Minutes",
            createdAt: fiveDaysAgo,
            history: {}
        }
    ];
}

// Load data from local storage on startup
function loadState() {
    const saved = localStorage.getItem('habiterateState');

    if (saved) {
        // If they have visited before, load their saved data
        appState = JSON.parse(saved);

        // Failsafe: if they deleted all habits, ensure array exists
        if (!appState.habits) {
            appState.habits = [];
        }
    } else {
        // FIRST TIME VISIT: Populate the 3 default habits to show off the UI
        appState.habits = getOnboardingHabits();
        saveState(); // Save these defaults so they persist
    }

    renderDashboard();
}

function saveState() {
    localStorage.setItem('habiterateState', JSON.stringify(appState));
    renderDashboard();
}

// --- Loading Screen Logic (Hover to Commit) ---
let hoverTimer;

function initLoadingScreen() {
    const circle = document.getElementById('commit-circle');

    // When the mouse enters the circle, start the 2-second clock
    circle.addEventListener('mouseenter', () => {
        hoverTimer = setTimeout(() => {
            unlockApp();
        }, 2000); // 2000ms = 2 seconds
    });

    // If the mouse leaves before 2 seconds, cancel the timer
    circle.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
    });
}

function unlockApp() {
    const loadingPage = document.getElementById('loading-page');

    // Fade out the loading screen
    loadingPage.style.opacity = '0';

    // Wait for the fade animation to finish, then remove it and show the dashboard
    setTimeout(() => {
        loadingPage.style.display = 'none';
        switchTab('main');
    }, 500);
}

// --- Navigation Logic ---
function switchTab(tabId) {
    document.getElementById('main-page').classList.replace('block', 'hidden');
    document.getElementById('motivation-page').classList.add('hidden');
    document.getElementById('motivation-page').classList.remove('flex');

    document.getElementById('nav-main').className = "hover:text-cream transition-colors border-b-2 border-transparent text-cream";
    document.getElementById('nav-motivation').className = "hover:text-mustard transition-colors border-b-2 border-transparent text-cream";

    if (tabId === 'main') {
        document.getElementById('main-page').classList.replace('hidden', 'block');
        document.getElementById('nav-main').className = "text-mustard hover:text-cream transition-colors border-b-2 border-mustard";
    } else if (tabId === 'motivation') {
        document.getElementById('motivation-page').classList.remove('hidden');
        document.getElementById('motivation-page').classList.add('flex');
        document.getElementById('nav-motivation').className = "text-mustard hover:text-cream transition-colors border-b-2 border-mustard";
    }
}

// --- The "Rule of Three" & Habit Logic ---
function addHabit() {
    const input = document.getElementById('new-habit-input');
    const warning = document.getElementById('rule-of-three-warning');
    const title = input.value.trim();

    if (!title) return;

    // THE RULE OF THREE: Prevent adding more than 3 habits
    if (appState.habits.length >= 3) {
        warning.classList.remove('hidden');
        setTimeout(() => warning.classList.add('hidden'), 4000);
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    appState.habits.push({
        id: Date.now(),
        title: title,
        createdAt: today,
        history: {}
    });

    input.value = '';
    saveState();
}

function logHabit(habitId, score) {
    const habit = appState.habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];
    habit.history[today] = score; // Logs 0, 0.5, or 1
    saveState();
}

function deleteHabit(habitId) {
    appState.habits = appState.habits.filter(h => h.id !== habitId);
    saveState();
}

// --- Rolling Average Consistency Math ---
function calculateConsistency(habit) {
    const today = new Date();
    const createdDate = new Date(habit.createdAt);

    // Calculate days since creation (capped at 30 days maximum)
    let daysActive = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;
    if (daysActive > 30) daysActive = 30;

    let totalPoints = 0;

    // Look back over the active days and tally points
    for (let i = 0; i < daysActive; i++) {
        let d = new Date();
        d.setDate(today.getDate() - i);
        let dateString = d.toISOString().split('T')[0];

        if (habit.history[dateString] !== undefined) {
            totalPoints += habit.history[dateString];
        }
    }

    return Math.round((totalPoints / daysActive) * 100);
}

// --- Render the Habit Cards to the HTML ---
function renderDashboard() {
    const container = document.getElementById('habits-container');
    container.innerHTML = '';

    appState.habits.forEach(habit => {
        const consistency = calculateConsistency(habit);
        const today = new Date().toISOString().split('T')[0];
        const todayScore = habit.history[today];

        const habitCard = document.createElement('div');
        habitCard.className = 'bg-white p-6 rounded-xl shadow-sm border-l-8 border-navy flex flex-col md:flex-row justify-between items-center gap-4';

        habitCard.innerHTML = `
            <div class="flex-1 w-full">
                <div class="flex justify-between items-start">
                    <h3 class="text-2xl font-bold text-navy mb-1">${habit.title}</h3>
                    <button onclick="deleteHabit(${habit.id})" class="text-slate hover:text-red-500 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
                <p class="text-slate text-sm mb-3">30-Day Rolling Consistency: <span class="font-bold text-mustard">${consistency}%</span></p>
                <div class="w-full bg-cream rounded-full h-2.5 mb-2">
                    <div class="bg-mustard h-2.5 rounded-full transition-all duration-500" style="width: ${consistency}%"></div>
                </div>
            </div>
            
            <div class="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
                <button onclick="logHabit(${habit.id}, 0)" class="flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-colors ${todayScore === 0 ? 'bg-slate text-white' : 'bg-cream text-slate hover:bg-slate hover:text-white'}">
                    Skipped
                </button>
                <button onclick="logHabit(${habit.id}, 0.5)" class="flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-colors ${todayScore === 0.5 ? 'bg-olive text-white' : 'bg-cream text-olive hover:bg-olive hover:text-white'}">
                    Tried
                </button>
                <button onclick="logHabit(${habit.id}, 1)" class="flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-sm transition-colors ${todayScore === 1 ? 'bg-mustard text-white' : 'bg-cream text-mustard hover:bg-mustard hover:text-white'}">
                    Crushed It
                </button>
            </div>
        `;
        container.appendChild(habitCard);
    });
}

// --- Motivation Generator Logic ---
const quotes = [
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "Continuous improvement is better than delayed perfection.", author: "Mark Twain" }
];

function generateQuote() {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selectedQuote = quotes[randomIndex];

    const textElement = document.getElementById('quote-text');
    const authorElement = document.getElementById('quote-author');

    textElement.style.opacity = 0;
    authorElement.style.opacity = 0;

    setTimeout(() => {
        textElement.innerText = `"${selectedQuote.text}"`;
        authorElement.innerText = `- ${selectedQuote.author}`;
        textElement.style.transition = "opacity 0.5s";
        authorElement.style.transition = "opacity 0.5s";
        textElement.style.opacity = 1;
        authorElement.style.opacity = 1;
    }, 200);
}

// Initialize the app when the file loads
window.onload = () => {
    loadState();           // Loads user habits and the 3 main habits array
    initLoadingScreen();   // Activates the hover logic
};