from fastapi import APIRouter
from typing import Annotated
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from datetime import date

from starlette import status

from models import Employees, User
from database import SessionLocal
from .auth import get_current_user

router = APIRouter(
	prefix= '/employees',
	tags=['employees']
)

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class EmployeesRequest(BaseModel):
	employee_id: int
	employee_name: str
	employee_email: EmailStr  # CORRIGIDO: nome e sintaxe
	hire_date: date

@router.get('/employees')
async def get_employee():
	return {'employees': 'authenticated'}


@router.get('/', status_code=status.HTTP_200_OK)
async def get_user_employees(user: user_dependency, db: db_dependency):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	return db.query(Employees).filter(Employees.manager_email == user.get('username')).all()  # CORRIGIDO


@router.post('/employee', status_code=status.HTTP_201_CREATED)
async def create_employee(user: user_dependency, db: db_dependency, employee_request: EmployeesRequest):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# busca os dados do manager pelo e-mail
	user_data = db.query(User).filter(User.email == user.get('username')).first()
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	# verifica se o id do funcionário já está cadastrado no sistema
	existing_id = db.query(Employees).filter(Employees.employee_id == employee_request.employee_id).first()
	if existing_id is not None:
		raise HTTPException(status_code=400, detail='ID de funcionário já cadastrado no sistema')
	
	# verifica se o e-mail do funcionário já está cadastrado no sistema
	existing_email = db.query(Employees).filter(Employees.employee_email == employee_request.employee_email).first()
	if existing_email is not None:
		raise HTTPException(status_code=400, detail='E-mail de funcionário já cadastrado no sistema')

	# cadastra o novo employee
	employee_model = Employees(
		**employee_request.model_dump(), 
		manager_email=user.get('username'),  # CORRIGIDO
		manager_name=f'{user_data.name} {user_data.surname}'
	)
	
	db.add(employee_model)
	db.commit()
	db.refresh(employee_model)
	
	return employee_model