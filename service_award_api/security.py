from passlib.context import CryptContext

SECRET_KEY = "CauseMauiCanDoAnythingButFloat"
ALGORITHM = 'HS256'

# Contexto de criptografia compartilhado
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

DEFAULT_PASSWORD = 'Espn123'


# ========== CONFIGURAÇÕES DO MAIL-E ==========
MAIL_E_HOST = '10.77.39.109' 
MAIL_E_PORT = 5555