from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import create_access_token, get_password_hash, verify_password
from db.session import get_db
from models.recruitment import User
from schemas.auth import LoginInput, Token, UserCreate, UserRead


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginInput, db: Session = Depends(get_db)) -> Token:
    user = db.query(User).filter(User.email == payload.email, User.is_active.is_(True)).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return Token(access_token=create_access_token(str(user.id)))
