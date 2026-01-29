from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

import models
from database import engine

from routers import auth, employees, admin, email

app = FastAPI()

# cria tabelas do banco 
models.Base.metadata.create_all(bind=engine)

#CORS para desenvolvimento (quando React roda em localhost:3000) - DEV
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # Frontend
#     allow_credentials=True,  # ← Permite cookies!
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


#=== PRODUÇÃO
#CORS para desenvolvimento E produção
# Em produção, o frontend está no mesmo servidor, então não precisa de CORS
# Mas deixamos configurado para aceitar localhost (dev) e o IP do servidor (produção)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Desenvolvimento
        "http://10.74.114.9:8000",  # Produção (ajuste o IP se for diferente) - IP de onde vai rodar o backend
        "http://127.0.0.1:8000",  # Local
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(admin.router)
app.include_router(email.router)

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
        # Verifica se é arquivo físico (CSS, JS, imagens, etc)
        file_path = f"{build_path}/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        # Para qualquer outra rota (incluindo rotas do React Router), serve o index.html
        return FileResponse(f"{build_path}/index.html")