from fastapi import APIRouter, UploadFile, File
from typing import Annotated
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from datetime import date
import openpyxl
from io import BytesIO

from starlette import status

from models import Employees, User
from database import SessionLocal
from .auth import get_current_user
from .excel_utils import ExcelProcessor
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

@router.get('/employees')
async def get_employee():
	return {'employees': 'authenticated'}


# @router.get('/', status_code=status.HTTP_200_OK)
# async def get_user_employees(user: user_dependency, db: db_dependency):
# 	if user is None:
# 		raise HTTPException(status_code=401, detail='Falha na autenticação')
# 	return db.query(Employees).filter(Employees.manager_email == user.get('username')).all()


@router.get('/', status_code=status.HTTP_200_OK)
async def get_user_employees(user: user_dependency, db: db_dependency):
	"""
	Retorna todos os funcionários da hierarquia do usuário logado
	Inclui funcionários diretos e indiretos (recursivo)
	"""
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# Busca todos os subordinados recursivamente
	all_subordinates = EmployeeHierarchy.get_all_subordinates(user.get('username'), db)
	
	return {
		'manager_email': user.get('username'),
		'total_employees': len(all_subordinates),
		'employees': all_subordinates
	}

@router.get('/direct', status_code=status.HTTP_200_OK)
async def get_direct_reports(user: user_dependency, db: db_dependency):
	"""
	Retorna apenas os funcionários DIRETOS do usuário logado
	"""
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	direct_reports = db.query(Employees).filter(
		Employees.manager_email == user.get('username')
	).all()
	
	return {
		'manager_email': user.get('username'),
		'total_direct_reports': len(direct_reports),
		'employees': direct_reports
	}


@router.get('/hierarchy-tree', status_code=status.HTTP_200_OK)
async def get_hierarchy_tree(user: user_dependency, db: db_dependency):
	"""
	Retorna a hierarquia em formato de árvore
	Mostra a estrutura completa com subordinados aninhados
	"""
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	tree = EmployeeHierarchy.get_hierarchy_tree(user.get('username'), db)
	
	return tree


@router.get('/hierarchy-levels', status_code=status.HTTP_200_OK)
async def get_hierarchy_by_levels(user: user_dependency, db: db_dependency):
	"""
	Retorna os funcionários organizados por nível hierárquico
	Nível 1: funcionários diretos
	Nível 2: funcionários dos funcionários diretos
	E assim por diante...
	"""
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	levels = EmployeeHierarchy.get_hierarchy_levels(user.get('username'), db)
	
	return levels


@router.post('/employee', status_code=status.HTTP_201_CREATED)
async def create_employee(user: user_dependency, db: db_dependency, employee_request: EmployeesRequest):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# busca os dados do manager pelo e-mail
	user_data = db.query(User).filter(User.email == user.get('username')).first()
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	# Verifica se o employee_id já existe
	existing_id = db.query(Employees).filter(Employees.employee_id == employee_request.employee_id).first()
	if existing_id is not None:
		raise HTTPException(status_code=400, detail='ID de funcionário já cadastrado no sistema')
	
	# Verifica se o employee_email já existe
	existing_email = db.query(Employees).filter(Employees.employee_email == employee_request.employee_email).first()
	if existing_email is not None:
		raise HTTPException(status_code=400, detail='E-mail já cadastrado no sistema')

	# cadastra o novo employee
	employee_model = Employees(
		**employee_request.model_dump(), 
		manager_email=user.get('username'),
		manager_name=f'{user_data.name} {user_data.surname}'
	)

	db.add(employee_model)
	db.commit()
	db.refresh(employee_model)
	
	return employee_model


def validate_user_permissions(user: dict, db: Session) -> User:
	"""Valida se o usuário tem permissão para fazer upload"""
	user_data = db.query(User).filter(User.email == user.get('username')).first()
	if user_data is None:
		raise HTTPException(status_code=404, detail='Usuário não encontrado')
	
	if user_data.role not in ['ADMIN', 'RH']:
		raise HTTPException(status_code=403, detail='Apenas usuários ADMIN ou RH podem fazer upload de funcionários')
	
	return user_data


def process_employee_row(row_data: dict, row_index: int, db: Session) -> tuple:
	"""
	Processa uma linha de dados de funcionário
	
	Returns:
		Tupla (status, message) onde status pode ser 'added', 'updated', 'skipped'
	"""
	# Valida campos obrigatórios
	if not ExcelProcessor.validate_required_fields(row_data):
		if any(row_data.values()):
			return ('skipped', f'Linha {row_index}: Campos obrigatórios faltando')
		return ('skipped', None)  # Linha vazia, ignora silenciosamente
	
	# Converte employee_id
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