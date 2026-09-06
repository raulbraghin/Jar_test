from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    nome: str = Field(min_length=2, max_length=255)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=255)
    role: str = Field(default="engenheiro", pattern="^(admin|engenheiro)$")


class UserUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=255)
    senha: str | None = Field(default=None, min_length=6, max_length=255)
    role: str | None = Field(default=None, pattern="^(admin|engenheiro)$")
    ativo: bool | None = None
