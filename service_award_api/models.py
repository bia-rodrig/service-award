from database import Base
from sqlalchemy import Column, Integer, String, Date, Boolean, Enum
import enum

class UserRole(str, enum.Enum):
	admin = "ADMIN"
	rh = "RH"
	user = "USER"


class User(Base):
	__tablename__ = 'users'
	id = Column(Integer, primary_key=True, index=True)
	email = Column(String(255), unique=True, nullable=False)
	name = Column(String)
	surname = Column(String)
	hashed_password = Column(String)
	is_active = Column(Boolean, default=True)
	role = Column(String)


class Employees(Base):
	__tablename__ = 'employees'
	id = Column(Integer, primary_key=True, index=True)
	employee_id = Column(Integer, unique=True)
	employee_name = Column(String)
	employee_email = Column(String(255), unique=True, nullable=False)
	hire_date = Column(Date, nullable=False)
	manager_name = Column(String, nullable=False)
	manager_email = Column(String(255), nullable=False)