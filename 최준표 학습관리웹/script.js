/*
  script.js
  학습 관리 웹사이트 메인 로직
  작성자: Antigravity AI
*/

// --- DOM 요소 캐싱 ---
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentText = document.getElementById('progress-percent');
const todoListEl = document.getElementById('todo-list');

// 모달 관련 요소
const planModal = document.getElementById('plan-modal');
const closeModalBtn = document.getElementById('close-modal');
const planForm = document.getElementById('plan-form');
const planSubjectInput = document.getElementById('plan-subject');
const planNameInput = document.getElementById('plan-name');
const planUnitInput = document.getElementById('plan-unit');
const planDetailInput = document.getElementById('plan-detail');
const modalTitle = document.getElementById('modal-title');
const subjectBtns = document.querySelectorAll('.subject-btn');

// 타이머 관련 요소
const timerTabs = document.querySelectorAll('.timer-tab');
const timeDisplay = document.getElementById('time-display');
const timerStartBtn = document.getElementById('timer-start');
const timerResetBtn = document.getElementById('timer-reset');

// 룰렛 관련 요소
const rouletteBtn = document.getElementById('roulette-btn');
const rouletteResult = document.getElementById('roulette-result');

// --- 전역 상태 변수 ---
let todos = []; // 할 일 목록 배열
let timerInterval = null;
let timerTime = 25 * 60; // 기본값 25분 (초 단위)
let isTimerRunning = false;
let currentTimerType = 'pomodoro'; // 'pomodoro' 또는 'stopwatch'

const SUBJECT_NAMES = {
    'korean': '국어',
    'english': '영어',
    'math': '수학',
    'others': '기타'
};

// --- 초기화 (Initialization) ---
function init() {
    loadTheme();
    loadTodos();
    renderTodos();
    updateProgress();
    setupEventListeners();
    updateTimerDisplay();
}

// --- 1. 테마 관리 (Theme Management) ---
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        body.classList.replace('light-mode', 'dark-mode');
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
    }
}

function toggleTheme() {
    if (body.classList.contains('light-mode')) {
        body.classList.replace('light-mode', 'dark-mode');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
    } else {
        body.classList.replace('dark-mode', 'light-mode');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
    }
}

