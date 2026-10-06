"use strict";

const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const year = document.querySelector("#current-year");
const isEnglishPage = document.documentElement.lang.toLowerCase().startsWith("en");

if (year) year.textContent = String(new Date().getFullYear());

function closeMobileMenu(restoreFocus = false) {
  if (!menuButton || !mainNav) return;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", isEnglishPage ? "Open menu" : "Abrir menu");
  mainNav.classList.remove("is-open");
  if (restoreFocus) menuButton.focus();
}

if (menuButton && mainNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMobileMenu();
    } else {
      menuButton.setAttribute("aria-expanded", "true");
      menuButton.setAttribute("aria-label", isEnglishPage ? "Close menu" : "Fechar menu");
      mainNav.classList.add("is-open");
    }
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });

  document.addEventListener("pointerdown", (event) => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen && !menuButton.contains(event.target) && !mainNav.contains(event.target)) {
      closeMobileMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") closeMobileMenu(true);
  });

  window.matchMedia("(min-width: 641px)").addEventListener("change", (event) => {
    if (event.matches) closeMobileMenu();
  });
}

function setFormStatus(message, isError = false) {
  const status = document.querySelector("#form-status");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = isError ? "error" : "success";
  status.setAttribute("role", isError ? "alert" : "status");
  status.setAttribute("aria-live", isError ? "assertive" : "polite");
}

function openEmailDraft(data, isEnglish = false) {
  const subject = encodeURIComponent((isEnglish ? "Portfolio contact — " : "Contato pelo portfólio — ") + data.name);
  const body = encodeURIComponent(isEnglish
    ? "Name: " + data.name + "\nEmail: " + data.email + "\n\n" + data.message
    : "Nome: " + data.name + "\nE-mail: " + data.email + "\n\n" + data.message);
  window.location.href = "mailto:rm20022101@gmail.com?subject=" + subject + "&body=" + body;
}

async function submitNetlifyForm(form, isEnglish = false) {
  const payload = new URLSearchParams(new FormData(form));
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  if (!response.ok) {
    throw new Error(isEnglish
      ? "The form service could not accept your message."
      : "O serviço de formulários não aceitou a mensagem.");
  }
}

async function submitContact(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const isEnglish = isEnglishPage;
  const messages = isEnglish ? {
    button: "Send message",
    sending: "Sending your message…",
    unavailable: "The contact service is not configured in this preview. Opening an email draft for you to review and send.",
    connectionError: "Connection error.",
    notSent: "Your message was not sent. Please try again or email me directly.",
    sent: "Message sent. Thank you; I will reply to the email address you provided.",
    received: "Message received. Thank you; I will reply to the email address you provided.",
    failed: "Your message could not be sent. Please try again or email me directly."
  } : {
    button: "Enviar mensagem",
    sending: "Enviando sua mensagem…",
    unavailable: "O serviço de contato não está configurado nesta prévia. Vou abrir um rascunho de e-mail para você revisar e enviar.",
    connectionError: "Falha de conexão.",
    notSent: "Sua mensagem não foi enviada. Tente novamente ou escreva diretamente para mim.",
    sent: "Mensagem enviada. Obrigado pelo contato; responderei pelo e-mail informado.",
    received: "Mensagem recebida. Obrigado pelo contato; responderei pelo e-mail informado.",
    failed: "A mensagem não pôde ser enviada. Tente novamente ou escreva diretamente para mim."
  };

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const apiBaseUrl = window.PORTFOLIO_CONFIG?.apiBaseUrl?.replace(/\/+$/, "");
  const netlifyFormsEnabled = window.PORTFOLIO_CONFIG?.netlifyFormsEnabled === true;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton?.textContent.trim() || messages.button;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = messages.sending;
  }
  form.setAttribute("aria-busy", "true");
  setFormStatus(messages.sending);

  if (!apiBaseUrl && !netlifyFormsEnabled) {
    setFormStatus(messages.unavailable);
    openEmailDraft(data, isEnglish);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
    form.removeAttribute("aria-busy");
    return;
  }

  try {
    if (apiBaseUrl) {
      const response = await fetch(apiBaseUrl + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(isEnglish ? messages.failed : (result.error || messages.failed));
      }
    } else {
      await submitNetlifyForm(form, isEnglish);
    }
    form.reset();
    setFormStatus(apiBaseUrl ? messages.sent : messages.received);
  } catch (error) {
    const detail = error instanceof Error ? error.message : messages.connectionError;
    setFormStatus(isEnglish ? messages.failed : detail + " " + messages.notSent, true);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
    form.removeAttribute("aria-busy");
  }
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) contactForm.addEventListener("submit", submitContact);
