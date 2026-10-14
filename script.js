// ---------- Storage ----------
const ENTRIES_KEY = "fittrack-entries";
const GOAL_KEY = "fittrack-goal";

let entries = JSON.parse(localStorage.getItem(ENTRIES_KEY)) || [];
let goal = Number(localStorage.getItem(GOAL_KEY)) || 150;
let chart;

function save() {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  localStorage.setItem(GOAL_KEY, goal);
}

// ---------- Helpers ----------
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toISO(d));
  }
  return days;
}

// ---------- Elements ----------
const form = document.getElementById("workout-form");
const dateInput = document.getElementById("date");
const goalInput = document.getElementById("goal");
const tbody = document.querySelector("#history tbody");

dateInput.value = toISO(new Date());
goalInput.value = goal;

// ---------- Events ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  entries.push({
    id: Date.now(),
    date: dateInput.value,
    exercise: document.getElementById("exercise").value,
    duration: Number(document.getElementById("duration").value),
    calories: Number(document.getElementById("calories").value),
  });
  save();
  form.reset();
  dateInput.value = toISO(new Date());
  render();
});

goalInput.addEventListener("change", () => {
  goal = Math.max(1, Number(goalInput.value) || 150);
  save();
  render();
});

function deleteEntry(id) {
  entries = entries.filter((e) => e.id !== id);
  save();
  render();
}

// ---------- Render ----------
function renderHistory() {
  tbody.innerHTML = "";
  document.getElementById("empty").style.display = entries.length ? "none" : "block";
  document.getElementById("history").style.display = entries.length ? "table" : "none";

  [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .forEach((entry) => {
      const tr = document.createElement("tr");
      [entry.date, entry.exercise, entry.duration, entry.calories].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = value; // textContent avoids injecting HTML
        tr.appendChild(td);
      });
      const td = document.createElement("td");
      const btn = document.createElement("button");
      btn.className = "delete";
      btn.textContent = "✕";
      btn.title = "Delete";
      btn.addEventListener("click", () => deleteEntry(entry.id));
      td.appendChild(btn);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
}

function renderSummary() {
  const week = lastNDays(7);
  const weekEntries = entries.filter((e) => week.includes(e.date));

  const totalMin = weekEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalCal = weekEntries.reduce((sum, e) => sum + e.calories, 0);

  document.getElementById("total-min").textContent = totalMin;
  document.getElementById("total-cal").textContent = totalCal;
  document.getElementById("total-workouts").textContent = weekEntries.length;

  // Streak: consecutive days with a workout, counting back from today
  const days = new Set(entries.map((e) => e.date));
  let streak = 0;
  const day = new Date();
  while (days.has(toISO(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  document.getElementById("streak").textContent = streak;

  // Goal progress
  const percent = Math.min(100, Math.round((totalMin / goal) * 100));
  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("goal-text").textContent =
    totalMin >= goal
      ? `🎉 Goal reached! ${totalMin} / ${goal} minutes`
      : `${totalMin} / ${goal} minutes (${percent}%)`;
}

function renderChart() {
  const days = lastNDays(7);
  const minutes = days.map((d) =>
    entries.filter((e) => e.date === d).reduce((sum, e) => sum + e.duration, 0)
  );
  const labels = days.map((d) => d.slice(5)); // MM-DD

  if (chart) chart.destroy();
  chart = new Chart(document.getElementById("chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Workout minutes", data: minutes, backgroundColor: "#16a34a" }],
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } },
    },
  });
}

function render() {
  renderHistory();
  renderSummary();
  renderChart();
}

render();
