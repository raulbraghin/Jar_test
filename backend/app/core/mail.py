import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def enviar_email(para: str, assunto: str, html: str) -> None:
    """Envia e-mail via SMTP. Sem SMTP configurado, apenas registra no log (modo dev)."""
    if not settings.SMTP_HOST:
        logger.info(
            "SMTP não configurado (modo dev). E-mail para %s:\nAssunto: %s\n%s",
            para,
            assunto,
            html,
        )
        return

    remetente = settings.SMTP_FROM or settings.SMTP_USER
    msg = MIMEMultipart("alternative")
    msg["Subject"] = assunto
    msg["From"] = remetente
    msg["To"] = para
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(remetente, [para], msg.as_string())
    except Exception as e:
        logger.error("Falha ao enviar e-mail para %s: %s", para, e)


def enviar_verificacao_email(para: str, link: str) -> None:
    assunto = "Confirme seu e-mail — Jar-Test Digital"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:8px;border:1px solid #e2e8f0;">
      <h2 style="color:#0891b2;margin-top:0;">Jar-Test Digital — Confirmação de E-mail</h2>
      <p style="color:#334155;font-size:15px;line-height:1.5;">
        Para concluir seu cadastro no <b>Jar-Test Digital (Cálculo de Dosagem e Ensaios de Tratabilidade)</b>,
        confirme seu endereço de e-mail clicando no botão abaixo:
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="{link}"
           style="display:inline-block;background:#0891b2;color:#ffffff;padding:12px 28px;
                  border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px;">
          Confirmar meu E-mail
        </a>
      </p>
      <p style="color:#64748b;font-size:12px;line-height:1.4;">
        Se o botão não funcionar, copie e cole o link no seu navegador:<br>
        <a href="{link}" style="color:#0891b2;">{link}</a>
      </p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">
      <p style="color:#94a3b8;font-size:11px;text-align:center;">
        Jar-Test Digital &bull; Plataforma de Ensaios de Tratabilidade
      </p>
    </div>
    """
    enviar_email(para, assunto, html)
