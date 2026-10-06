from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from api.app import create_app, send_contact_email


class ContactApiTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app({"TESTING": True})
        self.client = self.app.test_client()

    def test_health_check_does_not_require_email_configuration(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"status": "ok"})
        self.assertEqual(response.headers["Cache-Control"], "no-store")

    def test_invalid_email_is_rejected_before_sending(self):
        payload = {"name": "Zara", "email": "not-an-email", "message": "Olá, esta mensagem é válida."}
        with patch("api.app.send_contact_email") as send:
            response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 400)
        send.assert_not_called()

    def test_short_message_is_rejected(self):
        payload = {"name": "Zara", "email": "zara@example.com", "message": "Oi"}
        response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 400)

    def test_header_injection_is_rejected(self):
        payload = {
            "name": "Zara\nBcc: someone@example.com",
            "email": "zara@example.com",
            "message": "Olá, gostaria de conversar sobre um projeto.",
        }
        with patch("api.app.send_contact_email") as send:
            response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 400)
        send.assert_not_called()

    def test_honeypot_returns_success_without_sending(self):
        payload = {
            "name": "Zara",
            "email": "zara@example.com",
            "message": "Olá, gostaria de conversar sobre um projeto.",
            "website": "automated-bot",
        }
        with patch("api.app.send_contact_email") as send:
            response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 202)
        send.assert_not_called()

    def test_valid_contact_calls_mailer_and_returns_success(self):
        payload = {
            "name": "Zara",
            "email": "zara@example.com",
            "message": "Olá, gostaria de conversar sobre um projeto.",
        }
        with patch("api.app.send_contact_email") as send:
            response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 200)
        send.assert_called_once_with("Zara", "zara@example.com", payload["message"])

    def test_contact_is_not_sent_without_smtp_configuration(self):
        payload = {
            "name": "Zara",
            "email": "zara@example.com",
            "message": "Olá, gostaria de conversar sobre um projeto.",
        }
        environment = {
            "SMTP_HOST": "",
            "SMTP_USER": "",
            "SMTP_PASSWORD": "",
            "CONTACT_TO": "",
            "CONTACT_FROM": "",
        }
        with patch.dict(os.environ, environment, clear=False):
            with patch("api.app.send_contact_email", side_effect=RuntimeError):
                response = self.client.post("/api/contact", json=payload)
        self.assertEqual(response.status_code, 503)

    def test_smtp_defaults_to_work_email_recipient(self):
        smtp_environment = {
            "SMTP_HOST": "smtp.example.com",
            "SMTP_PORT": "587",
            "SMTP_USER": "sender@example.com",
            "SMTP_PASSWORD": "test-password",
            "CONTACT_FROM": "sender@example.com",
        }
        with patch.dict(os.environ, smtp_environment, clear=True):
            with patch("api.app.smtplib.SMTP") as smtp:
                send_contact_email("Zara", "reply@example.com", "Olá, quero falar sobre um projeto.")
        message = smtp.return_value.__enter__.return_value.send_message.call_args.args[0]
        self.assertEqual(message["To"], "rm20022101@gmail.com")

    def test_unknown_browser_origin_is_rejected(self):
        payload = {"name": "Zara", "email": "zara@example.com", "message": "Olá, gostaria de conversar."}
        response = self.client.post(
            "/api/contact",
            json=payload,
            headers={"Origin": "https://unknown.example"},
        )
        self.assertEqual(response.status_code, 403)

    def test_allowed_origin_receives_cors_header(self):
        payload = {"name": "Zara", "email": "zara@example.com", "message": "Olá, gostaria de conversar."}
        with patch.dict(os.environ, {"ALLOWED_ORIGINS": "https://portfolio.example"}, clear=False):
            client = create_app({"TESTING": True}).test_client()
        response = client.post(
            "/api/contact",
            json=payload,
            headers={"Origin": "https://portfolio.example"},
        )
        self.assertEqual(response.headers["Access-Control-Allow-Origin"], "https://portfolio.example")


if __name__ == "__main__":
    unittest.main()
