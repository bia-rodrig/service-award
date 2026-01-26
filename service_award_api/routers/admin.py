from typing import Annotated
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path, UploadFile, File
from starlette import status

import openpyxl
from io import BytesIO

from models import User, Employees
from database import SessionLocal
from security import bcrypt_context, DEFAULT_PASSWORD
from .auth import get_current_user
from utils.excel_utils import ExcelProcessor


router = APIRouter(
	prefix='/admin',
	tags=['admin']
)

class UserResponse(BaseModel):
	id: int
	email: EmailStr
	name: str
	surname: str
	role: str
	is_active: bool
	class Config:
		from_attributes = True

class UserUpdateRequest(BaseModel):
	role: str
	
	@field_validator('role')
	def validate_role(cls, v):
		allowed_roles = ['ADMIN', 'RH', 'USER']
		if v.upper() not in allowed_roles:
			raise ValueError(f'Role deve ser um dos valores: {", ".join(allowed_roles)}')
		return v.upper()



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

@router.get('/', response_model=list[UserResponse], status_code=status.HTTP_200_OK)
async def read_all_users(user: user_dependency, db: db_dependency):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	if user.get('role') not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem listar todos os usuários.')
	
	return db.query(User).all()

@router.put('/{user_id}', status_code=status.HTTP_200_OK)
async def update_user(
	user: user_dependency, 
	db: db_dependency, 
	user_update: UserUpdateRequest,
	user_id: int = Path(gt=0)
):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	if user.get('role') not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem atualizar usuários.')
	
	# Busca o usuário
	user_model = db.query(User).filter(User.id == user_id).first()
	if user_model is None:
		raise HTTPException(status_code=404, detail=f'Usuário de id "{user_id}" não encontrado.')
	
	# Atualiza a role
	user_model.role = user_update.role
	
	db.commit()
	db.refresh(user_model)
	
	return {'message': f'Permissão atualizada para {user_update.role}', 'user': user_model}

@router.put('/reset_password/{user_id}', status_code=status.HTTP_200_OK)
async def reset_password(user: user_dependency, db: db_dependency, user_id: int = Path(gt=0)):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	if user.get('role') not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem resetar senhas.')
	
	# Verifica se o usuário existe
	user_model = db.query(User).filter(User.id == user_id).first()
	if user_model is None:
		raise HTTPException(status_code=404, detail=f'Usuário de id "{user_id}" não encontrado.')
	
	# Usa a senha padrão centralizada
	hashed_password = bcrypt_context.hash(DEFAULT_PASSWORD)

	# Atualiza senha e desativa conta (para forçar troca de senha)
	result = db.query(User).filter(User.id == user_id).update({
		User.hashed_password: hashed_password,
		User.is_active: False  # ← DESATIVA = PRECISA TROCAR SENHA
	}, synchronize_session=False)
	
	if result == 0:
		raise HTTPException(status_code=404, detail=f'Usuário de id "{user_id}" não encontrado.')

	db.commit()
	
	return {'message': f'Senha resetada para padrão. Usuário deverá trocar senha no próximo login.'}

@router.delete('/clear_all', status_code=status.HTTP_200_OK)
async def clear_all_employees(user: user_dependency, db: db_dependency):
	# apaga todos os funcionários da tabela employees
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	user_data = db.query(User).filter(User.email == user.get('username')).first()
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	if user_data.role not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem zerar o banco de dados')
	
	try:
		total_employees = db.query(Employees).count()
		db.query(Employees).delete()
		db.commit()

		return {
			'message': 'Todos os funcionários foram removidos com sucesso',
			'total_deleted': total_employees
		}
	except Exception as e:
		db.rollback()
		raise HTTPException(
			status_code=500, 
			detail=f'Erro ao limpar a tabela: {str(e)}'
		)


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


def validate_user_permissions(user: dict, db: Session) -> User:
	# Valida se o usuário tem permissão para fazer upload do arquivo
	user_data = db.query(User).filter(User.email == user.get('username')).first()
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	if user_data.role not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem fazer upload de funcionários')
	
	return user_data


