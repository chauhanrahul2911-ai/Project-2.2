// MASTER DATA STRUCTURE WITH TWO-WAY ICONS (PNG + EMOJI FALLBACK)
const subjectData = {
  samanya_gyan: {
    gujName: "સામાન્ય જ્ઞાન",
    iconImg: "assets/icon/gk.webp",
    iconEmoji: "📜",
    branches: {
      gujarat_history: { gujName: "ગુજરાતનો ઇતિહાસ", totalTests: 5 },
      gujarat_geography: { gujName: "ગુજરાતની ભૂગોળ", totalTests: 8 },
      constitution: { gujName: "ભારતનું બંધારણ", totalTests: 10 }
    }
  },
  computer_gyan: {
    gujName: "કમ્પ્યુટર જ્ઞાન",
    iconImg: "assets/icon/computer.webp",
    iconEmoji: "💻",
    branches: {
      computer_intro: { gujName: "કમ્પ્યુટર પરિચય", totalTests: 5 },
      ms_office: { gujName: "એમ.એસ. ઓફિસ", totalTests: 6 }
    }
  },
  gujarati_vyakaran: {
    gujName: "ગુજરાતી વ્યાકરણ",
    iconImg: "assets/icon/gujarati.webp",
    iconEmoji: "✍️",
    branches: {
      grammar: { gujName: "જોડણી અને વ્યાકરણ", totalTests: 5 }
    }
  },
  english_grammar: {
    gujName: "અંગ્રેજી વ્યાકરણ",
    iconImg: "assets/icon/english.webp",
    iconEmoji: "🔤",
    branches: {
      tenses: { gujName: "Tenses & Grammar", totalTests: 5 }
    }
  },
  maths_reasoning: {
    gujName: "એપ્ટિટ્યુડ અને રીઝનીંગ",
    iconImg: "assets/icon/maths.webp",
    iconEmoji: "📐",
    branches: {
      maths_reasoning: { gujName: "ગણિત અને તાર્કિક કસોટી", totalTests: 5 }
    }
  },
  conductor_info: {
    gujName: "નિગમને લગતી માહિતી",
    iconImg: "assets/icon/bus.webp",
    iconEmoji: "🚌",
    branches: {
      conductor_duties: { gujName: "કંડક્ટર ફરજો અને ફર્સ્ટ એઇડ", totalTests: 5 }
    }
  },
  motor_vehicle_act: {
    gujName: "મોટર વ્હીકલ એક્ટ",
    iconImg: "assets/icon/act.webp",
    iconEmoji: "🚦",
    branches: {
      traffic_rules: { gujName: "ટ્રાફિક નિયમો અને એક્ટ", totalTests: 5 }
    }
  },
  road_safety: {
    gujName: "રોડ સેફ્ટી",
    iconImg: "assets/icon/road.webp",
    iconEmoji: "🛡️",
    branches: {
      road_safety: { gujName: "રોડ સેફ્ટી અને ઓટોમોબાઈલ", totalTests: 5 }
    }
  }
};

const syllabusSubjects = Object.keys(subjectData);

let currentSubject = "";
let currentBranch = "";
let currentType = "";
let isPremiumUser = (localStorage.getItem('gsrtc_is_premium') === 'true');
let isRestoring = false;

// --- SIDEBAR TOGGLE ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('show');
}

function changeScreenFromSidebar() {
    const screens = ["screen-subjects", "screen-branches", "screen-type-select", "screen-quiz-list"];
    const currentScreen = history.state ? history.state.activeScreen : "screen-subjects";
    const steps = screens.indexOf(currentScreen);

    if (steps > 0) {
        history.go(-steps);
    }
    toggleSidebar();
}

function changeScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    document.getElementById(screenId).classList.add("active");
    window.scrollTo(0, 0);

    if (!isRestoring) {
        history.pushState({
            activeScreen: screenId,
            subject: currentSubject,
            branch: currentBranch,
            type: currentType
        }, "");
    }
}

// --- DYNAMIC PROGRESS TRACKING ---
function getBranchProgress(subjectKey, branchKey, typeName) {
    let totalSum = 0;
    const totalTests = subjectData[subjectKey].branches[branchKey].totalTests;
    const branchGujName = subjectData[subjectKey].branches[branchKey].gujName;

    for (let i = 1; i <= totalTests; i++) {
        let storageKey = `${subjectKey}_${branchKey}_${typeName}_${i}_score`;
        totalSum += parseInt(localStorage.getItem(storageKey)) || 0;
    }
    return Math.round(totalSum / totalTests) || 0;
}

