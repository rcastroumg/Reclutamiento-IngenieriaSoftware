from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload

from api.deps import get_active_membership, get_current_user
from db.session import get_db
from models.recruitment import (
    Application,
    ApplicationDocument,
    ApplicationScorecard,
    ApplicationScorecardItem,
    ApplicationStageHistory,
    Candidate,
    MembershipRole,
    NotificationLog,
    Pipeline,
    PipelineStage,
    Position,
    PositionStatus,
    Questionnaire,
    QuestionnaireAssignment,
    QuestionnaireQuestion,
    QuestionnaireAssignmentStatus,
    ScorecardCriterion,
    ScorecardTemplate,
    User,
    UserCompanyMembership,
)
from schemas.recruitment import (
    ApplicationCreate,
    ApplicationCandidateRead,
    ApplicationMoveStage,
    ApplicationRead,
    CandidateApplicationRead,
    ApplicationDocumentRead,
    ApplicationScorecardCreate,
    ApplicationScorecardRead,
    NotificationLogRead,
    CandidateCreate,
    CandidateRead,
    PipelineCreate,
    PipelineRead,
    PublicApplicationCreate,
    PublicPositionRead,
    PositionCreate,
    PositionApplicationRead,
    PositionRead,
    QuestionnaireAssignmentCreate,
    QuestionnaireAssignmentRead,
    QuestionnaireCreate,
    QuestionnaireRead,
    ScorecardTemplateCreate,
    ScorecardTemplateRead,
)
from services.notifications import notify_stage_change
from services.storage import LocalStorageGateway


router = APIRouter(tags=["recruitment"])


def require_admin(membership: UserCompanyMembership) -> None:
    if membership.role != MembershipRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")


