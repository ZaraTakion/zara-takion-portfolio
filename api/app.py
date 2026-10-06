"""Small Flask API for the portfolio contact form."""

from __future__ import annotations

import os
import re
import smtplib
import ssl
from email.message import EmailMessage
from typing import Any

from flask import Flask, jsonify, make_response, request

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MAX_MESSAGE_LENGTH = 2500


def _allowed_origins() -> set[str]:
    raw_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:8000,http://127.0.0.1:8000",
    )
    return {origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()}


def send_contact_email(name: str, email: str, message: str) -> None:
    """Send a plain text email using SMTP credentials from the service environment."""
    host = os.getenv("SMTP_HOST", "").strip()
    username = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "")
    recipient = os.getenv("CONTACT_TO", "rm20022101@gmail.com").strip()
    sender = os.getenv("CONTACT_FROM", "").strip() or username

    if not all((host, recipient, sender, username, password)):
        raise RuntimeError("O serviço de e-mail não está configurado.")

    email_message = EmailMessage()
    email_message["Subject"] = f"Contato pelo portfólio — {name}"
    email_message["From"] = sender
    email_message["To"] = recipient
    email_message["Reply-To"] = email
    email_message.set_content(f"Nome: {name}\nE-mail: {email}\n\n{message}")

    port = int(os.getenv("SMTP_PORT", "587"))
    tls_context = ssl.create_default_context()
    if port == 465:
        with smtplib.SMTP_SSL(host, port, context=tls_context, timeout=15) as smtp:
            smtp.login(username, password)
            smtp.send_message(email_message)
    else:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls(context=tls_context)
            smtp.ehlo()
            smtp.login(username, password)
            smtp.send_message(email_message)


def _validate_contact_payload(payload: Any) -> tuple[dict[str, str] | None, str | None]:
    if not isinstance(payload, dict):
        return None, "Envie os dados do formulário em JSON."

    name = payload.get("name")
    email = payload.get("email")
    message = payload.get("message")
    website = payload.get("website", "")

    if not all(isinstance(value, str) for value in (name, email, message, website)):
        return None, "Confira os campos e tente novamente."
    name, email, message = name.strip(), email.strip(), message.strip()
    if not name or len(name) > 80 or "\n" in name or "\r" in name:
        return None, "Informe um nome com até 80 caracteres."
    if len(email) > 254 or not EMAIL_PATTERN.fullmatch(email) or "\n" in email or "\r" in email:
        return None, "Informe um e-mail válido."
    if len(message) < 10 or len(message) > MAX_MESSAGE_LENGTH:
        return None, "A mensagem precisa ter entre 10 e 2500 caracteres."
    if len(website) > 0:
        return {"name": name, "email": email, "message": message, "website": website}, None

    return {"name": name, "email": email, "message": message, "website": ""}, None


def create_app(overrides: dict[str, Any] | None = None) -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = 8 * 1024
    app.config["ALLOWED_ORIGINS"] = _allowed_origins()
    if overrides:
        app.config.update(overrides)

    @app.after_request
    def add_safety_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Cache-Control"] = "no-store"
        origin = request.headers.get("Origin", "").rstrip("/")
        if origin and origin in app.config["ALLOWED_ORIGINS"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type"
            response.headers["Vary"] = "Origin"
        return response

    @app.get("/api/health")
    def health():
        return jsonify(status="ok"), 200

    @app.route("/api/contact", methods=["POST", "OPTIONS"])
    def contact():
        origin = request.headers.get("Origin", "").rstrip("/")
        allowed_origins = app.config["ALLOWED_ORIGINS"]
        if origin and origin not in allowed_origins:
            return jsonify(error="Origem não autorizada."), 403
        if request.method == "OPTIONS":
            return make_response("", 204)
        if not request.is_json:
            return jsonify(error="O formulário precisa enviar JSON."), 415

        payload, error = _validate_contact_payload(request.get_json(silent=True))
        if error:
            return jsonify(error=error), 400
        assert payload is not None
        if payload["website"]:
            return jsonify(message="Mensagem recebida."), 202

        try:
            send_contact_email(payload["name"], payload["email"], payload["message"])
        except RuntimeError:
            return jsonify(error="O formulário ainda não está pronto para receber mensagens. Use o e-mail direto."), 503
        except (OSError, smtplib.SMTPException, ValueError):
            app.logger.error("Falha ao enviar mensagem pelo formulário.")
            return jsonify(error="Não foi possível enviar a mensagem agora. Tente novamente mais tarde."), 502

        return jsonify(message="Mensagem enviada."), 200

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
