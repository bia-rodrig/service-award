from typing import List, Set
from sqlalchemy.orm import Session
from models import Employees

class EmployeeHierarchy:
	"""Classe para gerenciar hierarquia de funcionários"""
	
	@staticmethod
	def get_all_subordinates(manager_email: str, db: Session) -> List[Employees]:
		"""
		Busca recursivamente todos os funcionários abaixo de um gerente
		
		Args:
			manager_email: Email do gerente
			db: Sessão do banco de dados
			
		Returns:
			Lista com todos os funcionários da hierarquia
		"""
		all_employees = []
		visited_emails = set()  # Para evitar loops infinitos
		
		def find_subordinates(current_manager_email: str):
			"""Função recursiva interna"""
			# Evita loops infinitos
			if current_manager_email in visited_emails:
				return
			
			visited_emails.add(current_manager_email)
			
			# Busca funcionários diretos deste gerente
			direct_reports = db.query(Employees).filter(
				Employees.manager_email == current_manager_email
			).all()
			
			# Adiciona os funcionários diretos à lista
			for employee in direct_reports:
				if employee.employee_email not in visited_emails:
					all_employees.append(employee)
					# Busca recursivamente os subordinados deste funcionário
					find_subordinates(employee.employee_email)
		
		# Inicia a busca recursiva
		find_subordinates(manager_email)
		
		return all_employees
	
	@staticmethod
	def get_hierarchy_tree(manager_email: str, db: Session) -> dict:
		"""
		Retorna a hierarquia em formato de árvore
		
		Args:
			manager_email: Email do gerente
			db: Sessão do banco de dados
			
		Returns:
			Dicionário com a estrutura hierárquica
		"""
		visited_emails = set()
		
		def build_tree(current_manager_email: str) -> List[dict]:
			"""Função recursiva para construir a árvore"""
			if current_manager_email in visited_emails:
				return []
			
			visited_emails.add(current_manager_email)
			
			# Busca funcionários diretos
			direct_reports = db.query(Employees).filter(
				Employees.manager_email == current_manager_email
			).all()
			
			tree = []
			for employee in direct_reports:
				employee_node = {
					'id': employee.id,
					'employee_id': employee.employee_id,
					'employee_name': employee.employee_name,
					'employee_email': employee.employee_email,
					'hire_date': employee.hire_date,
					'manager_name': employee.manager_name,
					'manager_email': employee.manager_email,
					'subordinates': build_tree(employee.employee_email)
				}
				tree.append(employee_node)
			
			return tree
		
		return {
			'manager_email': manager_email,
			'hierarchy': build_tree(manager_email)
		}
	
	@staticmethod
	def get_hierarchy_levels(manager_email: str, db: Session) -> dict:
		"""
		Retorna os funcionários organizados por nível hierárquico
		
		Args:
			manager_email: Email do gerente
			db: Sessão do banco de dados
			
		Returns:
			Dicionário com funcionários por nível
		"""
		levels = {}
		visited_emails = set()
		
		def find_by_level(current_manager_email: str, level: int):
			"""Função recursiva para organizar por nível"""
			if current_manager_email in visited_emails:
				return
			
			visited_emails.add(current_manager_email)
			
			# Busca funcionários diretos
			direct_reports = db.query(Employees).filter(
				Employees.manager_email == current_manager_email
			).all()
			
			if direct_reports:
				if level not in levels:
					levels[level] = []
				
				for employee in direct_reports:
					levels[level].append({
						'id': employee.id,
						'employee_id': employee.employee_id,
						'employee_name': employee.employee_name,
						'employee_email': employee.employee_email,
						'hire_date': employee.hire_date,
						'manager_name': employee.manager_name,
						'manager_email': employee.manager_email
					})
					# Busca o próximo nível
					find_by_level(employee.employee_email, level + 1)
		
		find_by_level(manager_email, 1)
		
		return {
			'manager_email': manager_email,
			'total_levels': len(levels),
			'levels': levels
		}