from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from core.security import decode_token
from db.session import get_db
from models.recruitment import Company, User, UserCompanyMembership


bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    try:
        payload = decode_token(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

    user = db.query(User).filter(User.id == int(payload["sub"]), User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_active_membership(
    x_company_id: int | None = Header(default=None, alias="X-Company-Id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserCompanyMembership:
    if x_company_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="X-Company-Id header is required")

    membership = (
        db.query(UserCompanyMembership)
        .join(Company, Company.id == UserCompanyMembership.company_id)
        .filter(
            UserCompanyMembership.user_id == current_user.id,
            UserCompanyMembership.company_id == x_company_id,
            Company.is_active.is_(True),
        )
        .first()
    )
    if membership is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User does not belong to the active company")
    return membership
