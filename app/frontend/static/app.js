const form = document.querySelector("#chat-form");
const input = document.querySelector("#message-input");
const messages = document.querySelector("#chat-messages");
const sendButton = document.querySelector("#send-button");
const sendLabel = document.querySelector("#send-label");
const sendIcon = document.querySelector("#send-icon");
const sendSpinner = document.querySelector("#send-spinner");
const charCount = document.querySelector("#char-count");

const labelNames = {
  sadness: "Sadness",
  joy: "Joy",
  love: "Love",
  anger: "Anger",
  fear: "Fear",
  surprise: "Surprise",
};

function scrollChatToBottom() {
  messages.scrollTop = messages.scrollHeight;
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  charCount.textContent = `${input.value.length} / 4000`;
}

function createAssistantAvatar() {
  const avatar = document.createElement("div");
  avatar.className = "assistant-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="none"><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="M9 3v4m6-4v4m-6 10v4m6-4v4M3 9h4m-4 6h4m10-6h4m-4 6h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M10 10h4v4h-4z" fill="currentColor" opacity=".78"/></svg>`;
  return avatar;
}

function appendUserMessage(text) {
  document.querySelector("#empty-state")?.classList.add("hidden");
  const row = document.createElement("div");
  row.className = "message-row user-message";
  const bubble = document.createElement("div");
  bubble.className = "user-bubble";
  bubble.textContent = text;
  row.append(bubble);
  messages.append(row);
  scrollChatToBottom();
}

function appendLoadingMessage() {
  const row = document.createElement("div");
  row.className = "message-row assistant-row";
  const avatar = createAssistantAvatar();
  const dots = document.createElement("div");
  dots.className = "loading-dots";
  dots.setAttribute("aria-label", "Đang phân tích");
  dots.innerHTML = "<span></span><span></span><span></span>";
  row.append(avatar, dots);
  messages.append(row);
  scrollChatToBottom();
  return row;
}

function createEmotionChart(canvas, scores, strongestLabel) {
  if (typeof Chart === "undefined") {
    const notice = document.createElement("p");
    notice.className = "error-bubble";
    notice.textContent = "Không tải được thư viện biểu đồ. Kiểm tra kết nối CDN rồi tải lại trang.";
    canvas.replaceWith(notice);
    return;
  }

  const orderedLabels = Object.keys(labelNames).filter((label) => label in scores);
  const values = orderedLabels.map((label) => scores[label] * 100);
  const strongestIndex = orderedLabels.indexOf(strongestLabel);
  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: orderedLabels.map((label) => labelNames[label]),
      datasets: [{
        data: values,
        backgroundColor: orderedLabels.map((_, index) => index === strongestIndex ? "#7256d8" : "#b8a9ee"),
        borderRadius: 5,
        borderSkipped: false,
        barPercentage: 0.9,
        categoryPercentage: 0.92,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450 },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          backgroundColor: "#302b43",
          padding: 10,
          callbacks: { label: (context) => `${context.parsed.y.toFixed(1)}%` },
        },
      },
      scales: {
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: "#66677a", font: { family: "DM Sans", size: 10 }, crossAlign: "far", padding: 7 },
        },
        x: {
          beginAtZero: true,
          max: 100,
          border: { display: false, dash: [3, 4] },
          grid: { color: "#f0eff5", drawTicks: false },
          ticks: {
            stepSize: 20,
            padding: 5,
            color: "#a0a0ad",
            font: { family: "DM Sans", size: 9 },
            callback: (value) => `${value}%`,
          },
        },
      },
    },
  });
  return chart;
}

function renderResult(container, result) {
  const row = document.createElement("div");
  row.className = "message-row assistant-row";
  const avatar = createAssistantAvatar();

  const response = document.createElement("div");
  response.className = "assistant-response";

  const caption = document.createElement("p");
  caption.className = "assistant-caption";
  caption.textContent = "Phân tích cảm xúc";

  const resultCard = document.createElement("section");
  resultCard.className = "result-card";
  resultCard.setAttribute("aria-label", "Kết quả cảm xúc nổi bật");

  const topLine = document.createElement("div");
  topLine.className = "result-topline";
  const labelBlock = document.createElement("div");
  const resultEyebrow = document.createElement("p");
  resultEyebrow.className = "result-eyebrow";
  resultEyebrow.textContent = "Cảm xúc nổi bật";
  const label = document.createElement("h3");
  label.className = "result-label";
  label.textContent = labelNames[result.label] || result.label;
  labelBlock.append(resultEyebrow, label);

  const score = document.createElement("div");
  score.className = "result-score";
  const scoreCaption = document.createElement("small");
  scoreCaption.textContent = "Điểm model";
  score.append(scoreCaption, document.createTextNode(`${(result.score * 100).toFixed(1)}%`));
  topLine.append(labelBlock, score);
  resultCard.append(topLine);

  const chartPanel = document.createElement("div");
  chartPanel.className = "chart-panel";
  const chartHeading = document.createElement("div");
  chartHeading.className = "chart-heading";
  const chartTitle = document.createElement("h3");
  chartTitle.textContent = "Phân bố 6 cảm xúc";
  const chartHint = document.createElement("span");
  chartHint.textContent = "Điểm softmax (%)";
  chartHeading.append(chartTitle, chartHint);
  const chartWrap = document.createElement("div");
  chartWrap.className = "chart-wrap";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Biểu đồ tỷ lệ dự đoán của sáu cảm xúc");
  chartWrap.append(canvas);
  chartPanel.append(chartHeading, chartWrap);
  resultCard.append(chartPanel);

  const meta = document.createElement("div");
  meta.className = "result-meta";
  const elapsed = document.createElement("span");
  elapsed.textContent = `${Number(result.inference_ms).toFixed(0)} ms`;
  const dot = document.createElement("span");
  dot.className = "result-meta-dot";
  const modelName = document.createElement("span");
  modelName.textContent = result.model_version;
  meta.append(elapsed, dot, modelName);

  response.append(caption, resultCard, meta);
  row.append(avatar, response);
  container.replaceWith(row);
  createEmotionChart(canvas, result.scores, result.label);
  scrollChatToBottom();
}

function showError(container, message) {
  const row = document.createElement("div");
  row.className = "message-row assistant-row";
  const avatar = createAssistantAvatar();
  const error = document.createElement("div");
  error.className = "error-bubble";
  error.textContent = message;
  row.append(avatar, error);
  container.replaceWith(row);
  scrollChatToBottom();
}

async function analyze(text) {
  appendUserMessage(text);
  const loading = appendLoadingMessage();
  sendButton.disabled = true;
  sendLabel.textContent = "Đang phân tích";
  sendIcon.classList.add("hidden");
  sendSpinner.classList.remove("hidden");

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = typeof data.detail === "string" ? data.detail : "Không thể phân tích câu này.";
      throw new Error(detail);
    }
    renderResult(loading, data);
  } catch (error) {
    const detail = error instanceof TypeError
      ? "Không kết nối được API. Hãy kiểm tra backend FastAPI đang chạy."
      : error.message;
    showError(loading, detail);
  } finally {
    sendButton.disabled = false;
    sendLabel.textContent = "Phân tích";
    sendIcon.classList.remove("hidden");
    sendSpinner.classList.add("hidden");
    input.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text || sendButton.disabled) return;
  input.value = "";
  resizeInput();
  analyze(text);
});

input.addEventListener("input", resizeInput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

resizeInput();