@router.post("/pipelines", response_model=PipelineRead, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    payload: PipelineCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> Pipeline:
    require_admin(membership)

    if payload.is_default:
        db.query(Pipeline).filter(Pipeline.company_id == membership.company_id, Pipeline.is_default.is_(True)).update({Pipeline.is_default: False})

    pipeline = Pipeline(company_id=membership.company_id, name=payload.name, is_default=payload.is_default)
    db.add(pipeline)
    db.flush()

    for stage in payload.stages:
        db.add(PipelineStage(pipeline_id=pipeline.id, name=stage.name, order_index=stage.order_index))

    db.commit()
    return (
        db.query(Pipeline)
        .options(selectinload(Pipeline.stages))
        .filter(Pipeline.id == pipeline.id)
        .first()
    )


@router.get("/pipelines", response_model=list[PipelineRead])
def list_pipelines(
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[Pipeline]:
    return (
        db.query(Pipeline)
        .options(selectinload(Pipeline.stages))
        .filter(Pipeline.company_id == membership.company_id)
        .order_by(Pipeline.id.asc())
        .all()
    )


@router.post("/positions", response_model=PositionRead, status_code=status.HTTP_201_CREATED)
def create_position(
    payload: PositionCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> Position:
    pipeline = db.query(Pipeline).filter(Pipeline.id == payload.pipeline_id, Pipeline.company_id == membership.company_id).first()
    if pipeline is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pipeline not found in active company")

    position = Position(
        company_id=membership.company_id,
        pipeline_id=payload.pipeline_id,
        title=payload.title,
        description=payload.description,
        location=payload.location,
        status=payload.status,
    )
    db.add(position)
    db.commit()
    db.refresh(position)
    return position


@router.get("/positions", response_model=list[PositionRead])
def list_positions(
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[Position]:
    return db.query(Position).filter(Position.company_id == membership.company_id).order_by(Position.id.asc()).all()


@router.get("/positions/{position_id}/applications", response_model=list[PositionApplicationRead])
def list_position_applications(
    position_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[Application]:
    position = db.query(Position).filter(Position.id == position_id, Position.company_id == membership.company_id).first()
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found in active company")

    return (
        db.query(Application)
        .options(selectinload(Application.candidate), selectinload(Application.current_stage))
        .filter(Application.position_id == position.id, Application.company_id == membership.company_id)
        .order_by(Application.id.asc())
        .all()
    )


@router.post("/positions/{position_id}/publish", response_model=PositionRead)
def publish_position(
    position_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> Position:
    position = db.query(Position).filter(Position.id == position_id, Position.company_id == membership.company_id).first()
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found in active company")
    if position.status != PositionStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only open positions can be published")

    position.is_public = True
    db.commit()
    db.refresh(position)
    return position


@router.post("/candidates", response_model=CandidateRead, status_code=status.HTTP_201_CREATED)
def create_candidate(
    payload: CandidateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Candidate:
    del current_user
    existing = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Candidate already exists")

    candidate = Candidate(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        summary=payload.summary,
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/candidates", response_model=list[CandidateRead])
def list_candidates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Candidate]:
    del current_user
    return db.query(Candidate).order_by(Candidate.id.asc()).all()


@router.get("/candidates/{candidate_id}/applications", response_model=list[CandidateApplicationRead])
def list_candidate_applications(
    candidate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Application]:
    del current_user
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    return (
        db.query(Application)
        .options(selectinload(Application.position), selectinload(Application.current_stage))
        .filter(Application.candidate_id == candidate.id)
        .order_by(Application.id.asc())
        .all()
    )


@router.post("/applications", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    position = (
        db.query(Position)
        .options(selectinload(Position.pipeline).selectinload(Pipeline.stages))
        .filter(Position.id == payload.position_id, Position.company_id == membership.company_id)
        .first()
    )
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found in active company")

    candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    first_stage = min(position.pipeline.stages, key=lambda stage: stage.order_index, default=None)
    if first_stage is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pipeline has no stages")

    application = Application(
        company_id=membership.company_id,
        position_id=position.id,
        candidate_id=candidate.id,
        current_stage_id=first_stage.id,
        notes=payload.notes,
    )
    db.add(application)
    db.flush()
    db.add(
        ApplicationStageHistory(
            application_id=application.id,
            from_stage_id=None,
            to_stage_id=first_stage.id,
            changed_by_user_id=current_user.id,
        )
    )
    db.commit()
    return (
        db.query(Application)
        .options(selectinload(Application.stage_history))
        .filter(Application.id == application.id)
        .first()
    )


@router.post("/applications/{application_id}/move-stage", response_model=ApplicationRead)
def move_application_stage(
    application_id: int,
    payload: ApplicationMoveStage,
    membership: UserCompanyMembership = Depends(get_active_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Application:
    application = (
        db.query(Application)
        .options(
            selectinload(Application.position).selectinload(Position.pipeline).selectinload(Pipeline.stages),
            selectinload(Application.stage_history),
        )
        .filter(Application.id == application_id, Application.company_id == membership.company_id)
        .first()
    )
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    valid_stage = next((stage for stage in application.position.pipeline.stages if stage.id == payload.stage_id), None)
    if valid_stage is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stage does not belong to the position pipeline")

    previous_stage_id = application.current_stage_id
    application.current_stage_id = valid_stage.id
    db.add(
        ApplicationStageHistory(
            application_id=application.id,
            from_stage_id=previous_stage_id,
            to_stage_id=valid_stage.id,
            changed_by_user_id=current_user.id,
        )
    )
    db.commit()
    application = (
        db.query(Application)
        .options(selectinload(Application.candidate))
        .filter(Application.id == application.id)
        .first()
    )
    notify_stage_change(db, application, valid_stage)
    db.commit()
    return (
        db.query(Application)
        .options(selectinload(Application.stage_history))
        .filter(Application.id == application.id)
        .first()
    )


@router.post("/questionnaires", response_model=QuestionnaireRead, status_code=status.HTTP_201_CREATED)
def create_questionnaire(
    payload: QuestionnaireCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> Questionnaire:
    require_admin(membership)

    questionnaire = Questionnaire(company_id=membership.company_id, name=payload.name)
    db.add(questionnaire)
    db.flush()

    for question in payload.questions:
        db.add(
            QuestionnaireQuestion(
                questionnaire_id=questionnaire.id,
                prompt=question.prompt,
                order_index=question.order_index,
            )
        )

    db.commit()
    return (
        db.query(Questionnaire)
        .options(selectinload(Questionnaire.questions))
        .filter(Questionnaire.id == questionnaire.id)
        .first()
    )


@router.get("/questionnaires", response_model=list[QuestionnaireRead])
def list_questionnaires(
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[Questionnaire]:
    return (
        db.query(Questionnaire)
        .options(selectinload(Questionnaire.questions))
        .filter(Questionnaire.company_id == membership.company_id)
        .order_by(Questionnaire.id.asc())
        .all()
    )


@router.post("/questionnaire-assignments", response_model=QuestionnaireAssignmentRead, status_code=status.HTTP_201_CREATED)
def assign_questionnaire(
    payload: QuestionnaireAssignmentCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> QuestionnaireAssignment:
    application = db.query(Application).filter(Application.id == payload.application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    questionnaire = db.query(Questionnaire).filter(Questionnaire.id == payload.questionnaire_id, Questionnaire.company_id == membership.company_id).first()
    if questionnaire is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Questionnaire not found in active company")

    assignment = QuestionnaireAssignment(
        application_id=application.id,
        questionnaire_id=questionnaire.id,
        status=QuestionnaireAssignmentStatus.pending,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.get("/applications/{application_id}/questionnaire-assignments", response_model=list[QuestionnaireAssignmentRead])
def list_questionnaire_assignments(
    application_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[QuestionnaireAssignment]:
    application = db.query(Application).filter(Application.id == application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    return (
        db.query(QuestionnaireAssignment)
        .filter(QuestionnaireAssignment.application_id == application.id)
        .order_by(QuestionnaireAssignment.id.asc())
        .all()
    )


@router.post("/scorecards/templates", response_model=ScorecardTemplateRead, status_code=status.HTTP_201_CREATED)
def create_scorecard_template(
    payload: ScorecardTemplateCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> ScorecardTemplate:
    require_admin(membership)

    template = ScorecardTemplate(company_id=membership.company_id, name=payload.name)
    db.add(template)
    db.flush()

    for criterion in payload.criteria:
        db.add(
            ScorecardCriterion(
                scorecard_template_id=template.id,
                name=criterion.name,
                order_index=criterion.order_index,
            )
        )

    db.commit()
    return (
        db.query(ScorecardTemplate)
        .options(selectinload(ScorecardTemplate.criteria))
        .filter(ScorecardTemplate.id == template.id)
        .first()
    )


@router.get("/scorecards/templates", response_model=list[ScorecardTemplateRead])
def list_scorecard_templates(
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[ScorecardTemplate]:
    return (
        db.query(ScorecardTemplate)
        .options(selectinload(ScorecardTemplate.criteria))
        .filter(ScorecardTemplate.company_id == membership.company_id)
        .order_by(ScorecardTemplate.id.asc())
        .all()
    )


@router.post("/scorecards", response_model=ApplicationScorecardRead, status_code=status.HTTP_201_CREATED)
def submit_scorecard(
    payload: ApplicationScorecardCreate,
    membership: UserCompanyMembership = Depends(get_active_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationScorecard:
    application = db.query(Application).filter(Application.id == payload.application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    template = (
        db.query(ScorecardTemplate)
        .options(selectinload(ScorecardTemplate.criteria))
        .filter(ScorecardTemplate.id == payload.scorecard_template_id, ScorecardTemplate.company_id == membership.company_id)
        .first()
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scorecard template not found in active company")

    valid_criteria = {criterion.id for criterion in template.criteria}
    submitted_criteria = {item.criterion_id for item in payload.items}
    if submitted_criteria != valid_criteria:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Scorecard items must match template criteria exactly")

    scorecard = ApplicationScorecard(
        application_id=application.id,
        scorecard_template_id=template.id,
        submitted_by_user_id=current_user.id,
    )
    db.add(scorecard)
    db.flush()

    for item in payload.items:
        db.add(
            ApplicationScorecardItem(
                application_scorecard_id=scorecard.id,
                criterion_id=item.criterion_id,
                score=item.score,
                comment=item.comment,
            )
        )

    db.commit()
    return (
        db.query(ApplicationScorecard)
        .options(selectinload(ApplicationScorecard.items))
        .filter(ApplicationScorecard.id == scorecard.id)
        .first()
    )


@router.get("/applications/{application_id}/scorecards", response_model=list[ApplicationScorecardRead])
def list_application_scorecards(
    application_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[ApplicationScorecard]:
    application = db.query(Application).filter(Application.id == application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    return (
        db.query(ApplicationScorecard)
        .options(selectinload(ApplicationScorecard.items))
        .filter(ApplicationScorecard.application_id == application.id)
        .order_by(ApplicationScorecard.id.asc())
        .all()
    )


@router.post("/applications/{application_id}/documents", response_model=ApplicationDocumentRead, status_code=status.HTTP_201_CREATED)
def upload_application_document(
    application_id: int,
    file: UploadFile = File(...),
    membership: UserCompanyMembership = Depends(get_active_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ApplicationDocument:
    application = db.query(Application).filter(Application.id == application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    storage = LocalStorageGateway()
    external_file_id = storage.save(file.filename or "document.bin", file.file.read())
    document = ApplicationDocument(
        application_id=application.id,
        company_id=membership.company_id,
        external_file_id=external_file_id,
        original_filename=file.filename or external_file_id,
        content_type=file.content_type or "application/octet-stream",
        uploaded_by_user_id=current_user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/applications/{application_id}/documents", response_model=list[ApplicationDocumentRead])
def list_application_documents(
    application_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[ApplicationDocument]:
    application = db.query(Application).filter(Application.id == application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    return db.query(ApplicationDocument).filter(ApplicationDocument.application_id == application.id).order_by(ApplicationDocument.id.asc()).all()


@router.get("/documents/{document_id}/download")
def download_document(
    document_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
):
    document = db.query(ApplicationDocument).filter(ApplicationDocument.id == document_id, ApplicationDocument.company_id == membership.company_id).first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found in active company")

    file_path = LocalStorageGateway().resolve(document.external_file_id)
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stored file not found")

    return FileResponse(path=file_path, media_type=document.content_type, filename=document.original_filename)


@router.get("/applications/{application_id}/notifications", response_model=list[NotificationLogRead])
def list_application_notifications(
    application_id: int,
    membership: UserCompanyMembership = Depends(get_active_membership),
    db: Session = Depends(get_db),
) -> list[NotificationLog]:
    application = db.query(Application).filter(Application.id == application_id, Application.company_id == membership.company_id).first()
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found in active company")

    return db.query(NotificationLog).filter(NotificationLog.application_id == application.id).order_by(NotificationLog.id.asc()).all()


@router.get("/public/jobs", response_model=list[PublicPositionRead])
def list_public_jobs(db: Session = Depends(get_db)) -> list[Position]:
    return (
        db.query(Position)
        .filter(Position.is_public.is_(True), Position.status == PositionStatus.open)
        .order_by(Position.id.asc())
        .all()
    )


@router.get("/public/jobs/{position_id}", response_model=PublicPositionRead)
def get_public_job(position_id: int, db: Session = Depends(get_db)) -> Position:
    position = (
        db.query(Position)
        .filter(Position.id == position_id, Position.is_public.is_(True), Position.status == PositionStatus.open)
        .first()
    )
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public position not found")
    return position


@router.post("/public/jobs/{position_id}/apply", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def apply_to_public_job(position_id: int, payload: PublicApplicationCreate, db: Session = Depends(get_db)) -> Application:
    position = (
        db.query(Position)
        .options(selectinload(Position.pipeline).selectinload(Pipeline.stages))
        .filter(Position.id == position_id, Position.is_public.is_(True), Position.status == PositionStatus.open)
        .first()
    )
    if position is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Public position not found")

    candidate = db.query(Candidate).filter(Candidate.email == payload.email).first()
    if candidate is None:
        candidate = Candidate(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            summary=payload.summary,
        )
        db.add(candidate)
        db.flush()

    existing_application = (
        db.query(Application)
        .filter(Application.candidate_id == candidate.id, Application.position_id == position.id)
        .first()
    )
    if existing_application is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Candidate already applied to this position")

    first_stage = min(position.pipeline.stages, key=lambda stage: stage.order_index, default=None)
    if first_stage is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pipeline has no stages")

    owner_membership = (
        db.query(UserCompanyMembership)
        .filter(UserCompanyMembership.company_id == position.company_id)
        .order_by(UserCompanyMembership.id.asc())
        .first()
    )
    if owner_membership is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company has no members to own the application trace")

    application = Application(
        company_id=position.company_id,
        position_id=position.id,
        candidate_id=candidate.id,
        current_stage_id=first_stage.id,
        notes=payload.notes,
    )
    db.add(application)
    db.flush()
    db.add(
        ApplicationStageHistory(
            application_id=application.id,
            from_stage_id=None,
            to_stage_id=first_stage.id,
            changed_by_user_id=owner_membership.user_id,
        )
    )
    db.commit()
    return (
        db.query(Application)
        .options(selectinload(Application.stage_history))
        .filter(Application.id == application.id)
        .first()
    )
