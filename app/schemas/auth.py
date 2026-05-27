from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    full_name: str = Field(min_length=3, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: EmailStr
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginInput(BaseModel):
    email: EmailStr
    password: str
