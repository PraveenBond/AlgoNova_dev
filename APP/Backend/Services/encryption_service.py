"""
Encryption Service for API Keys and Tokens
"""
from cryptography.fernet import Fernet
from config import settings
import base64


class EncryptionService:
    """Service for encrypting/decrypting sensitive data"""
    
    def __init__(self):
        """Initialize encryption service with key from settings"""
        # Generate key from settings or create new one
        key = settings.ENCRYPTION_KEY.encode()
        # Ensure key is 32 bytes (Fernet requirement)
        if len(key) < 32:
            key = key.ljust(32, b'0')
        elif len(key) > 32:
            key = key[:32]
        
        # Convert to base64 for Fernet
        key_b64 = base64.urlsafe_b64encode(key)
        self.cipher = Fernet(key_b64)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext string"""
        if not plaintext:
            return ""
        return self.cipher.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt ciphertext string"""
        if not ciphertext:
            return ""
        return self.cipher.decrypt(ciphertext.encode()).decode()


# Singleton instance
encryption_service = EncryptionService()