function getSubjectProgress(subjectKey) {
    let totalPercentageSum = 0;
    const branches = Object.keys(subjectData[subjectKey].branches);

    if (branches.length === 0) return 0;

    branches.forEach(branchKey => {
        let qProg = getBranchProgress(subjectKey, branchKey, 'Quiz');
        let mProg = getBranchProgress(subjectKey, branchKey, 'Mock Test');
        totalPercentageSum += ((qProg + mProg) / 2);
    });

    return Math.round(totalPercentageSum / branches.length) || 0;
}

function getOverallAppProgress() {
    let totalSum = 0;
    syllabusSubjects.forEach(subKey => { totalSum += getSubjectProgress(subKey); });
    return Math.round(totalSum / syllabusSubjects.length) || 0;
}

// Counts how many tests in this branch+type have a saved score of exactly 100%
function getCompletedTestCount(subjectKey, branchKey, typeName) {
    const totalTests = subjectData[subjectKey].branches[branchKey].totalTests;
    const branchGujName = subjectData[subjectKey].branches[branchKey].gujName;
    let completed = 0;

    for (let i = 1; i <= totalTests; i++) {
        let storageKey = `${subjectKey}_${branchKey}_${typeName}_${i}_score`;
        let saved = localStorage.getItem(storageKey);
        if (saved !== null && parseInt(saved) === 100) {
            completed++;
        }
    }
    return completed;
}

