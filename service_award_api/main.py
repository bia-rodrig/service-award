from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

import models
from database import engine

from routers import auth, employees, admin

app = FastAPI()

# cria tabelas do banco 
models.Base.metadata.create_all(bind=engine)

# CORS para desenvolvimento (quando React roda em localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend
    allow_credentials=True,  # ← Permite cookies!
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(admin.router)

# ========== SERVIR FRONTEND REACT (PRODUÇÃO) ==========
build_path = "frontend/build"

if os.path.exists(build_path):
    # Servir arquivos estáticos do React (CSS, JS, etc)
    app.mount("/static", StaticFiles(directory=f"{build_path}/static"), name="static")
    
    # Servir favicon e manifest
    @app.get("/favicon.ico")
    async def favicon():
        return FileResponse(f"{build_path}/favicon.ico")
    
    @app.get("/manifest.json")
    async def manifest():
        return FileResponse(f"{build_path}/manifest.json")
    
    # Rota catch-all para React Router (DEVE SER A ÚLTIMA ROTA!)
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # Se for rota da API, não serve o React
        if full_path.startswith(("auth/", "employees/", "admin/")):
            return {"detail": "Not Found"}
        
        # Serve o index.html do React para qualquer outra rota
        return FileResponse(f"{build_path}/index.html")