// --- 2. 할 일 관리 (Todo Management) ---
function loadTodos() {
    const savedTodos = localStorage.getItem('studyTodos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
}

function saveTodos() {
    localStorage.setItem('studyTodos', JSON.stringify(todos));
}

function renderTodos() {
    todoListEl.innerHTML = '';
    
    if (todos.length === 0) {
        todoListEl.innerHTML = '<div class="empty-state">아직 추가된 계획이 없습니다. 상단의 과목 버튼을 눌러 계획을 추가해보세요!</div>';
        return;
    }

    todos.forEach((todo) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.subject} ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo('${todo.id}')">
            <div class="todo-content">
                <span class="todo-unit">${SUBJECT_NAMES[todo.subject]} | ${todo.unit}</span>
                <span class="todo-title">${todo.name}</span>
                ${todo.detail ? `<span class="todo-detail">${todo.detail}</span>` : ''}
            </div>
            <button class="delete-btn" onclick="deleteTodo('${todo.id}')" aria-label="삭제">
                <span class="material-symbols-rounded">delete</span>
            </button>
        `;
        todoListEl.appendChild(li);
    });
}

// 전역 함수로 노출하여 HTML 인라인 이벤트에서 호출 가능하게 함
window.toggleTodo = function(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateProgress();
    }
}

window.deleteTodo = function(id) {
    if(confirm('정말 삭제하시겠습니까?')) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        updateProgress();
    }
}

function updateProgress() {
    if (todos.length === 0) {
        progressBarFill.style.width = '0%';
        progressPercentText.textContent = '0%';
        return;
    }

    const completedCount = todos.filter(t => t.completed).length;
    const percent = Math.round((completedCount / todos.length) * 100);
    
    progressBarFill.style.width = `${percent}%`;
    progressPercentText.textContent = `${percent}%`;
}

// --- 3. 모달 제어 (Modal Control) ---
function openModal(subject) {
    planSubjectInput.value = subject;
    modalTitle.textContent = `${SUBJECT_NAMES[subject]} 계획 추가`;
    
    // 폼 초기화
    planNameInput.value = '';
    planUnitInput.value = '';
    planDetailInput.value = '';
    
    planModal.classList.remove('hidden');
    planNameInput.focus();
}

function closeModal() {
    planModal.classList.add('hidden');
}

// --- 4. 타이머 제어 (Timer Logic) ---
function updateTimerDisplay() {
    const minutes = Math.floor(timerTime / 60);
    const seconds = timerTime % 60;
    timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timerStartBtn.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>계속';
        timerStartBtn.classList.replace('secondary-btn', 'primary-btn'); // 색상 변경
    } else {
        isTimerRunning = true;
        timerStartBtn.innerHTML = '<span class="material-symbols-rounded">pause</span>일시정지';
        
        timerInterval = setInterval(() => {
            if (currentTimerType === 'pomodoro') {
                if (timerTime > 0) {
                    timerTime--;
                } else {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    alert('뽀모도로 세션 종료! 5분간 휴식하세요.');
                    resetTimer();
                }
            } else { // 스톱워치
                timerTime++;
            }
            updateTimerDisplay();
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    timerStartBtn.innerHTML = '<span class="material-symbols-rounded">play_arrow</span>시작';
    
    if (currentTimerType === 'pomodoro') {
        timerTime = 25 * 60;
    } else {
        timerTime = 0;
    }
    updateTimerDisplay();
}

function switchTimerTab(type) {
    if (isTimerRunning) {
        if(!confirm('타이머가 실행 중입니다. 전환하시겠습니까? (기록은 초기화됩니다)')) return;
    }
    
    currentTimerType = type;
    
    // 탭 UI 업데이트
    timerTabs.forEach(tab => {
        if(tab.dataset.type === type) tab.classList.add('active');
        else tab.classList.remove('active');
    });

    resetTimer();
}

// --- 5. 룰렛 (Subject Roulette) ---
function spinRoulette() {
    const incompleteTodos = todos.filter(t => !t.completed);
    
    if (incompleteTodos.length === 0) {
        rouletteResult.innerHTML = '<span>🎉 모든 할 일을 완료했습니다!</span>';
        return;
    }

    // 애니메이션 시작
    rouletteResult.classList.add('spinning');
    rouletteBtn.disabled = true;
    
    let counter = 0;
    const spinInterval = setInterval(() => {
        const randomTodo = incompleteTodos[Math.floor(Math.random() * incompleteTodos.length)];
        rouletteResult.innerHTML = `<span style="color: var(--${randomTodo.subject}-color)">${SUBJECT_NAMES[randomTodo.subject]}</span><br><span style="font-size:1rem">${randomTodo.name}</span>`;
        counter++;
        
        if (counter > 20) { // 20번 깜빡인 후 정지 (약 1초)
            clearInterval(spinInterval);
            rouletteResult.classList.remove('spinning');
            rouletteBtn.disabled = false;
            
            // 최종 결과
            const finalTodo = incompleteTodos[Math.floor(Math.random() * incompleteTodos.length)];
            rouletteResult.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem;">
                    <span style="font-size:1rem; color:var(--text-secondary)">지금 당장 할 일:</span>
                    <strong style="color: var(--${finalTodo.subject}-color); font-size:1.8rem;">${SUBJECT_NAMES[finalTodo.subject]}</strong>
                    <span style="font-size:1.1rem">${finalTodo.name}</span>
                </div>
            `;
        }
    }, 50); // 50ms 간격으로 빠르게 바뀜
}

// --- 이벤트 리스너 설정 ---
function setupEventListeners() {
    // 테마 토글
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // 과목 버튼 클릭 -> 모달 오픈
    subjectBtns.forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.subject));
    });

    // 모달 닫기
    closeModalBtn.addEventListener('click', closeModal);
    planModal.addEventListener('click', (e) => {
        if(e.target === planModal) closeModal(); // 배경 클릭 시 닫기
    });

    // 폼 제출 (할 일 추가)
    planForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newTodo = {
            id: 'todo_' + Date.now(),
            subject: planSubjectInput.value,
            name: planNameInput.value.trim(),
            unit: planUnitInput.value.trim(),
            detail: planDetailInput.value.trim(),
            completed: false
        };

        todos.push(newTodo);
        saveTodos();
        renderTodos();
        updateProgress();
        closeModal();
    });

    // 타이머 컨트롤
    timerStartBtn.addEventListener('click', toggleTimer);
    timerResetBtn.addEventListener('click', resetTimer);
    
    // 타이머 탭 전환
    timerTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTimerTab(tab.dataset.type));
    });

    // 룰렛 버튼
    rouletteBtn.addEventListener('click', spinRoulette);
}

// --- 앱 시작 ---
document.addEventListener('DOMContentLoaded', init);
