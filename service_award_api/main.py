from fastapi import FastAPI

import models
from database import engine

from routers import auth, employees, admin, users

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(users.router)
app.include_router(admin.router)