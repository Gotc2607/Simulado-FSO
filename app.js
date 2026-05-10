const state = {
  questions: [],
  current: 0,
  answers: {},
  finished: false
};

const els = {
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  themePill: document.getElementById("theme-pill"),
  questionCard: document.getElementById("question-card"),
  questionTitle: document.getElementById("question-title"),
  questionText: document.getElementById("question-text"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  prevBtn: document.getElementById("prev-btn"),
  nextBtn: document.getElementById("next-btn"),
  finishBtn: document.getElementById("finish-btn"),
  quizPanel: document.getElementById("quiz-panel"),
  resultPanel: document.getElementById("result-panel"),
  reviewPanel: document.getElementById("review-panel"),
  scoreLine: document.getElementById("score-line"),
  percentLine: document.getElementById("percent-line"),
  reviewBtn: document.getElementById("review-btn"),
  restartBtn: document.getElementById("restart-btn"),
  reviewList: document.getElementById("review-list")
};

function shuffleArray(array) {
  // Fisher-Yates shuffle
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function loadQuestions() {
  const response = await fetch("./simulado_so.json");
  if (!response.ok) {
    throw new Error("Falha ao carregar o arquivo de questões.");
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("O arquivo de questões está vazio ou inválido.");
  }

  // embaralha a ordem das questões
  state.questions = shuffleArray(data);
  renderQuestion();
}

function renderQuestion() {
  const total = state.questions.length;
  const question = state.questions[state.current];

  els.questionCard.hidden = false;
  els.progressLabel.textContent = `Questão ${state.current + 1} de ${total}`;
  els.progressFill.style.width = `${((state.current + 1) / total) * 100}%`;
  els.themePill.textContent = question.tema;

  els.questionTitle.textContent = `${question.id}. ${question.tema}`;
  els.questionText.textContent = question.pergunta;

  renderOptions(question);
  updateNavigation();
  renderFeedback(question);
}

function renderOptions(question) {
  els.options.innerHTML = "";

  const options = question.opcoes || [];
  const currentAnswer = state.answers[question.id];

  options.forEach((optionText, index) => {
    const letter = String.fromCharCode(97 + index); // 'a', 'b', ...
    const optionId = `q${question.id}_opt${index}`;
    const label = document.createElement("label");
    label.className = "option";
    if (currentAnswer === letter) {
      label.classList.add("selected");
    }

    label.innerHTML = `
      <input type="radio" name="question-${question.id}" id="${optionId}" value="${letter}" ${
      currentAnswer === letter ? "checked" : ""
    } />
      <span>${escapeHtml(optionText)}</span>
    `;

    label.addEventListener("click", () => {
      state.answers[question.id] = letter;
      renderQuestion();
    });

    els.options.appendChild(label);
  });

  if (options.length === 1 && options[0].toLowerCase().includes("resposta num")) {
    const inputWrap = document.createElement("div");
    inputWrap.className = "option selected";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Digite sua resposta";
    input.value = currentAnswer || "";
    input.addEventListener("input", (event) => {
      state.answers[question.id] = event.target.value.trim();
      renderFeedback(question);
    });

    inputWrap.replaceChildren(input);
    els.options.innerHTML = "";
    els.options.appendChild(inputWrap);
  }
}

function renderFeedback(question) {
  const answer = state.answers[question.id];
  // só exibe feedback depois que o usuário finalizar o simulado
  if (!answer || !state.finished) {
    els.feedback.hidden = true;
    els.feedback.className = "feedback";
    els.feedback.textContent = "";
    return;
  }

  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(question.gabarito);
  els.feedback.hidden = false;
  els.feedback.className = `feedback ${isCorrect ? "ok" : "bad"}`;
  if (isCorrect) {
    els.feedback.textContent = "Resposta compatível com o gabarito.";
  } else {
    // tenta mapear o gabarito (letra) para o texto da opção
    let gabaritoText = question.gabarito;
    if (typeof question.gabarito === "string" && question.gabarito.length === 1 && Array.isArray(question.opcoes)) {
      const idx = question.gabarito.toLowerCase().charCodeAt(0) - 97;
      if (question.opcoes[idx] !== undefined) {
        gabaritoText = `${question.gabarito} — ${question.opcoes[idx]}`;
      }
    }

    els.feedback.textContent = `Resposta diferente do gabarito. Gabarito: ${gabaritoText}`;
  }
}

function updateNavigation() {
  const isFirst = state.current === 0;

  els.prevBtn.disabled = isFirst;
  els.nextBtn.hidden = state.current === state.questions.length - 1;
}

function calculateScore() {
  let score = 0;

  state.questions.forEach((question) => {
    const answer = state.answers[question.id];
    if (normalizeAnswer(answer) === normalizeAnswer(question.gabarito)) {
      score += 1;
    }
  });

  return score;
}

function showResult() {
  const total = state.questions.length;
  const score = calculateScore();
  const percent = ((score / total) * 100).toFixed(1);

  // marca que o simulado foi finalizado para liberar feedback/revisão
  state.finished = true;

  els.quizPanel.hidden = true;
  els.resultPanel.hidden = false;

  els.scoreLine.textContent = `Você acertou ${score} de ${total} questões.`;
  els.percentLine.textContent = `Aproveitamento: ${percent}%`;

  // prepara a revisão para que as respostas e explicações fiquem disponíveis
  renderReview();
}

function renderReview() {
  els.reviewList.innerHTML = "";

  state.questions.forEach((question) => {
    const rawAnswer = state.answers[question.id];
    const hasAnswer = rawAnswer !== undefined && rawAnswer !== null && rawAnswer !== "";

    let displayAnswer = "(não respondida)";
    if (hasAnswer) {
      displayAnswer = rawAnswer;
      if (typeof rawAnswer === "string" && rawAnswer.length === 1 && /[a-z]/i.test(rawAnswer) && Array.isArray(question.opcoes)) {
        const idx = rawAnswer.toLowerCase().charCodeAt(0) - 97;
        if (question.opcoes[idx] !== undefined) {
          displayAnswer = question.opcoes[idx];
        }
      }
    }

    const isCorrect = hasAnswer && normalizeAnswer(rawAnswer) === normalizeAnswer(question.gabarito);
    const reviewState = !hasAnswer ? "unanswered" : isCorrect ? "correct" : "wrong";

    const item = document.createElement("article");
    item.className = `review-item ${reviewState}`;
    item.innerHTML = `
      <h3>${question.id}. ${escapeHtml(question.tema)}</h3>
      <p><strong>Pergunta:</strong> ${escapeHtml(question.pergunta)}</p>
      <p><strong>Sua resposta:</strong> ${escapeHtml(String(displayAnswer))}</p>
      <p><strong>Gabarito:</strong> ${escapeHtml(question.gabarito)}</p>
      <p class="status ${reviewState}">${
      reviewState === "correct" ? "Correta" : reviewState === "wrong" ? "Incorreta" : "Não respondida"
    }</p>
      <p><strong>Explicação:</strong> ${escapeHtml(question.explicacao || "Sem explicação.")}</p>
    `;

    els.reviewList.appendChild(item);
  });

  els.reviewPanel.hidden = false;
}

function restartQuiz() {
  state.current = 0;
  state.answers = {};
  state.finished = false;

  els.resultPanel.hidden = true;
  els.reviewPanel.hidden = true;
  els.quizPanel.hidden = false;

  // embaralha as questões novamente
  state.questions = shuffleArray(state.questions);
  renderQuestion();
}

function normalizeAnswer(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim().toLowerCase();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

els.prevBtn.addEventListener("click", () => {
  if (state.current > 0) {
    state.current -= 1;
    renderQuestion();
  }
});

els.nextBtn.addEventListener("click", () => {
  if (state.current < state.questions.length - 1) {
    state.current += 1;
    renderQuestion();
  }
});

els.finishBtn.addEventListener("click", showResult);
els.reviewBtn.addEventListener("click", renderReview);
els.restartBtn.addEventListener("click", restartQuiz);

loadQuestions().catch((error) => {
  els.progressLabel.textContent = "Erro ao carregar questões";
  els.themePill.textContent = "Verifique o JSON";
  els.questionCard.hidden = false;
  els.questionTitle.textContent = "Não foi possível iniciar o simulado";
  els.questionText.textContent = `${error.message} Execute em um servidor local para evitar bloqueio de CORS.`;
  els.options.innerHTML = "";
  els.feedback.hidden = true;
  els.actions?.setAttribute?.("hidden", "hidden");
});
