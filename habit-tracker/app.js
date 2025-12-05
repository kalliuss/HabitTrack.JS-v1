// 1- bugünün tarihini yazdır
const TODAY = new Date().toISOString().slice(0, 10); 
const todayEl = document.getElementById("today");

function formatToday() {
    const now = new Date();
    const options = { weekday: 'long', day : "2-digit", month : "2-digit", year : "numeric" };
    // örn: Cuma, 05.12.2025
    return now.toLocaleDateString('tr-TR', options);
}

todayEl.textContent = formatToday();


// 2 temel date modeli

const STORAGE_KEY = "habit-tracker-habits";
const THEME_KEY = "habit-tracker-theme";

let habits = [];

function loadHabits() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];
    try {
        return JSON.parse(raw);
    }catch (err) {
        console.error("LocalStorage parse hataso:", err);
        return [];
    }
}

function saveHabits() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light-theme");
    } else {
        document.body.classList.remove("light-theme");
    }
}

// 3 Dom referansları 

const habitForm = document.getElementById("habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitListEl = document.getElementById("habit-list");

// toplam tamamlanan gün sayısı

function getTotalCompleted(habit) {
    return Object.keys(habit.history).length;
}

// 7 gün başarı yüzdesi

function getWeeklySuccess(habit) {
    const today = new Date(TODAY);
    let completed = 0;

    for (let i = 0; i < 7; i++) {
        const day = new Date(today);
        day.setDate(day.getDate() - i);

        const key = day.toISOString().slice(0, 10); // yyyy-mm-dd
        if(habit.history[key]) completed ++;
    }

    return Math.round((completed / 7) * 100);
}

// streak 

function getStreak(habit) {
    let streak = 0;
    const today = new Date(TODAY);

    for (let i =0; i < 30; i++){
        const day = new Date (today);
        day.setDate(day.getDate() - i);
        
        const key = day.toISOString().slice(0,10); // yyyy-mm-dd

        if(habit.history[key]){
            streak ++;
        }else{
            break; // ilk eksik günde kır
        }
    }

    return streak;
}

//silme 
function deleteHabit(habitId) {
  habits = habits.filter(h => h.id !== habitId);
  saveHabits();
  renderHabits();
}

// 4 Render Fonksiyonu

function renderHabits() {
    habitListEl.innerHTML = ""; // önce temizledik

    if (habits.length === 0) {
        habitListEl.innerHTML = `<p style="font-size:0.85rem; color:#6b7280;">Henüz bir alışkanlık eklenmedi.</p>`;
        return;
    }

    habits.forEach((habit) => {
        const card = document.createElement("article");
        card.className = "habit-card";

        card.innerHTML = `
        <div class="habit-main">
            <h3>${habit.name}</h3>
            <p>Başlangıç: ${habit.createdAt}</p>

            <p style="font-size:0.8rem; color:#38bdf8;">
            Streak: ${getStreak(habit)} gün • 
            %${getWeeklySuccess(habit)} başarı • 
            Toplam: ${getTotalCompleted(habit)} gün
            </p>

            <!-- Progress Bar -->
            <div class="progress-container">
            <div class="progress-bar" style="width: ${getWeeklySuccess(habit)}%;"></div>
            </div>
        </div>

        <div class="habit-actions">
            <button class="habit-complete-btn" data-id="${habit.id}">
            Bugün ✓
            </button>

            <button class="habit-delete-btn" data-id="${habit.id}">
            ❌
            </button>
        </div>
        `;

        const deleteBtn = card.querySelector(".habit-delete-btn");

        deleteBtn.addEventListener("click", () => {
        const ok = confirm("Bu alışkanlığı silmek istediğinize emin misiniz?");
        if (!ok) return;

        deleteHabit(habit.id);
        });

        habitListEl.appendChild(card);

         // Butonlara tıklama event’i
        const completeBtn = card.querySelector(".habit-complete-btn");

        // Eğer bugün tamamlandıysa butonu yeşil göster
        if (habit.history[TODAY]) {
        completeBtn.classList.add("completed");
        completeBtn.textContent = "Tamamlandı ✓";
        }

        completeBtn.addEventListener("click", () => {
        toggleHabitComplete(habit.id);
        });
    });
}



// 5 Yeni alışkanlık ekleme 

habitForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = habitNameInput.value.trim();

    if (!name) return;

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const newHabit = {
        id: Date.now(),
        name,
        history: {},
        createdAt: today
    };

    habits.push(newHabit);
    saveHabits();
    renderHabits();

    habitNameInput.value = "";

});

// 6 sayfa yüklenince veeriyi yükle

document.addEventListener("DOMContentLoaded",() => {
    habits = loadHabits();
    renderHabits();

    // 2 tema yükleme

    let currentTheme = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(currentTheme);

    // 3 tema butonunu se.

    const themeToggleBtn = document.getElementById("theme-toggle");

    // buton ikonunu güncelle

    function updateThemeIcon() {
        if(!themeToggleBtn) return;
        themeToggleBtn.textContent = currentTheme === "dark" ? "🌞" : "🌙";
    }

    updateThemeIcon();

    //4 butona tıklayınca tema değiştşir.

    if(themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            currentTheme = currentTheme === "dark" ? "light" : "dark";
            applyTheme(currentTheme);
            localStorage.setItem(THEME_KEY, currentTheme);
            updateThemeIcon();
        });
    }
});

// 7 toggleHabitComplete fonksiyonu

function toggleHabitComplete(habitId) {
    const habit = habits.find(h => h.id === habitId);

    if(!habit) return;

    // bugün tamamlanma durumu 

    const isCompleted = habit.history[TODAY];

    // eğer daha önce işaretlenmemişse true yap

    if(!isCompleted) {
        habit.history[TODAY] = true;
    }else{
        delete habit.history[TODAY];
    }

    saveHabits();
    renderHabits();
}
