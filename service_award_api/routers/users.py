from fastapi import APIRouter
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Path
from datetime import date

from starlette import status

from security import bcrypt_context
from models import Employees, User
from database import SessionLocal
from .auth import get_current_user

router = APIRouter(
	prefix='/users',
	tags=['users']
)

def get_db():
	db = SessionLocal()
	try:
		yield db
	finally:
		db.close()

db_dependency = Annotated[Session, Depends(get_db)]
user_dependency = Annotated[dict, Depends(get_current_user)]

class UserVerification(BaseModel):
	password: str
	new_password: str = Field(min_length=6)


# alterar o password
@router.put('/change_password', status_code=status.HTTP_204_NO_CONTENT)
async def change_password(user: user_dependency, db: db_dependency, user_verification: UserVerification):
	if user is None:
		raise HTTPException(status_code=401, detail='Authentication Failed')
	
	user_model = db.query(User).filter(User.id == user.get('id')).first()
	if not bcrypt_context.verify(user_verification.password, user_model.hashed_password):
		raise HTTPException(status_code=401, detail='Error on password change')

	user_model.hashed_password = bcrypt_context.hash(user_verification.new_password)
	db.add(user_model)
	db.commit()
	db.refresh(user_model)
