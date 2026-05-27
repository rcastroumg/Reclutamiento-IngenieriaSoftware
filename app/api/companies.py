from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.deps import get_current_user
from db.session import get_db
from models.recruitment import Company, MembershipRole, User, UserCompanyMembership
from schemas.company import CompanyCreate, CompanyRead, MembershipRead


router = APIRouter(prefix="/companies", tags=["companies"])


@router.post("", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Company:
    existing = db.query(Company).filter((Company.slug == payload.slug) | (Company.name == payload.name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Company already exists")

    company = Company(name=payload.name, slug=payload.slug)
    db.add(company)
    db.flush()
    db.add(UserCompanyMembership(user_id=current_user.id, company_id=company.id, role=MembershipRole.admin))
    db.commit()
    db.refresh(company)
    return company


@router.get("/mine", response_model=list[MembershipRead])
def list_my_companies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserCompanyMembership]:
    return (
        db.query(UserCompanyMembership)
        .filter(UserCompanyMembership.user_id == current_user.id)
        .order_by(UserCompanyMembership.id.asc())
        .all()
    )


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Company:
    company = (
        db.query(Company)
        .join(UserCompanyMembership, UserCompanyMembership.company_id == Company.id)
        .filter(Company.id == company_id, UserCompanyMembership.user_id == current_user.id)
        .first()
    )
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    return company
