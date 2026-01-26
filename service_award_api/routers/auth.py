from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, field_validator, EmailStr
import enum

from starlette import status
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from models import User
from database import SessionLocal
from security import SECRET_KEY, ALGORITHM, bcrypt_context

router = APIRouter(
	prefix='/auth',
	tags=['auth']
)

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
	is_active: bool

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
def create_access_token(username: str, user_id: str, role: str, is_active: bool, expires_delta: timedelta):
	encode = {'sub': username, 'id': user_id, 'role': role, 'is_active': is_active}
	expires = datetime.now(timezone.utc) + expires_delta
	encode.update({'exp': expires})
	return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

# pega o usuario que está logado
async def get_current_user(request: Request):
	# Pega o token do cookie
	token = request.cookies.get("access_token")
	if not token:
		raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Não foi possível validar o usuário - token não encontrado'
        )
	try:
		payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
		email: str = payload.get('sub')
		user_id: int = payload.get('id')
		user_role: str = payload.get('role')
		is_active: bool = payload.get('is_active', True)

		if email is None or user_id is None:
			raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details='Não foi possível validar o usuário')
		return {'username': email, 'id': user_id, 'role': user_role, 'is_active': is_active }
	except JWTError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, details='Não foi possível validar o usuário')

user_dependency = Annotated[dict, Depends(get_current_user)] # precisa estar abaixo da função get_current_user

class ChangePasswordRequest(BaseModel):
	email: EmailStr
	current_password: str #senha padrão informada peloa dmin
	new_password: str

	@field_validator("new_password")
	def validate_new_password(cls, v):
		if len(v) < 6:
			raise ValueError("A nova senha deve ter no mínimo 6 caracteres")
		
		return v

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

#cria o access token no login - é a função de login
@router.post("/token")
async def login_for_access_token(response: Response, form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
	user = authenticate_user(form_data.username.upper(), form_data.password, db)
	
	if not user:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail='E-mail ou senha incorretos',
			headers={"WWW-Authenticate": "Bearer"}
		)
	
	if not user.is_active:
		return{
			'access_token': None,
			'token_type': 'bearer',
			'is_active': False,
			'message': 'Sua conta está inativa. Troque a senha para ativá-la.'
		}
	
	token = create_access_token(user.email, user.id, user.role, user.is_active, timedelta(days=1))

	#salva o token no cookie
	response.set_cookie(
        key="access_token",           # Nome do cookie
        value=token,                   # O token JWT
        httponly=True,                 # JavaScript não consegue acessar
        secure=False,                  # False em dev, True em produção (HTTPS)
        samesite="lax",               # Proteção contra CSRF
        max_age=86400                  # 1 dia (em segundos)
    )

	return {'token_type': 'bearer', 'is_active': user.is_active, 'role': user.role} # retorna a role

@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(db: db_dependency, change_request: ChangePasswordRequest):
	user = authenticate_user(change_request.email, change_request.current_password, db)

	if not user:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail='Email ou senha atual incorretos'
		)

	# verifica se o usuário está inativo e precisa trocar a senha
	if user.is_active:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Usuário já está ativo. Envie e-mail para laboratorio@espn.com para resetar usa senha.')
	
	user.hashed_password = bcrypt_context.hash(change_request.new_password)
	user.is_active = True

	db.commit()
	db.refresh(user)

	return {'message': 'Senha alterada com sucesso. Faça login com sua nova senha.'}

# Endpoint para verificar se o usuário está autenticado
@router.get("/verify", status_code=status.HTTP_200_OK)
async def verify_token(user: user_dependency):
    # Se chegou aqui, o token é válido (get_current_user já validou)
    return {
        'authenticated': True,
        'user': user
    }

# Endpoint para buscar dados completos do usuário logado
@router.get("/me", status_code=status.HTTP_200_OK)
async def get_logged_user_data(user: user_dependency, db: db_dependency):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# Busca os dados completos do usuário no banco
	user_data = db.query(User).filter(User.email == user.get('username')).first()
	
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	return {
		'id': user_data.id,
		'email': user_data.email,
		'name': user_data.name,
		'surname': user_data.surname,
		'role': user_data.role,
		'is_active': user_data.is_active
	}