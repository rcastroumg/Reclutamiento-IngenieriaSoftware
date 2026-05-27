from pydantic import BaseModel, ConfigDict, Field

from models.recruitment import MembershipRole


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    slug: str = Field(min_length=2, max_length=150)


class CompanyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    is_active: bool


class MembershipRead(BaseModel):
    company: CompanyRead
    role: MembershipRole
