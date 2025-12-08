from datetime import datetime
from typing import Tuple, Optional, List, Dict, Any
from openpyxl.worksheet.worksheet import Worksheet

class ExcelProcessor:
	"""Classe para processar arquivos Excel de funcionários"""
	
	@staticmethod
	def find_header_row(sheet: Worksheet) -> Tuple[Optional[int], Optional[tuple]]:
		"""
		Encontra a linha que contém os cabeçalhos
		
		Args:
			sheet: Planilha do Excel
			
		Returns:
			Tupla com (índice da linha, conteúdo da linha) ou (None, None) se não encontrar
		"""
		expected_headers = [
			'employee id', 
			'employee', 
			'email', 
			'adjusted service date', 
			'manager', 
			'manager email'
		]
		
		for row_idx, row in enumerate(sheet.iter_rows(values_only=True), start=1):
			if not row:
				continue
			
			# Converte para lowercase e remove espaços extras
			row_lower = [str(cell).lower().strip() if cell else '' for cell in row]
			
			# Verifica se contém os headers esperados
			matches = sum(1 for header in expected_headers if any(header in cell for cell in row_lower))
			if matches >= 4:  # Se encontrar pelo menos 4 dos headers esperados
				return row_idx, row
		
		return None, None
	
	@staticmethod
	def find_column_index(header_row: tuple, keywords: List[str]) -> Optional[int]:
		"""
		Encontra o índice da coluna baseado em palavras-chave
		Busca pela correspondência mais específica primeiro
		
		Args:
			header_row: Linha de cabeçalho
			keywords: Lista de palavras-chave para buscar (ordenadas por especificidade)
			
		Returns:
			Índice da coluna ou None se não encontrar
		"""
		# Primeiro tenta encontrar correspondência exata
		for idx, cell in enumerate(header_row):
			if cell:
				cell_lower = str(cell).lower().strip()
				for keyword in keywords:
					if cell_lower == keyword.lower():
						return idx
		
		# Se não encontrar correspondência exata, tenta correspondência parcial
		for idx, cell in enumerate(header_row):
			if cell:
				cell_lower = str(cell).lower().strip()
				for keyword in keywords:
					if keyword.lower() in cell_lower:
						return idx
		
		return None
		
	@staticmethod
	def map_columns(header_row: tuple) -> Dict[str, Optional[int]]:
		"""
		Mapeia as colunas do Excel baseado no cabeçalho
		IMPORTANTE: As keywords são verificadas na ordem, da mais específica para a mais genérica
		
		Args:
			header_row: Linha de cabeçalho
			
		Returns:
			Dicionário com o mapeamento das colunas
		"""
		find_col = ExcelProcessor.find_column_index
		
		return {
			# Busca primeiro por termos específicos, depois genéricos
			'employee_id': find_col(header_row, ['employee id', 'employee_id', 'employeeid', 'emp id', 'id do funcionário']),
			'employee_name': find_col(header_row, ['employee name', 'nome do funcionário', 'employee', 'nome', 'funcionário']),
			'employee_email': find_col(header_row, ['email - primary work', 'email - primary', 'primary email', 'employee email', 'email do funcionário', 'email']),
			'hire_date': find_col(header_row, ['adjusted service date', 'service date', 'hire date', 'start date', 'data de admissão', 'data de contratação', 'date']),
			'manager_name': find_col(header_row, ['manager name', 'nome do gestor', 'manager', 'gestor']),
			'manager_email': find_col(header_row, ['manager email', 'email do gestor', 'manager e-mail', 'gestor email'])
		}
	
	@staticmethod
	def validate_columns(column_map: Dict[str, Optional[int]]) -> Tuple[bool, List[str]]:
		"""
		Valida se todas as colunas necessárias foram encontradas
		
		Args:
			column_map: Mapeamento das colunas
			
		Returns:
			Tupla com (válido, lista de colunas faltando)
		"""
		missing = []
		column_names = {
			'employee_id': 'Employee ID',
			'employee_name': 'Employee Name',
			'employee_email': 'Employee Email',
			'hire_date': 'Hire Date',
			'manager_name': 'Manager Name',
			'manager_email': 'Manager Email'
		}
		
		for key, value in column_map.items():
			if value is None:
				missing.append(column_names[key])
		
		return len(missing) == 0, missing
	
	@staticmethod
	def parse_date(date_value: Any) -> Optional[datetime]:
		"""
		Converte diferentes formatos de data para datetime.date
		
		Args:
			date_value: Valor da data (pode ser string, datetime, etc)
			
		Returns:
			Objeto date ou None se não conseguir converter
		"""
		if isinstance(date_value, datetime):
			return date_value.date()
		
		if isinstance(date_value, str):
			date_str = date_value.strip()
			# Tenta vários formatos de data
			for date_format in ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y', '%m/%d/%Y']:
				try:
					return datetime.strptime(date_str, date_format).date()
				except ValueError:
					continue
			return None
		
		# Tenta converter se for outro tipo
		try:
			return date_value.date() if hasattr(date_value, 'date') else None
		except:
			return None
	
	@staticmethod
	def parse_employee_id(employee_id: Any) -> Optional[int]:
		"""
		Converte employee_id para inteiro
		
		Args:
			employee_id: Valor do employee_id
			
		Returns:
			Inteiro ou None se não conseguir converter
		"""
		try:
			if isinstance(employee_id, str):
				return int(employee_id.strip())
			elif isinstance(employee_id, (int, float)):
				return int(employee_id)
			return None
		except (ValueError, TypeError):
			return None
	
	@staticmethod
	def normalize_text(text: Any) -> str:
		"""
		Normaliza texto para UPPERCASE e remove espaços extras
		
		Args:
			text: Texto para normalizar
			
		Returns:
			Texto normalizado
		"""
		if text is None:
			return ''
		return str(text).strip().upper()
	
	@staticmethod
	def extract_row_data(row: tuple, column_map: Dict[str, int]) -> Dict[str, Any]:
		"""
		Extrai dados de uma linha usando o mapeamento de colunas
		
		Args:
			row: Linha de dados
			column_map: Mapeamento das colunas
			
		Returns:
			Dicionário com os dados extraídos
		"""
		def safe_get(idx):
			return row[idx] if idx < len(row) else None
		
		return {
			'employee_id': safe_get(column_map['employee_id']),
			'employee_name': safe_get(column_map['employee_name']),
			'employee_email': safe_get(column_map['employee_email']),
			'hire_date': safe_get(column_map['hire_date']),
			'manager_name': safe_get(column_map['manager_name']),
			'manager_email': safe_get(column_map['manager_email'])
		}
	
	@staticmethod
	def validate_required_fields(data: Dict[str, Any]) -> bool:
		"""
		Valida se todos os campos obrigatórios estão preenchidos
		
		Args:
			data: Dicionário com os dados
			
		Returns:
			True se todos os campos estão preenchidos, False caso contrário
		"""
		required_fields = ['employee_id', 'employee_name', 'employee_email', 'hire_date', 'manager_name', 'manager_email']
		return all(data.get(field) for field in required_fields)