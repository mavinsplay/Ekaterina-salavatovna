// Положите этот файл в static/chat/chat.js (замените старый)
const webhookUrl = "https://n8n.ainewage.ru/webhook/user-message";

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newBtn = document.getElementById("newBtn");

let dialogueId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// утилиты
function scrollToBottom() {
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function createBubble(text = "", role = "assistant") {
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  return el;
}

function showTypingIndicator() {
  const wrap = document.createElement("div");
  wrap.className = "message assistant";
  const typing = document.createElement("div");
  typing.className = "typing";
  // three dots
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    typing.appendChild(dot);
  }
  wrap.innerHTML = "";
  wrap.appendChild(typing);
  messagesDiv.appendChild(wrap);
  scrollToBottom();
  return wrap;
}

function removeElement(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

// основной typing — печатает text в bubble по буквам
function typeTextIntoBubble(text, bubble, {minDelay=18, maxDelay=36, jitter=0.2} = {}) {
  return new Promise(resolve => {
    let i = 0;
    bubble.textContent = ""; // начать с пустого
    const t = () => {
      if (i < text.length) {
        // append next character
        bubble.textContent += text[i];
        i++;
        // случайная задержка для более живого эффекта
        const delay = Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
        setTimeout(t, delay);
        scrollToBottom();
      } else {
        resolve();
      }
    };
    t();
  });
}

// добавить сообщение пользователя (без задержки)
function appendUserMessage(text) {
  const b = createBubble(text, "user");
  messagesDiv.appendChild(b);
  scrollToBottom();
}

// обработать ответ ассистента: сначала индикатор, затем печать
async function appendAssistantResponseText(text) {
  const indicator = showTypingIndicator();
  // небольшая искусственная задержка перед началом печати (чтобы индикатор успел появиться)
  await new Promise(r => setTimeout(r, 350));
  removeElement(indicator);

  // создаём реальную боблу
  const bubble = createBubble("", "assistant");
  messagesDiv.appendChild(bubble);
  scrollToBottom();

  // "печатаем" текст
  await typeTextIntoBubble(text, bubble);
  scrollToBottom();
}

// Отправка сообщения на сервер
async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;
  // заблокировать кнопку/инпут на время отправки
  sendBtn.disabled = true;
  input.disabled = true;

  appendUserMessage(text);
  input.value = "";

  try {
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "user123",
        dialogue_id: dialogueId,
        message: text
      })
    });

    // если сервер возвращает JSON с полем response
    let data;
    try {
      data = await resp.json();
    } catch (e) {
      data = { response: "Ошибка формата ответа от сервера" };
    }

    const reply = (data && (data.response || data.reply || data.message)) || "Нет ответа от бота";
    await appendAssistantResponseText(reply);
  } catch (err) {
    console.error(err);
    await appendAssistantResponseText("Ошибка соединения с сервером. Попробуйте позже.");
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

// новый диалог
function newDialogue() {
  dialogueId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  messagesDiv.innerHTML = "";
  appendAssistantResponseText("🔄 Новый диалог начат");
}

// события
sendBtn.addEventListener("click", sendMessage);
newBtn.addEventListener("click", newDialogue);

// отправка по Enter
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// начальное приветствие
window.addEventListener("load", () => {
  appendAssistantResponseText("Привет! Я помогу тебе подобрать профессию. Напиши пару слов о себе — например, какие предметы тебе нравятся.");
  input.focus();
});

window.addEventListener("beforeunload", function (e) {
  if (messagesDiv && messagesDiv.children.length > 0) {
    // стандартный текст не меняется браузером
    e.preventDefault();
    e.returnValue = "Ваш диалог будет удалён. Вы уверены, что хотите покинуть страницу?";
    return e.returnValue;
  }
});