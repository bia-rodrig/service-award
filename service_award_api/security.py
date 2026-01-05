from passlib.context import CryptContext

SECRET_KEY = "CauseMauiCanDoAnythingButFloat"
ALGORITHM = 'HS256'

# Contexto de criptografia compartilhado
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

DEFAULT_PASSWORD = 'Espn123'