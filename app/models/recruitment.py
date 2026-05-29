import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base, TimestampMixin


class MembershipRole(str, enum.Enum):
    admin = "admin"
    recruiter = "recruiter"


class PositionStatus(str, enum.Enum):
    draft = "draft"
    open = "open"
    closed = "closed"


class SalaryFrequency(str, enum.Enum):
    monthly = "monthly"
    annual = "annual"


class SalaryCurrency(str, enum.Enum):
    GTQ = "GTQ"
    USD = "USD"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    memberships: Mapped[list["UserCompanyMembership"]] = relationship(back_populates="user")


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    memberships: Mapped[list["UserCompanyMembership"]] = relationship(back_populates="company")
    pipelines: Mapped[list["Pipeline"]] = relationship(back_populates="company")
    positions: Mapped[list["Position"]] = relationship(back_populates="company")
    applications: Mapped[list["Application"]] = relationship(back_populates="company")


class UserCompanyMembership(TimestampMixin, Base):
    __tablename__ = "user_company_memberships"
    __table_args__ = (UniqueConstraint("user_id", "company_id", name="uq_user_company_membership"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    role: Mapped[MembershipRole] = mapped_column(Enum(MembershipRole), nullable=False)

    user: Mapped[User] = relationship(back_populates="memberships")
    company: Mapped[Company] = relationship(back_populates="memberships")


class Pipeline(TimestampMixin, Base):
    __tablename__ = "pipelines"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    company: Mapped[Company] = relationship(back_populates="pipelines")
    stages: Mapped[list["PipelineStage"]] = relationship(back_populates="pipeline", order_by="PipelineStage.order_index")
    positions: Mapped[list["Position"]] = relationship(back_populates="pipeline")


class PipelineStage(TimestampMixin, Base):
    __tablename__ = "pipeline_stages"
    __table_args__ = (UniqueConstraint("pipeline_id", "order_index", name="uq_stage_pipeline_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("pipelines.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    pipeline: Mapped[Pipeline] = relationship(back_populates="stages")


class Position(TimestampMixin, Base):
    __tablename__ = "positions"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    pipeline_id: Mapped[int] = mapped_column(ForeignKey("pipelines.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(150), nullable=False)
    salary_min: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    salary_max: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    salary_frequency: Mapped[SalaryFrequency] = mapped_column(Enum(SalaryFrequency), nullable=False, default=SalaryFrequency.monthly)
    salary_currency: Mapped[SalaryCurrency] = mapped_column(Enum(SalaryCurrency), nullable=False, default=SalaryCurrency.GTQ)
    status: Mapped[PositionStatus] = mapped_column(Enum(PositionStatus), default=PositionStatus.draft, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    company: Mapped[Company] = relationship(back_populates="positions")
    pipeline: Mapped[Pipeline] = relationship(back_populates="positions")
    applications: Mapped[list["Application"]] = relationship(back_populates="position")


class Candidate(TimestampMixin, Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    applications: Mapped[list["Application"]] = relationship(back_populates="candidate")


class Application(TimestampMixin, Base):
    __tablename__ = "applications"
    __table_args__ = (UniqueConstraint("candidate_id", "position_id", name="uq_candidate_position_application"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    position_id: Mapped[int] = mapped_column(ForeignKey("positions.id"), nullable=False)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), nullable=False)
    current_stage_id: Mapped[int] = mapped_column(ForeignKey("pipeline_stages.id"), index=True, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    company: Mapped[Company] = relationship(back_populates="applications")
    position: Mapped[Position] = relationship(back_populates="applications")
    candidate: Mapped[Candidate] = relationship(back_populates="applications")
    current_stage: Mapped[PipelineStage] = relationship()
    stage_history: Mapped[list["ApplicationStageHistory"]] = relationship(back_populates="application", order_by="ApplicationStageHistory.id")
    questionnaire_assignments: Mapped[list["QuestionnaireAssignment"]] = relationship(back_populates="application")
    scorecards: Mapped[list["ApplicationScorecard"]] = relationship(back_populates="application")
    documents: Mapped[list["ApplicationDocument"]] = relationship(back_populates="application")
    notification_logs: Mapped[list["NotificationLog"]] = relationship(back_populates="application")


class ApplicationStageHistory(TimestampMixin, Base):
    __tablename__ = "application_stage_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True, nullable=False)
    from_stage_id: Mapped[int | None] = mapped_column(ForeignKey("pipeline_stages.id"), nullable=True)
    to_stage_id: Mapped[int] = mapped_column(ForeignKey("pipeline_stages.id"), nullable=False)
    changed_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    application: Mapped[Application] = relationship(back_populates="stage_history")


class Questionnaire(TimestampMixin, Base):
    __tablename__ = "questionnaires"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    questions: Mapped[list["QuestionnaireQuestion"]] = relationship(back_populates="questionnaire", order_by="QuestionnaireQuestion.order_index")


class QuestionnaireQuestion(TimestampMixin, Base):
    __tablename__ = "questionnaire_questions"

    id: Mapped[int] = mapped_column(primary_key=True)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"), index=True, nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    questionnaire: Mapped[Questionnaire] = relationship(back_populates="questions")


class QuestionnaireAssignmentStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"


class QuestionnaireAssignment(TimestampMixin, Base):
    __tablename__ = "questionnaire_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True, nullable=False)
    questionnaire_id: Mapped[int] = mapped_column(ForeignKey("questionnaires.id"), nullable=False)
    status: Mapped[QuestionnaireAssignmentStatus] = mapped_column(Enum(QuestionnaireAssignmentStatus), default=QuestionnaireAssignmentStatus.pending, nullable=False)

    application: Mapped[Application] = relationship(back_populates="questionnaire_assignments")
    questionnaire: Mapped[Questionnaire] = relationship()


class ScorecardTemplate(TimestampMixin, Base):
    __tablename__ = "scorecard_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    criteria: Mapped[list["ScorecardCriterion"]] = relationship(back_populates="scorecard_template", order_by="ScorecardCriterion.order_index")


class ScorecardCriterion(TimestampMixin, Base):
    __tablename__ = "scorecard_criteria"

    id: Mapped[int] = mapped_column(primary_key=True)
    scorecard_template_id: Mapped[int] = mapped_column(ForeignKey("scorecard_templates.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    scorecard_template: Mapped[ScorecardTemplate] = relationship(back_populates="criteria")


class ApplicationScorecard(TimestampMixin, Base):
    __tablename__ = "application_scorecards"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True, nullable=False)
    scorecard_template_id: Mapped[int] = mapped_column(ForeignKey("scorecard_templates.id"), nullable=False)
    submitted_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    application: Mapped[Application] = relationship(back_populates="scorecards")
    items: Mapped[list["ApplicationScorecardItem"]] = relationship(back_populates="scorecard", order_by="ApplicationScorecardItem.id")


class ApplicationScorecardItem(TimestampMixin, Base):
    __tablename__ = "application_scorecard_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_scorecard_id: Mapped[int] = mapped_column(ForeignKey("application_scorecards.id"), index=True, nullable=False)
    criterion_id: Mapped[int] = mapped_column(ForeignKey("scorecard_criteria.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    scorecard: Mapped[ApplicationScorecard] = relationship(back_populates="items")


class ApplicationDocument(TimestampMixin, Base):
    __tablename__ = "application_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True, nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    external_file_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    application: Mapped[Application] = relationship(back_populates="documents")


class NotificationStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"


class NotificationLog(TimestampMixin, Base):
    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_id: Mapped[int] = mapped_column(ForeignKey("applications.id"), index=True, nullable=False)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), index=True, nullable=False)
    channel: Mapped[str] = mapped_column(String(50), nullable=False, default="email")
    event_name: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(Enum(NotificationStatus), nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    application: Mapped[Application] = relationship(back_populates="notification_logs")
