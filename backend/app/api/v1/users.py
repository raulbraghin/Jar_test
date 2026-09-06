import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import get_current_user, hash_password, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.user import UserCreate, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), admin: User = Depends(require_role("admin"))):
    return db.scalars(select(User).order_by(User.nome)).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    """APENAS ADMIN — cria usuário já com e-mail verificado (sem disparo de e-mail)."""
    existing = db.scalar(select(User).where(func.lower(User.email) == payload.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user = User(
        nome=payload.nome,
        email=payload.email.lower(),
        senha_hash=hash_password(payload.senha),
        role=payload.role,
        email_verificado=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    try:
        user = db.get(User, uuid.UUID(user_id))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    data = payload.model_dump(exclude_unset=True)
    if "senha" in data:
        data["senha_hash"] = hash_password(data.pop("senha"))
    if user.id == admin.id and data.get("ativo") is False:
        raise HTTPException(
            status_code=400, detail="Não é possível desativar o próprio usuário"
        )
    for key, value in data.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    try:
        user = db.get(User, uuid.UUID(user_id))
    except (ValueError, AttributeError):
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Não é possível excluir o próprio usuário")
    db.delete(user)
    db.commit()
