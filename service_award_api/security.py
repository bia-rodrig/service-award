from passlib.context import CryptContext

# Configurações de segurança centralizadas
SECRET_KEY = "CauseMauiCanDoAnythingButFloat"
ALGORITHM = 'HS256'

# Contexto de criptografia compartilhado
bcrypt_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Senha padrão para reset
DEFAULT_PASSWORD = 'Espn123'