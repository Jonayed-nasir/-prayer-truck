// Prayer data
const prayers = [
  { id: 'fajr', name: 'ফজর', time: 'ভোর' },
  { id: 'dhuhr', name: 'যোহর', time: 'দুপুর' },
  { id: 'asr', name: 'আসর', time: 'বিকাল' },
  { id: 'maghrib', name: 'মাগরিব', time: 'সন্ধ্যা' },
  { id: 'isha', name: 'ইশা', time: 'রাত' },
];

// Database variables
let db;
const dbName = 'PrayerTrackerDB';
const storeName = 'prayerRecords';

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'date' });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get formatted date for display
function getFormattedDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('bn-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Load prayer data from IndexedDB
async function loadPrayerData(date) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(date);

    request.onsuccess = (event) => {
      if (event.target.result) {
        resolve(event.target.result.prayers);
      } else {
        // Return default (all unchecked) if no data for this date
        resolve(prayers.map((prayer) => ({ ...prayer, completed: false })));
      }
    };

    request.onerror = (event) => {
      console.error('Error loading data:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Save prayer data to IndexedDB
async function savePrayerData(date, prayerData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const record = { date, prayers: prayerData };
    const request = store.put(record);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error saving data:', event.target.error);
      reject(event.target.error);
    };
  });
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
async function renderPrayerCards() {
  const currentDate = getCurrentDate();
  const prayerData = await loadPrayerData(currentDate);
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

    card.addEventListener('click', async () => {
      prayer.completed = !prayer.completed;
      card.classList.toggle('completed');
      await savePrayerData(currentDate, prayerData);
      updateProgressBar(prayerData);
    });

    container.appendChild(card);
  });

  updateProgressBar(prayerData);
  document.getElementById('current-date').textContent =
    getFormattedDate(currentDate);
}

// Load all history data
async function loadAllHistory() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      console.error('Error loading history:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Show history
async function showHistory() {
  const historyContainer = document.getElementById('history-container');
  const historyList = document.getElementById('history-list');

  const allData = await loadAllHistory();
  allData.sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending

  historyList.innerHTML = '';

  if (allData.length === 0) {
    historyList.innerHTML = '<p>কোনো ইতিহাস পাওয়া যায়নি</p>';
  } else {
    allData.forEach((record) => {
      const completedCount = record.prayers.filter((p) => p.completed).length;
      const total = record.prayers.length;

      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.innerHTML = `
                        <h3>${getFormattedDate(record.date)}</h3>
                        <p>পড়া নামাজ: ${completedCount}/${total}</p>
                        <p>${((completedCount / total) * 100).toFixed(
                          0
                        )}% সম্পূর্ণ</p>
                    `;

      historyList.appendChild(historyItem);
    });
  }

  // Show history and hide main content
  document.getElementById('prayer-times').style.display = 'none';
  document.getElementById('progress-bar').parentElement.style.display = 'none';
  document.getElementById('current-date').style.display = 'none';
  document.getElementById('reset-btn').style.display = 'none';
  document.getElementById('history-btn').style.display = 'none';
  document.getElementById('back-btn').style.display = 'inline-block';
  historyContainer.style.display = 'block';
}

// Show main content
function showMainContent() {
  document.getElementById('prayer-times').style.display = 'grid';
  document.getElementById('progress-bar').parentElement.style.display = 'block';
  document.getElementById('current-date').style.display = 'block';
  document.getElementById('reset-btn').style.display = 'inline-block';
  document.getElementById('history-btn').style.display = 'inline-block';
  document.getElementById('back-btn').style.display = 'none';
  document.getElementById('history-container').style.display = 'none';
}

// Initialize app
async function init() {
  try {
    await initDB();
    await renderPrayerCards();

    // Event listeners
    document.getElementById('reset-btn').addEventListener('click', async () => {
      if (confirm('আপনি কি আজকের সব নামাজের তথ্য রিসেট করতে চান?')) {
        const currentDate = getCurrentDate();
        const resetData = prayers.map((prayer) => ({
          ...prayer,
          completed: false,
        }));
        await savePrayerData(currentDate, resetData);
        await renderPrayerCards();
      }
    });

    document
      .getElementById('history-btn')
      .addEventListener('click', showHistory);
    document
      .getElementById('back-btn')
      .addEventListener('click', showMainContent);
  } catch (error) {
    console.error('Initialization error:', error);
    alert(
      'অ্যাপ্লিকেশন লোড করতে সমস্যা হয়েছে। দয়া করে পৃষ্ঠাটি রিফ্রেশ করুন।'
    );
  }
}

// Run the app
window.onload = init;
