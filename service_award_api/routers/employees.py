from typing import Annotated, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from datetime import date


from starlette import status

from models import Employees, User
from database import SessionLocal
from .auth import get_current_user
from utils.employee_utils import EmployeeHierarchy

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

# === Schemas ===

class EmployeesRequest(BaseModel):
	employee_id: int = Field(gt=0, description='ID deve ser maior que 0')
	employee_name: str
	employee_email: EmailStr
	hire_date: date

	@field_validator('employee_email', mode='before')
	def normalize_email(cls, v):
		return v.upper() if isinstance(v, str) else v
	
	@field_validator('employee_name', mode='before')
	def normalize_name(cls, v):
		return v.upper() if isinstance(v, str) else v

# Schema para atualizar (todos campos opcionais)
class EmployeesUpdateRequest(BaseModel):
	employee_id: Optional[int] = Field(None, gt=0)
	employee_name: Optional[str] = None
	employee_email: Optional[EmailStr] = None
	hire_date: Optional[date] = None
	
	@field_validator('employee_email', mode='before')
	def normalize_email(cls, v):
		return v.upper() if v and isinstance(v, str) else v
	
	@field_validator('employee_name', mode='before')
	def normalize_name(cls, v):
		return v.upper() if v and isinstance(v, str) else v

# === ENDPOINTS ===

# retorna todos os funcionários do usuário logado
@router.get('/', status_code=status.HTTP_200_OK)
async def get_hierarchy_tree(user: user_dependency, db: db_dependency):
	# retorna a hierarquia aninhada
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	tree = EmployeeHierarchy.get_hierarchy_tree(user.get('username'), db)
	
	return tree

# cria um employee
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
		employee_name=employee_request.employee_name.upper(),  # Padroniza nome também
		employee_email=employee_request.employee_email.upper(),  # ← IMPORTANTE
		hire_date=employee_request.hire_date,
		manager_email=user.get('username').upper(),  # ← ADICIONA .upper()
		manager_name=f'{user_data.name} {user_data.surname}'
	)
		
	db.add(employee_model)
	db.commit()
	db.refresh(employee_model)
	
	return employee_model




# apaga um funcionário
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


# atualizar dados employee
@router.put('/{employee_id}', status_code=status.HTTP_200_OK)
async def update_employee(
	user: user_dependency, 
	db: db_dependency, 
	employee_request: EmployeesUpdateRequest,  # ← USA O NOVO SCHEMA
	employee_id: int = Path(gt=0)
):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação.')
	
	employee_model = db.query(Employees).filter(
		Employees.id == employee_id
	).filter(
		Employees.manager_email == user.get('username').upper()  # ← ADICIONA .upper()
	).first()

	if employee_model is None:
		raise HTTPException(status_code=404, detail='Colaborador não encontrado.')
	
	# Atualiza apenas os campos que foram enviados
	update_data = employee_request.model_dump(exclude_unset=True)  # ← IGNORA CAMPOS NÃO ENVIADOS
	
	# Validações antes de atualizar
	if 'employee_id' in update_data:
		# Verifica se o novo employee_id já existe em outro registro
		existing_id = db.query(Employees).filter(
			Employees.employee_id == update_data['employee_id'],
			Employees.id != employee_id  # ← Exclui o registro atual
		).first()
		if existing_id:
			raise HTTPException(status_code=400, detail='ID de funcionário já cadastrado em outro registro')
	
	if 'employee_email' in update_data:
		# Verifica se o novo email já existe em outro registro
		existing_email = db.query(Employees).filter(
			Employees.employee_email == update_data['employee_email'],
			Employees.id != employee_id  # ← Exclui o registro atual
		).first()
		if existing_email:
			raise HTTPException(status_code=400, detail='E-mail já cadastrado em outro registro')
	
	# Atualiza os campos
	for field, value in update_data.items():
		setattr(employee_model, field, value)
	
	db.commit()
	db.refresh(employee_model)
	
	return employee_model


'''
Falta:
- botão pra enviar e-mail
- adicionar coluna para marcar que o usuário deve trocar a senha
'''