// Normalizes whatever format mock_test.html saved (e.g. "01:12", "01:12 Min", or raw seconds)
// into a consistent "MMm SSs" display, e.g. "01m 30s"
function formatTestTime(raw) {
    if (!raw) return '';
    let cleaned = raw.toString().replace(/[^0-9:]/g, '');
    let minutes = 0, seconds = 0;

    if (cleaned.includes(':')) {
        let parts = cleaned.split(':');
        minutes = parseInt(parts[0]) || 0;
        seconds = parseInt(parts[1]) || 0;
    } else {
        let totalSeconds = parseInt(cleaned) || 0;
        minutes = Math.floor(totalSeconds / 60);
        seconds = totalSeconds % 60;
    }

    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}m ${ss}s`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- SIDEBAR PROFILE RENDER ---
function updateProfileUI() {
    const profileArea = document.getElementById('profile-area');
    const userName = localStorage.getItem('gsrtc_logged_user');
    const overallProgress = getOverallAppProgress();

    if (userName) {
        let firstLetter = escapeHtml(userName.charAt(0));
        const safeName = escapeHtml(userName);
        profileArea.innerHTML = `
            <div class="profile-left">
                <div class="avatar">${firstLetter}</div>
                <div class="profile-info">
                    <div class="profile-name">${safeName}</div>
                    <div class="profile-status">${isPremiumUser ? '👑 Premium Account' : '📝 Free Account'}</div>
                </div>
            </div>
            <div class="ring ring-lg" style="--pct:${overallProgress};"><div class="ring-inner">${overallProgress}%</div></div>
        `;
    } else {
        profileArea.innerHTML = `
            <div class="profile-left" style="width:100%; justify-content:space-between;">
                <span style="font-size:0.9rem; color:#9ca3af;">તૈયારી ટ્રેક કરવા માટે:</span>
                <button class="btn" style="padding:6px 15px; font-size:0.85rem;" onclick="loginWithGoogle()">Login</button>
            </div>
        `;
    }
}

// --- SCREEN 1: SUBJECTS DISPLAY ---
function buildSubjectCards() {
    const container = document.getElementById('subjects-container');
    container.innerHTML = "";

    syllabusSubjects.forEach((subKey) => {
        let progress = getSubjectProgress(subKey);
        let subObj = subjectData[subKey];
        let gujSubjectName = subObj.gujName;
        let iconPath = subObj.iconImg || "";
        let fallbackEmoji = subObj.iconEmoji || "📚";

        const card = document.createElement('div');
        card.className = "card";
        card.onclick = () => goToBranchSelect(subKey);

        card.innerHTML = `
            <div class="card-left">
                <div class="card-icon-box">
                    <span class="fallback-emoji" id="emoji-${subKey}">${fallbackEmoji}</span>
                    ${iconPath ? `
                        <img src="${iconPath}"
                             alt="${gujSubjectName}"
                             class="card-img-icon"
                             onload="document.getElementById('emoji-${subKey}').style.display='none'"
                             onerror="this.style.display='none'; document.getElementById('emoji-${subKey}').style.display='inline'">
                    ` : ''}
                </div>
                <span class="card-title">${gujSubjectName}</span>
            </div>
            <div class="ring" style="--pct:${progress};"><div class="ring-inner">${progress}%</div></div>
        `;
        container.appendChild(card);
    });
}

// --- SCREEN 2: BRANCH/CHAPTERS GRID GENERATOR ---
function goToBranchSelect(subjectKey) {
    currentSubject = subjectKey;

    let cleanSubjectName = subjectData[subjectKey].gujName;
    const titleElem = document.getElementById('current-subject-title-branch');
    if (titleElem) titleElem.innerText = cleanSubjectName;

    const branches = Object.keys(subjectData[subjectKey].branches);
    const totalChapters = branches.length;
    let completedChapters = 0;

    const container = document.getElementById('branches-container');
    container.innerHTML = "";

    branches.forEach((branchKey, index) => {
        let qProg = getBranchProgress(subjectKey, branchKey, 'Quiz');
        let mProg = getBranchProgress(subjectKey, branchKey, 'Mock Test');
        let branchProgress = Math.round((qProg + mProg) / 2) || 0;

        if (branchProgress >= 100) {
            completedChapters++;
        }

        let cleanBranchName = subjectData[subjectKey].branches[branchKey].gujName;

        const card = document.createElement('div');
        card.className = "card";
        card.onclick = () => goToTypeSelect(branchKey);
        card.innerHTML = `
            <div style="flex:1;">
                <div class="card-title">${index + 1}. ${cleanBranchName}</div>
                <div class="branch-bar-track"><div class="branch-bar-fill" style="width:${branchProgress}%;"></div></div>
                <span class="sub-perc-badge">Progress: ${branchProgress}%</span>
            </div>
            <span class="card-arrow">➔</span>
        `;
        container.appendChild(card);
    });

    let subjectOverallProgress = getSubjectProgress(subjectKey);

    const totalElem = document.getElementById('stat-total-chapters');
    const compElem = document.getElementById('stat-completed-chapters');
    const progElem = document.getElementById('stat-progress-perc');

    if (totalElem) totalElem.innerText = totalChapters;
    if (compElem) compElem.innerText = completedChapters;
    if (progElem) progElem.innerText = `${subjectOverallProgress}%`;

    if (!isRestoring) {
      sessionStorage.setItem('last_active_subject', currentSubject);
    }
    changeScreen('screen-branches');
}

// --- SCREEN 3: TYPE SELECT ---
function goToTypeSelect(branchKey) {
    currentBranch = branchKey;

    let cleanBranchName = subjectData[currentSubject].branches[branchKey].gujName;
    document.getElementById('current-subject-name').innerText = cleanBranchName;

    let quizProg = getBranchProgress(currentSubject, branchKey, 'Quiz');
    let mockProg = getBranchProgress(currentSubject, branchKey, 'Mock Test');

    document.getElementById('quiz-type-perc').innerText = `Progress: ${quizProg}%`;
    document.getElementById('mock-type-perc').innerText = `Progress: ${mockProg}%`;

    if (!isRestoring) {
      sessionStorage.setItem('last_active_branch', currentBranch);
    }
    changeScreen('screen-type-select');
}

// --- SCREEN 4: QUIZ LIST ---
function goToQuizList(type) {
    currentType = type;

    let cleanBranchName = subjectData[currentSubject].branches[currentBranch].gujName;
    document.getElementById('current-list-title').innerText = `${cleanBranchName} - ${type}`;
    if (!isRestoring) {
      sessionStorage.setItem('last_active_type', currentType);
    }
    buildQuizRows();
    changeScreen('screen-quiz-list');
}

// --- SCREEN 4: QUIZ LIST CARDS + HEADER STATS ---
function buildQuizRows() {
    const container = document.getElementById('dynamic-list-container');
    container.innerHTML = "";

    const totalTests = subjectData[currentSubject].branches[currentBranch].totalTests;
    const branchGujName = subjectData[currentSubject].branches[currentBranch].gujName;

    for (let i = 1; i <= totalTests; i++) {
        let isLocked = (i > 3 && !isPremiumUser);
        let scoreKey = `${currentSubject}_${currentBranch}_${currentType}_${i}_score`;
        let timeKey = `${currentSubject}_${currentBranch}_${currentType}_${i}_time`;
        let savedScore = localStorage.getItem(scoreKey);
        let savedTime = localStorage.getItem(timeKey);

        let isAttempted = savedScore !== null;
        let scoreValue = isAttempted ? parseInt(savedScore) : 0;

        const row = document.createElement('div');
        row.className = `quiz-row-card ${isLocked ? 'locked' : ''}`;

        const testDisplayName = `${currentType} ${i}`;

        row.innerHTML = `
            <div class="quiz-card-left">
                <div class="quiz-status-icon ${isLocked ? 'lock-bg' : (isAttempted ? 'done-bg' : 'start-bg')}">
                    ${isLocked ? '🔒' : (isAttempted ? '✓' : '⚡')}
                </div>
                <div class="quiz-card-info">
                    <div class="quiz-card-title">${testDisplayName}</div>

                    ${isLocked
                        ? '<span class="status-tag lock-tag">પ્રીમિયમ ટેસ્ટ</span>'
                        : (isAttempted
                            ? `<div class="stats-pill-group">
                                <span class="score-pill-clean">🏆 ${scoreValue}%</span>
                                ${savedTime ? `<span class="time-pill-clean">⏱️ ${formatTestTime(savedTime)}</span>` : ''}
                               </div>`
                            : '<span class="unattempted-tag">હજુ સુધી ટેસ્ટ આપ્યો નથી</span>'
                          )
                    }
                </div>
            </div>

            <div class="quiz-card-right">
                <button type="button" class="quiz-action-btn ${isLocked ? 'btn-lock' : (isAttempted ? 'btn-retest' : 'btn-play')}">
                    ${isLocked ? 'Unlock →' : (isAttempted ? 'Retest →' : 'Start →')}
                </button>
            </div>
        `;

        row.onclick = function() {
            if (isLocked) {
                if (!localStorage.getItem('gsrtc_logged_user')) {
                    alert("🔒 આગળના પ્રીમિયમ ટેસ્ટ માટે કૃપા કરીને પહેલા Google વડે લોગિન કરો.");
                    loginWithGoogle();
                } else {
                    openPaywall();
                }
            } else {
                localStorage.setItem('last_active_subject', currentSubject);
                localStorage.setItem('last_active_branch', currentBranch);
                localStorage.setItem('last_active_type', currentType);
                localStorage.setItem('last_active_branch_guj', branchGujName);
                localStorage.setItem('last_active_quiz_no', i);
                // 🎯 TYPE CHECKER LOGIC:
              if (currentType === 'Quiz') {
                window.location.href = `quiz_player.html`;
              } else {
                window.location.href = `mock_test.html`;
              }
            }
        };
        container.appendChild(row);
    }

    // Header stats: total tests, tests completed at 100%, and overall progress
    // (same average-score math used for the Quiz/Mock Test badges on Screen 3)
    const completedTests = getCompletedTestCount(currentSubject, currentBranch, currentType);
    const listProgress = getBranchProgress(currentSubject, currentBranch, currentType);

    const totalElem = document.getElementById('stat-total-tests');
    const compElem = document.getElementById('stat-completed-tests');
    const progElem = document.getElementById('stat-list-progress-perc');

    if (totalElem) totalElem.innerText = totalTests;
    if (compElem) compElem.innerText = completedTests;
    if (progElem) progElem.innerText = `${listProgress}%`;
}

// --- AUTH & PAYMENT LOGIC ---
function loginWithGoogle() {
    const dummyName = "રાહુલ કુમાર";
    localStorage.setItem('gsrtc_logged_user', dummyName);
    updateProfileUI();
    buildSubjectCards();
    alert("લોગિન સફળ રહ્યું!");
}

function openPaywall() { document.getElementById('paywall-modal').style.display = 'flex'; }
function closePaywall() { document.getElementById('paywall-modal').style.display = 'none'; }

function simulatePayment() {
    isPremiumUser = true;
    localStorage.setItem('gsrtc_is_premium', 'true');
    closePaywall();
    updateProfileUI();
    buildSubjectCards();
    if (currentType) buildQuizRows();
    alert("પેમેન્ટ સફળ રહ્યું! બધા લોક ખુલી ગયા છે.");
}

// --- DASHBOARD INIT & HISTORY ---
function initDashboard() {
    updateProfileUI();
    buildSubjectCards();

    const state = history.state;
    if (!state || state.activeScreen === "screen-subjects") return;

    isRestoring = true;

    if (state.activeScreen === "screen-branches") {
        goToBranchSelect(state.subject);
    }
    else if (state.activeScreen === "screen-type-select") {
        goToBranchSelect(state.subject);
        goToTypeSelect(state.branch);
    }
    else if (state.activeScreen === "screen-quiz-list") {
        goToBranchSelect(state.subject);
        goToTypeSelect(state.branch);
        goToQuizList(state.type);
    }

    isRestoring = false;
}

window.onpopstate = function () {
    const lastScreen = history.state?.activeScreen;
    if (!lastScreen) return;

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    document.getElementById(lastScreen).classList.add("active");
    window.scrollTo(0, 0);
};

function isBackForwardNavigation(event) {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav && nav.type === "back_forward") return true;
    if (event.persisted) return true;
    if (window.performance && window.performance.navigation && window.performance.navigation.type === 2) return true;
    return false;
}

window.onload = function(event) {
    if (!history.state) {
        history.replaceState({ activeScreen: "screen-subjects" }, "");
    }
    initDashboard();
};

window.onpageshow = function(event) {
    if (isBackForwardNavigation(event)) {
        initDashboard();
    }
};
