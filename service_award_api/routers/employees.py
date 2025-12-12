from fastapi import APIRouter
from typing import Annotated, Optional
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from datetime import date

from starlette import status

from models import Employees, User
from database import SessionLocal
from .auth import get_current_user
from .employee_utils import EmployeeHierarchy

router = APIRouter(
	prefix='/employees',
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
	employee_email: EmailStr
	hire_date: date


class EmployeesUpdateRequest(BaseModel):
	employee_id: Optional[int] = Field(None, gt=0)
	employee_name: Optional[str] = None
	employee_email: Optional[EmailStr] = None
	hire_date: Optional[date] = None

# retorna todos os funcionários do usuário logado
@router.get('/', status_code=status.HTTP_200_OK)
async def get_hierarchy_tree(user: user_dependency, db: db_dependency):
	# retorna a hierarquia aninhada
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	tree = EmployeeHierarchy.get_hierarchy_tree(user.get('username'), db)
	
	return tree

#cria um employee
@router.post('/employee', status_code=status.HTTP_201_CREATED)
async def create_employee(user: user_dependency, db: db_dependency, employee_request: EmployeesRequest):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# busca os dados do manager pelo e-mail
	user_data = db.query(User).filter(User.email == user.get('username').upper()).first()
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	# Verifica se o employee_id já existe
	existing_id = db.query(Employees).filter(Employees.employee_id == employee_request.employee_id).first()
	if existing_id is not None:
		raise HTTPException(status_code=400, detail='ID de funcionário já cadastrado no sistema')
	
	# Verifica se o employee_email já existe
	existing_email = db.query(Employees).filter(Employees.employee_email == employee_request.employee_email.upper()).first()
	if existing_email is not None:
		raise HTTPException(status_code=400, detail='E-mail já cadastrado no sistema')

	# cadastra o novo employee
	employee_model = Employees(
		employee_id=employee_request.employee_id,
		employee_name=employee_request.employee_name.upper(), 
		employee_email=employee_request.employee_email.upper(),
		hire_date=employee_request.hire_date,
		manager_email=user.get('username').upper(),
		manager_name=f'{user_data.name} {user_data.surname}'
	)

	db.add(employee_model)
	db.commit()
	db.refresh(employee_model)
	
	return employee_model

# atualizar dados employee
@router.put('/{employee_id}', status_code=status.HTTP_204_NO_CONTENT)
async def update_employee(user: user_dependency, db: db_dependency, employee_request: EmployeesRequest, employee_id: int = Path(gt=0)):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação.')
	
	employee_model = db.query(Employees).filter(Employees.id == employee_id).filter(Employees.manager_email == user.get('username')).first()

	if employee_model is None:
		raise HTTPException(status_code=404, detail = 'Colaborador não encontrado.')
	
	employee_model.employee_id = employee_request.employee_id
	employee_model.employee_name=employee_request.employee_name.upper(), 
	employee_model.employee_email=employee_request.employee_email.upper(),
	employee_model.hire_date=employee_request.hire_date

	db.add(employee_model)
	db.commit()
	db.refresh(employee_model)




@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(user: user_dependency, db: db_dependency, employee_id: int = Path(gt=0)):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	employee_model = db.query(Employees).filter(Employees.id == employee_id)\
	.filter(Employees.manager_email == user.get('username').upper()).first()

	if employee_model is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado.')
	
	db.query(Employees).filter(Employees.id == employee_id).delete()
	db.commit()



'''
Falta:
- botão pra enviar e-mail
- adicionar coluna para marcar que o usuário deve trocar a senha
'''
