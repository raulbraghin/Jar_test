import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.projeto import Projeto
from app.models.user import User
from app.schemas.projeto import ProjetoCreate, ProjetoDetail, ProjetoListItem, ProjetoUpdate

router = APIRouter(prefix="/projetos", tags=["projetos"])


@router.get("/", response_model=List[ProjetoListItem])
def listar_projetos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Projeto)
        .options(
            joinedload(Projeto.configuracao),
            joinedload(Projeto.jarros),
        )
        .where(Projeto.user_id == current_user.id)
        .order_by(desc(Projeto.criado_em))
    )
    projetos = db.scalars(stmt).unique().all()

    lista = []
    for p in projetos:
        tipo_eta = p.configuracao.tipo_eta if p.configuracao else None
        vazao = p.configuracao.vazao_modulo_ls if p.configuracao else None
        tem_otimo = any(j.jarro_otimo for j in p.jarros) if p.jarros else False

        lista.append(
            ProjetoListItem(
                id=p.id,
                nome_projeto=p.nome_projeto,
                cliente=p.cliente,
                autor=p.autor,
                data_ensaio=p.data_ensaio,
                criado_em=p.criado_em,
                tipo_eta=tipo_eta,
                vazao_modulo_ls=vazao,
                total_jarros=len(p.jarros) if p.jarros else 0,
                tem_jarro_otimo=tem_otimo,
            )
        )
    return lista


@router.post("/", response_model=ProjetoDetail, status_code=status.HTTP_201_CREATED)
def criar_projeto(
    payload: ProjetoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = Projeto(
        user_id=current_user.id,
        nome_projeto=payload.nome_projeto,
        cliente=payload.cliente,
        autor=payload.autor or current_user.nome,
        descricao=payload.descricao,
        data_ensaio=payload.data_ensaio or datetime.now(timezone.utc),
    )
    db.add(projeto)
    db.commit()
    db.refresh(projeto)
    return projeto


@router.get("/{id}", response_model=ProjetoDetail)
def obter_projeto(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Projeto)
        .options(
            joinedload(Projeto.configuracao),
            joinedload(Projeto.dosagens),
            joinedload(Projeto.agua_bruta),
            joinedload(Projeto.jarros),
        )
        .where(Projeto.id == id, Projeto.user_id == current_user.id)
    )
    projeto = db.scalar(stmt)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.put("/{id}", response_model=ProjetoDetail)
def atualizar_projeto(
    id: uuid.UUID,
    payload: ProjetoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = db.scalar(
        select(Projeto).where(Projeto.id == id, Projeto.user_id == current_user.id)
    )
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    if payload.nome_projeto is not None:
        projeto.nome_projeto = payload.nome_projeto
    if payload.cliente is not None:
        projeto.cliente = payload.cliente
    if payload.autor is not None:
        projeto.autor = payload.autor
    if payload.descricao is not None:
        projeto.descricao = payload.descricao
    if payload.data_ensaio is not None:
        projeto.data_ensaio = payload.data_ensaio

    db.commit()
    db.refresh(projeto)
    return projeto


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_projeto(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projeto = db.scalar(
        select(Projeto).where(Projeto.id == id, Projeto.user_id == current_user.id)
    )
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    db.delete(projeto)
    db.commit()
    return None