def process_employee_row(row_data: dict, row_index: int, db: Session) -> tuple:
	# Processa uma linha de dados de funcionário
	# retorna uma Tupla (status, message) onde status pode ser 'added', 'updated', 'skipped'

	# Valida campos obrigatórios
	if not ExcelProcessor.validate_required_fields(row_data):
		if any(row_data.values()):
			return ('skipped', f'Linha {row_index}: Campos obrigatórios faltando')
		return ('skipped', None)  # Linha vazia, ignora silenciosamente
	
	# Converte employee_id para integer
	employee_id = ExcelProcessor.parse_employee_id(row_data['employee_id'])
	if employee_id is None:
		return ('skipped', f'Linha {row_index}: Employee ID inválido ({row_data["employee_id"]})')
	
	# Converte data
	hire_date = ExcelProcessor.parse_date(row_data['hire_date'])
	if hire_date is None:
		return ('skipped', f'Linha {row_index}: Formato de data inválido ({row_data["hire_date"]})')
	
	# Normaliza dados
	employee_email_upper = ExcelProcessor.normalize_text(row_data['employee_email'])
	employee_name_upper = ExcelProcessor.normalize_text(row_data['employee_name'])
	manager_name_upper = ExcelProcessor.normalize_text(row_data['manager_name'])
	manager_email_upper = ExcelProcessor.normalize_text(row_data['manager_email'])
	
	# Verifica se o employee_email já existe
	existing_employee = db.query(Employees).filter(Employees.employee_email == employee_email_upper).first()
	
	if existing_employee:
		# Atualiza as informações do funcionário existente
		existing_employee.employee_id = employee_id
		existing_employee.employee_name = employee_name_upper
		existing_employee.hire_date = hire_date
		existing_employee.manager_name = manager_name_upper
		existing_employee.manager_email = manager_email_upper
		return ('updated', None)
	else:
		# Verifica se o employee_id já existe (para evitar conflito)
		existing_id = db.query(Employees).filter(Employees.employee_id == employee_id).first()
		if existing_id:
			return ('skipped', f'Linha {row_index}: Employee ID {employee_id} já existe com outro e-mail')
		
		# Cria o novo employee
		new_employee = Employees(
			employee_id=employee_id,
			employee_name=employee_name_upper,
			employee_email=employee_email_upper,
			hire_date=hire_date,
			manager_name=manager_name_upper,
			manager_email=manager_email_upper
		)
		
		db.add(new_employee)
		return ('added', None)


@router.post('/upload-excel', status_code=status.HTTP_201_CREATED)
async def upload_employees_excel(
	user: user_dependency, 
	db: db_dependency, 
	file: UploadFile = File(...)
):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# Valida permissões do usuário
	validate_user_permissions(user, db)
	
	# Verifica se o arquivo é Excel
	if not file.filename.endswith(('.xlsx', '.xls')):
		raise HTTPException(status_code=400, detail='O arquivo deve ser do tipo Excel (.xlsx ou .xls)')
	
	try:
		# Lê o arquivo Excel
		contents = await file.read()
		workbook = openpyxl.load_workbook(BytesIO(contents))
		sheet = workbook.active
		
		# Encontra o cabeçalho
		header_row_idx, header_row = ExcelProcessor.find_header_row(sheet)
		if header_row_idx is None:
			raise HTTPException(status_code=400, detail='Não foi possível identificar o cabeçalho no arquivo Excel')
		
		# Mapeia as colunas
		column_map = ExcelProcessor.map_columns(header_row)
		
		# Valida se todas as colunas foram encontradas
		is_valid, missing_columns = ExcelProcessor.validate_columns(column_map)
		if not is_valid:
			raise HTTPException(
				status_code=400, 
				detail=f'Colunas não encontradas: {", ".join(missing_columns)}'
			)
		
		# Contadores
		employees_added = 0
		employees_updated = 0
		employees_skipped = 0
		errors = []
		
		# Processa cada linha
		for index, row in enumerate(sheet.iter_rows(min_row=header_row_idx + 1, values_only=True), start=header_row_idx + 1):
			try:
				# Pula linhas completamente vazias
				if not any(row):
					continue
				
				# Extrai dados da linha
				row_data = ExcelProcessor.extract_row_data(row, column_map)
				
				# Processa a linha
				status_result, error_message = process_employee_row(row_data, index, db)
				
				if status_result == 'added':
					employees_added += 1
				elif status_result == 'updated':
					employees_updated += 1
				elif status_result == 'skipped':
					employees_skipped += 1
					if error_message:
						errors.append(error_message)
				
			except Exception as e:
				errors.append(f'Linha {index}: Erro ao processar - {str(e)}')
				employees_skipped += 1
				continue
		
		# Commit de todas as alterações
		db.commit()
		
		return {
			'message': 'Upload processado com sucesso',
			'header_found_at_row': header_row_idx,
			'employees_added': employees_added,
			'employees_updated': employees_updated,
			'employees_skipped': employees_skipped,
			'total_errors': len(errors),
			'errors': errors if errors else None
		}
		
	except HTTPException:
		raise
	except Exception as e:
		db.rollback()
		raise HTTPException(status_code=500, detail=f'Erro ao processar o arquivo: {str(e)}')


	