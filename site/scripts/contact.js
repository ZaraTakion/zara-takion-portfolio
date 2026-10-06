function setFormStatus(status, message, state = "success") {
  if (!status) return;
  status.textContent = message;
  status.dataset.state = state;
  status.setAttribute("role", state === "error" ? "alert" : "status");
  status.setAttribute("aria-live", state === "error" ? "assertive" : "polite");
}

function openEmailDraft(data, isEnglish) {
  const subject = encodeURIComponent(
    (isEnglish ? "Portfolio contact — " : "Contato pelo portfólio — ") + data.name
  );
  const body = encodeURIComponent(isEnglish
    ? `Name: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
    : `Nome: ${data.name}\nE-mail: ${data.email}\n\n${data.message}`);
  window.location.href = `mailto:rm20022101@gmail.com?subject=${subject}&body=${body}`;
}

async function sendToNetlify(form) {
  const payload = new URLSearchParams(new FormData(form));
  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  });
  if (!response.ok) throw new Error("netlify-form-rejected");
}

function contactMessages(isEnglish) {
  return isEnglish ? {
    sending: "Sending your message…",
    unavailable: "The contact service is not configured here. An email draft is opening for you to review and send.",
    sent: "Message sent. Thank you; I will reply to the email address you provided.",
    received: "Message received. Thank you; I will reply to the email address you provided.",
    failed: "Your message was not sent. Please try again or email me directly.",
  } : {
    sending: "Enviando sua mensagem…",
    unavailable: "O serviço de contato não está configurado aqui. Um rascunho de e-mail será aberto para você revisar e enviar.",
    sent: "Mensagem enviada. Obrigado pelo contato; responderei pelo e-mail informado.",
    received: "Mensagem recebida. Obrigado pelo contato; responderei pelo e-mail informado.",
    failed: "A mensagem não foi enviada. Tente novamente ou escreva diretamente para mim.",
  };
}

export function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const status = document.querySelector("#form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
  const messages = contactMessages(isEnglish);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form).entries());
    const apiBaseUrl = window.PORTFOLIO_CONFIG?.apiBaseUrl?.replace(/\/+$/, "");
    const netlifyFormsEnabled = window.PORTFOLIO_CONFIG?.netlifyFormsEnabled === true;
    const originalButtonText = submitButton?.textContent.trim();

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = messages.sending;
    }
    form.setAttribute("aria-busy", "true");
    setFormStatus(status, messages.sending, "sending");

    if (!apiBaseUrl && !netlifyFormsEnabled) {
      setFormStatus(status, messages.unavailable, "notice");
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
        const response = await fetch(`${apiBaseUrl}/api/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("contact-api-rejected");
        setFormStatus(status, messages.sent);
      } else {
        await sendToNetlify(form);
        setFormStatus(status, messages.received);
      }
      form.reset();
    } catch {
      setFormStatus(status, messages.failed, "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
      form.removeAttribute("aria-busy");
    }
  });
}
