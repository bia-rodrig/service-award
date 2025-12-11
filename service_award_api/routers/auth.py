from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Path
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

class UserResponse(BaseModel):
	id: int
	email: EmailStr
	name: str
	surname: str
	role: str
	class Config:
		from_attributes = True

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

## Funções
# autentica o usuario
def authenticate_user(email: EmailStr, password: str, db):
	user = db.query(User).filter(User.email == email.upper()).first()
	if not user:
		return False
	#se encontrar o e-mail do usuario, verifica a senha
	if not bcrypt_context.verify(password, user.hashed_password):
		return False
	
	return user

# cria chave de acesso
def create_access_token(username: str, user_id: str, role: str, expires_delta: timedelta):
	encode = {'sub': username, 'id': user_id, 'role': role}
	expires = datetime.now(timezone.utc) + expires_delta
	encode.update({'exp': expires})
	return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

# pega o usuario que está logado
async def get_current_user(token: Annotated[str, Depends(oauth2_bearer)]):
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		email: str = payload.get('sub')
		user_id: int = payload.get('id')
		user_role: str = payload.get('role')

		if email is None or user_id is None:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details='Não foi possível validar o usuário')
		return {'username': email, 'id': user_id, 'role': user_role}
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details='Não foi possível validar o usuário')

user_dependency = Annotated[dict, Depends(get_current_user)] # precisa estar abaixo da função get_current_user

## ENDPOINTS
# cria um novo usuário - aberto para todos
@router.post("/", status_code = status.HTTP_201_CREATED)
async def create_user(db: db_dependency, create_user_request: CreateUserRequest):
	existing_email = db.query(User).filter(User.email == create_user_request.email.upper()).first()
	if existing_email is not None:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='E-mail já cadastrado no sistema')
	
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

#cria o access token no login
@router.post("/token")
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
	user = authenticate_user(form_data.username.upper(), form_data.password, db)
	
	if not user:
		return 'Falha na autenticação'
	
	token = create_access_token(user.email, user.id, user.role, timedelta(days=1))
	return {'access_token': token, 'token_type': 'bearer'}

# deleta um usuario
@router.delete('/{user_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	if user.get('role') not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem remover usuários.')

	user_model = db.query(User).filter(User.id == user_id).first()
	
	if user_model is None:
		raise HTTPException(status_code=404, detail=f'Usuário de id "{user_id}" não encontrado.')

	db.query(User).filter(User.id == user_id).delete()
	db.commit()

#lista todos os usuarios
@router.get('/', response_model=list[UserResponse], status_code=status.HTTP_200_OK)
async def read_all_users(user: user_dependency, db: db_dependency):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	if user.get('role') not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem listar todos os usuários.')
	
	return db.query(User).all()
