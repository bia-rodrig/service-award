from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, field_validator, EmailStr
import enum
from passlib.context import CryptContext
from starlette import status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from models import User
from database import SessionLocal

router = APIRouter(
	prefix='/auth',
	tags=['auth']
)

SECRET_KEY = "CauseMauiCanDoAnythingButFloat"
ALGORITHM = 'HS256'

bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

oauth2_bearer = OAuth2PasswordBearer(tokenUrl='auth/token')

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

class Token(BaseModel):
	access_token: str
	token_type: str

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
	
	return user

def create_access_token(username: str, user_id: str, expires_delta: timedelta):
	encode = {'sub': username, 'id': user_id}
	expires = datetime.now(timezone.utc) + expires_delta
	encode.update({'exp': expires})
	return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		email: str = payload.get('sub')
		user_id: int = payload.get('id')

		if email is None or user_id is None:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details='Não foi possível validar o usuário')
		return {'username': email, 'id': user_id}
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details='Não foi possível validar o usuário')

@router.post("/", status_code = status.HTTP_201_CREATED)
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
	
	token = create_access_token(user.email, user.id, timedelta(days=1))
	return {'access_token': token, 'token_type': 'bearer'}