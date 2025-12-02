from fastapi import APIRouter
from typing import Annotated
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from datetime import date

from starlette import status

from models import Employees
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
	emoloyee_email: str = EmailStr
	hire_date: date
	manager_name: str
	manager_email: str = EmailStr

@router.get('/employees')
async def get_employee():
	return {'employees': 'authenticated'}