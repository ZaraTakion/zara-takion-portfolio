"use strict";

const menuButton = document.querySelector(".menu-toggle");
const mainNav = document.querySelector("#main-nav");
const year = document.querySelector("#current-year");

if (year) year.textContent = String(new Date().getFullYear());

document.querySelectorAll("img[data-fallback]").forEach((image) => {
  image.addEventListener("error", () => {
    if (image.dataset.fallbackTried) {
      image.hidden = true;
      image.closest(".project-visual")?.classList.add("project-visual-empty");
      return;
    }
    image.dataset.fallbackTried = "true";
    image.src = image.dataset.fallback;
  });
});

if (menuButton && mainNav) {
  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
    mainNav.classList.toggle("is-open", !isOpen);
  });

  mainNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menu");
      mainNav.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav.classList.contains("is-open")) {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Abrir menu");
      mainNav.classList.remove("is-open");
      menuButton.focus();
    }
  });
}

function setFormStatus(message, isError = false) {
  const status = document.querySelector("#form-status");
  if (!status) return;
  status.textContent = message;
  status.dataset.state = isError ? "error" : "success";
}

function openEmailDraft(data) {
  const subject = encodeURIComponent("Contato pelo portfólio — " + data.name);
  const body = encodeURIComponent("Nome: " + data.name + "\nE-mail: " + data.email + "\n\n" + data.message);
  window.location.href = "mailto:rodzmaciel21@gmail.com?subject=" + subject + "&body=" + body;
}

async function submitNetlifyForm(form) {
  const payload = new URLSearchParams(new FormData(form));
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  if (!response.ok) throw new Error("O serviço de formulários não aceitou a mensagem.");
}

async function submitContact(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  const apiBaseUrl = window.PORTFOLIO_CONFIG?.apiBaseUrl?.replace(/\/+$/, "");
  const netlifyFormsEnabled = window.PORTFOLIO_CONFIG?.netlifyFormsEnabled === true;
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setFormStatus("Preparando sua mensagem…");

  if (!apiBaseUrl && !netlifyFormsEnabled) {
    setFormStatus("A API ainda não está configurada. Abrindo um rascunho de e-mail para você revisar e enviar.");
    openEmailDraft(data);
    submitButton.disabled = false;
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
      if (!response.ok) throw new Error(result.error || "A mensagem não pôde ser enviada.");
    } else {
      await submitNetlifyForm(form);
    }
    form.reset();
    setFormStatus(apiBaseUrl
      ? "Mensagem enviada. Obrigado por entrar em contato!"
      : "Mensagem recebida. Obrigado por entrar em contato!");
  } catch (error) {
    setFormStatus((error instanceof Error ? error.message : "Falha de conexão.") + " Nenhuma mensagem foi enviada; tente novamente ou use o e-mail direto.", true);
  } finally {
    submitButton.disabled = false;
  }
}

const contactForm = document.querySelector("#contact-form");
if (contactForm) contactForm.addEventListener("submit", submitContact);