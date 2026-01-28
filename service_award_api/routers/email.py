from typing import Annotated
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from starlette import status
import socket
import json
from datetime import datetime, date

from models import User
from database import SessionLocal
from security import MAIL_E_HOST, MAIL_E_PORT
from .auth import get_current_user
from utils.employee_utils import EmployeeHierarchy

router = APIRouter(
	prefix='/email',
	tags=['email']
)

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]


class EmailRequest(BaseModel):
	destinatario: EmailStr


@router.post('/send-calendar', status_code=status.HTTP_200_OK)
async def send_calendar_email(
	user: user_dependency,
	db: db_dependency,
	email_request: EmailRequest
):
	if user is None:
		raise HTTPException(status_code=401, detail='Falha na autenticação')
	
	# Busca a hierarquia do usuário
	hierarchy_data = EmployeeHierarchy.get_hierarchy_tree(user.get('username'), db)
	
	if not hierarchy_data or not hierarchy_data.get('hierarchy'):
		raise HTTPException(status_code=404, detail='Nenhum funcionário encontrado')
	
	# Função recursiva para achatar a hierarquia
	def flatten_hierarchy(employees):
		flat_list = []
		for emp in employees:
			flat_list.append(emp)
			if emp.get('subordinates'):
				flat_list.extend(flatten_hierarchy(emp['subordinates']))
		return flat_list
	
	# Achata a hierarquia
	all_employees = flatten_hierarchy(hierarchy_data['hierarchy'])
	
	# Formata os dados para o Mail-E
	aniversarios = []
	for emp in all_employees:
		# Converte data para DD/MM/YYYY
		hire_date = emp.get('hire_date', '')
		if hire_date:
			# Se já é objeto date/datetime, converte direto
			if isinstance(hire_date, (datetime, date)):
				formatted_date = hire_date.strftime('%d/%m/%Y')
			# Se é string, faz parse primeiro
			elif isinstance(hire_date, str):
				date_obj = datetime.strptime(hire_date, '%Y-%m-%d')
				formatted_date = date_obj.strftime('%d/%m/%Y')
			else:
				formatted_date = ''
		else:
			formatted_date = ''
	
		aniversarios.append({
			"NOME": emp.get('employee_name', ''),
			"EMAIL": emp.get('employee_email', ''),
			"DATA": formatted_date
		})
	
	if not aniversarios:
		raise HTTPException(status_code=404, detail='Nenhum aniversário para enviar')
	
	# Monta o payload para o Mail-E
	payload = {
		"CONTENT": "ServiceAwardCalendar",
		"DESTINATARIO": email_request.destinatario,
		"ANIVERSARIOS": aniversarios
	}
	
	# Conecta no Mail-E via socket
	try:
		# IP e porta do Mail-E
		mail_e_host = MAIL_E_HOST
		mail_e_port = MAIL_E_PORT
		
		# Cria socket
		client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		client_socket.settimeout(10)  # Timeout de 10 segundos
		
		# Conecta
		client_socket.connect((mail_e_host, mail_e_port))
		
		# Envia dados (JSON + \n)
		message = json.dumps(payload) + "\n"
		client_socket.sendall(message.encode('utf-8'))
		
		# Recebe resposta
		response_data = b''
		while True:
			chunk = client_socket.recv(4096)
			if not chunk:
				break
			response_data += chunk
			if response_data.endswith(b'\n'):
				break
		
		client_socket.close()
		
		# Parse da resposta
		if response_data:
			response = json.loads(response_data.decode('utf-8').strip())
			return {
				'success': True,
				'message': 'Email enviado com sucesso!',
				'mail_e_response': response,
				'total_employees': len(aniversarios)
			}
		else:
			return {
				'success': True,
				'message': 'Email enviado (sem resposta do Mail-E)',
				'total_employees': len(aniversarios)
			}
		
	except socket.timeout:
		raise HTTPException(
			status_code=504,
			detail='Não foi possível conectar ao servidor de email (timeout). Por favor, entre em contato com bianca.rodrigues@disney.com para reportar o problema.'
		)
	except socket.error as e:
		raise HTTPException(
			status_code=503,
			detail=f'Erro ao conectar ao servidor de email: {str(e)}. Por favor, entre em contato com bianca.rodrigues@disney.com para reportar o problema.'
		)
	except Exception as e:
		raise HTTPException(
			status_code=500,
			detail=f'Erro ao enviar email: {str(e)}. Por favor, entre em contato com bianca.rodrigues@disney.com para reportar o problema.'
		)