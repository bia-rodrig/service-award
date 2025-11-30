from fastapi import APIRouter, Depends
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, field_validator, EmailStr
import enum
from passlib.context import CryptContext
from starlette import status
from sqlalchemy.orm import Session

from models import User
from database import SessionLocal

router = APIRouter()

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

class UserRole(str, enum.Enum):
	admin = "ADMIN"
	rh = "RH"
	user = "USER"

class CreateUserRequest(BaseModel):
	email: EmailStr
	name: str
	surname: str
	password: str
	role: UserRole = UserRole.user

	@field_validator("role", mode="before")
	def normalize_role(cls, v):
		if isinstance(v, str):
			v = v.upper()
			return v

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

db_dependency = Annotated[Session, Depends(get_db)]

def authenticate_user(email: EmailStr, password: str, db):
	user = db.query(User).filter(User.email == email.upper()).first()
	if not user:
		return False
	#se encontrar o e-mail do usuario, verifica a senha
	if not bcrypt_context.verify(password, user.hashed_password):
		return False
	
	return True


@router.post("/auth/", status_code = status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: CreateUserRequest):
	create_user_model = User(
		email = create_user_request.email.upper(),
		name = create_user_request.name.upper(),
		surname = create_user_request.surname.upper(),
		hashed_password = bcrypt_context.hash(create_user_request.password),
		is_active = True,
		role = create_user_request.role.upper()
	)

	db.add(create_user_model)
	db.commit()
	return {'message': 'Usuário criado com sucesso', 'id': create_user_model.id}

@router.post("/token/")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
	user = authenticate_user(form_data.username.upper(), form_data.password, db)
	
	if not user:
		return 'Falha na autenticação'
	return 'Autenticado com sucesso'