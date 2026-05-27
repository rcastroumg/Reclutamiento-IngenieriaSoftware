from pydantic import BaseModel, ConfigDict, EmailStr, Field

from models.recruitment import PositionStatus


class PipelineStageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    order_index: int = Field(ge=1)


class PipelineCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    is_default: bool = False
    stages: list[PipelineStageCreate] = Field(min_length=1)


class PipelineStageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    order_index: int


class PipelineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_default: bool
    stages: list[PipelineStageRead]


class PositionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(min_length=10)
    location: str = Field(min_length=2, max_length=150)
    pipeline_id: int
    status: PositionStatus = PositionStatus.draft


class PositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    location: str
    pipeline_id: int
    status: PositionStatus
    is_public: bool


class PublicPositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    location: str


class PublicApplicationCreate(BaseModel):
    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    summary: str | None = None
    notes: str | None = None


class CandidateCreate(BaseModel):
    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=50)
    summary: str | None = None


class CandidateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    phone: str | None
    summary: str | None


class ApplicationCreate(BaseModel):
    candidate_id: int
    position_id: int
    notes: str | None = None


class ApplicationMoveStage(BaseModel):
    stage_id: int


class StageHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_stage_id: int | None
    to_stage_id: int
    changed_by_user_id: int


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    position_id: int
    candidate_id: int
    current_stage_id: int
    notes: str | None
    stage_history: list[StageHistoryRead]


class ApplicationCandidateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr


class ApplicationStageSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    order_index: int


class PositionApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    position_id: int
    candidate_id: int
    current_stage_id: int
    notes: str | None
    candidate: ApplicationCandidateRead
    current_stage: ApplicationStageSnapshotRead


class ApplicationPositionSnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    location: str
    status: PositionStatus


class CandidateApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    position_id: int
    candidate_id: int
    current_stage_id: int
    notes: str | None
    position: ApplicationPositionSnapshotRead
    current_stage: ApplicationStageSnapshotRead


class QuestionnaireQuestionCreate(BaseModel):
    prompt: str = Field(min_length=3)
    order_index: int = Field(ge=1)


class QuestionnaireCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    questions: list[QuestionnaireQuestionCreate] = Field(min_length=1)


class QuestionnaireQuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prompt: str
    order_index: int


class QuestionnaireRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    questions: list[QuestionnaireQuestionRead]


class QuestionnaireAssignmentCreate(BaseModel):
    application_id: int
    questionnaire_id: int


class QuestionnaireAssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    questionnaire_id: int
    status: str


class ScorecardCriterionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    order_index: int = Field(ge=1)


class ScorecardTemplateCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    criteria: list[ScorecardCriterionCreate] = Field(min_length=1)


class ScorecardCriterionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    order_index: int


class ScorecardTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    criteria: list[ScorecardCriterionRead]


class ScorecardItemCreate(BaseModel):
    criterion_id: int
    score: int = Field(ge=1, le=5)
    comment: str | None = None


class ApplicationScorecardCreate(BaseModel):
    application_id: int
    scorecard_template_id: int
    items: list[ScorecardItemCreate] = Field(min_length=1)


class ScorecardItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    criterion_id: int
    score: int
    comment: str | None


class ApplicationScorecardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    scorecard_template_id: int
    submitted_by_user_id: int
    items: list[ScorecardItemRead]


class ApplicationDocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    company_id: int
    external_file_id: str
    original_filename: str
    content_type: str
    uploaded_by_user_id: int


class NotificationLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int
    company_id: int
    channel: str
    event_name: str
    recipient: str
    status: str
    error_message: str | None
