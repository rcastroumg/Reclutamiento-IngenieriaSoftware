from sqlalchemy.orm import Session

from core.config import get_settings
from models.recruitment import Application, NotificationLog, NotificationStatus, PipelineStage


class StubMailGateway:
    def send_stage_change(self, recipient: str, subject: str, body: str) -> None:
        del recipient, subject, body
        if get_settings().mail_provider_mode == "stub-fail":
            raise RuntimeError("Stub mail provider failure")


def notify_stage_change(db: Session, application: Application, stage: PipelineStage) -> None:
    recipient = application.candidate.email
    gateway = StubMailGateway()

    try:
        gateway.send_stage_change(
            recipient=recipient,
            subject=f"Cambio de etapa: {stage.name}",
            body=f"Tu postulacion ahora esta en la etapa {stage.name}.",
        )
        status = NotificationStatus.sent
        error_message = None
    except Exception as exc:  # noqa: BLE001
        status = NotificationStatus.failed
        error_message = str(exc)

    db.add(
        NotificationLog(
            application_id=application.id,
            company_id=application.company_id,
            channel="email",
            event_name="application_stage_changed",
            recipient=recipient,
            status=status,
            error_message=error_message,
        )
    )
