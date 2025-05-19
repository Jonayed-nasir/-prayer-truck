// Prayer data
const prayers = [
  { id: 'fajr', name: 'ফজর', time: 'ভোর' },
  { id: 'dhuhr', name: 'যোহর', time: 'দুপুর' },
  { id: 'asr', name: 'আসর', time: 'বিকাল' },
  { id: 'maghrib', name: 'মাগরিব', time: 'সন্ধ্যা' },
  { id: 'isha', name: 'ইশা', time: 'রাত' },
];

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Load prayer data from localStorage
function loadPrayerData() {
  const currentDate = getCurrentDate();
  const savedData = localStorage.getItem('prayerTracker');

  if (savedData) {
    const parsedData = JSON.parse(savedData);

    // Check if data is for today
    if (parsedData.date === currentDate) {
      return parsedData.prayers;
    }
  }

  // Return default (all unchecked) if no saved data or not today's data
  return prayers.map((prayer) => ({ ...prayer, completed: false }));
}

// Save prayer data to localStorage
function savePrayerData(prayerData) {
  const dataToSave = {
    date: getCurrentDate(),
    prayers: prayerData,
  };
  localStorage.setItem('prayerTracker', JSON.stringify(dataToSave));
}

// Update progress bar
function updateProgressBar(prayerData) {
  const completedCount = prayerData.filter((p) => p.completed).length;
  const total = prayerData.length;
  const percentage = (completedCount / total) * 100;

  const progressBar = document.getElementById('progress-bar');
  progressBar.style.width = `${percentage}%`;

  // Change color based on progress
  if (percentage < 30) {
    progressBar.style.backgroundColor = '#e74c3c';
  } else if (percentage < 70) {
    progressBar.style.backgroundColor = '#f39c12';
  } else {
    progressBar.style.backgroundColor = '#2ecc71';
  }
}

// Render prayer cards
function renderPrayerCards() {
  const prayerData = loadPrayerData();
  const container = document.getElementById('prayer-times');

  container.innerHTML = '';

  prayerData.forEach((prayer) => {
    const card = document.createElement('div');
    card.className = `prayer-card ${prayer.completed ? 'completed' : ''}`;
    card.id = `prayer-${prayer.id}`;
    card.innerHTML = `
                    <div class="prayer-name">${prayer.name}</div>
                    <div class="prayer-time">${prayer.time}</div>
                    <div>${prayer.completed ? '✔ সম্পূর্ণ' : '✖ বাকি'}</div>
                `;

    card.addEventListener('click', () => {
      prayer.completed = !prayer.completed;
      card.classList.toggle('completed');
      savePrayerData(prayerData);
      updateProgressBar(prayerData);
      renderPrayerCards(); // Re-render to update all cards
    });

    container.appendChild(card);
  });

  updateProgressBar(prayerData);
}

// Display current date
function displayCurrentDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const dateStr = now.toLocaleDateString('bn-BD', options);
  document.getElementById('current-date').textContent = dateStr;
}

// Reset today's prayers
document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('আপনি কি আজকের সব নামাজের তথ্য রিসেট করতে চান?')) {
    const resetData = prayers.map((prayer) => ({
      ...prayer,
      completed: false,
    }));
    savePrayerData(resetData);
    renderPrayerCards();
  }
});

// Initialize app
function init() {
  displayCurrentDate();
  renderPrayerCards();
}

// Run the app
init();

function savePrayerData(prayerData) {
  const currentDate = getCurrentDate();
  const allData = JSON.parse(localStorage.getItem('allPrayerData') || '{}');

  allData[currentDate] = {
    date: currentDate,
    prayers: prayerData,
  };

  localStorage.setItem('allPrayerData', JSON.stringify(allData));
}

function loadPrayerData() {
  const currentDate = getCurrentDate();
  const allData = JSON.parse(localStorage.getItem('allPrayerData')) || '{}';

  if (allData[currentDate]) {
    return allData[currentDate].prayers;
  }

  return prayers.map((prayer) => ({ ...prayer, completed: false }));
}

// তারিখ পরিবর্তন ফাংশন
function changeDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// গতকালের ডেটা দেখার বাটন
document.getElementById('prev-day-btn').addEventListener('click', () => {
  const prevDate = changeDate(-1);
  const allData = JSON.parse(localStorage.getItem('allPrayerData') || '{}');

  if (allData[prevDate]) {
    alert(
      `গতকাল ${prevDate} আপনি ${
        allData[prevDate].prayers.filter((p) => p.completed).length
      }টি নামাজ পড়েছিলেন`
    );
  } else {
    alert('গতকালের কোনো ডেটা নেই');
  }
});
