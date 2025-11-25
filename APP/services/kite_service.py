import logging
import os
import json
from pathlib import Path
from dotenv import load_dotenv
from kiteconnect import KiteConnect
from kiteconnect.exceptions import TokenException, NetworkException, KiteException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

logging.basicConfig(level=logging.DEBUG)

# Token storage file path
TOKEN_STORAGE_FILE = Path("kite_token.json")

class KiteService:
    """Service to handle Kite Connect API operations"""
    
    def __init__(self, api_key: Optional[str] = None, api_secret: Optional[str] = None):
        self.api_key = api_key or os.getenv("KITE_API_KEY")
        self.api_secret = api_secret or os.getenv("KITE_API_SECRET")
        self.kite = None
        self.access_token = None
    
    def _load_stored_token(self) -> Optional[Dict[str, Any]]:
        """Load stored access token from file"""
        try:
            if TOKEN_STORAGE_FILE.exists():
                with open(TOKEN_STORAGE_FILE, 'r') as f:
                    token_data = json.load(f)
                    # Check if token is still valid (access tokens are valid for the day)
                    stored_time = datetime.fromisoformat(token_data.get('stored_at', ''))
                    # Access tokens are valid until end of trading day (typically 3:30 PM IST)
                    # For safety, we'll consider it valid if stored today
                    if stored_time.date() == datetime.now().date():
                        return token_data
                    else:
                        # Token expired, remove file
                        TOKEN_STORAGE_FILE.unlink()
                        logging.info("Stored access token expired, removed")
        except Exception as e:
            logging.warning(f"Error loading stored token: {str(e)}")
        return None
    
    def _store_token(self, access_token: str, profile: Dict[str, Any]):
        """Store access token to file for reuse"""
        try:
            token_data = {
                "access_token": access_token,
                "profile": profile,
                "stored_at": datetime.now().isoformat()
            }
            with open(TOKEN_STORAGE_FILE, 'w') as f:
                json.dump(token_data, f, indent=2)
            logging.info("Access token stored successfully")
        except Exception as e:
            logging.warning(f"Error storing token: {str(e)}")
    
    def _initialize_with_stored_token(self) -> bool:
        """Initialize KiteConnect with stored access token if available"""
        token_data = self._load_stored_token()
        if token_data and token_data.get('access_token'):
            try:
                self.access_token = token_data['access_token']
                self.kite = KiteConnect(api_key=self.api_key)
                self.kite.set_access_token(self.access_token)
                # Test if token is still valid by trying to get profile
                self.kite.profile()
                logging.info("Using stored access token")
                return True
            except (TokenException, KiteException) as e:
                # Token is invalid, remove it
                logging.warning(f"Stored token is invalid: {str(e)}")
                if TOKEN_STORAGE_FILE.exists():
                    TOKEN_STORAGE_FILE.unlink()
                return False
        return False
        
    def get_login_url(self) -> str:
        """Generate Kite Connect login URL"""
        if not self.api_key:
            raise ValueError("KITE_API_KEY not found in environment variables")
        
        kite = KiteConnect(api_key=self.api_key)
        login_url = kite.login_url()
        
        # Note: The redirect URL must be configured in Kite app settings at https://kite.trade/apps/
        # It should match your frontend URL, e.g., http://localhost:3000/broker/connect
        # or http://localhost:5173/broker/connect (for Vite)
        
        return login_url
    
    def generate_session_from_token(self, request_token: str) -> Dict[str, Any]:
        """Generate session from request token and return session data including profile"""
        if not self.api_key or not self.api_secret:
            raise ValueError("Kite API credentials not found. Please check KITE_API_KEY and KITE_API_SECRET in .env file")
        
        try:
            self.kite = KiteConnect(api_key=self.api_key)
            
            # Generate session using request token
            data = self.kite.generate_session(
                request_token=request_token,
                api_secret=self.api_secret
            )
            
            self.access_token = data["access_token"]
            self.kite.set_access_token(self.access_token)
            
            # Fetch profile immediately after session generation
            profile = self.kite.profile()
            
            # Store the access token for future use
            self._store_token(self.access_token, profile)
            
            return {
                "access_token": self.access_token,
                "profile": profile,
                "session_data": data
            }
        except TokenException as e:
            error_msg = f"Token error: {str(e)}. The request token may be invalid or expired."
            logging.error(error_msg)
            raise ValueError(error_msg)
        except NetworkException as e:
            error_msg = f"Network error: {str(e)}. Please check your internet connection."
            logging.error(error_msg)
            raise ConnectionError(error_msg)
        except KiteException as e:
            error_msg = f"Kite API error: {str(e)}"
            logging.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logging.error(error_msg)
            raise
    
    def get_profile(self, request_token: Optional[str] = None, use_stored_token: bool = True) -> Dict[str, Any]:
        """
        Fetch user profile from Kite.
        
        Priority:
        1. If request_token is provided, use it to generate new session
        2. If use_stored_token is True, try to use stored access token
        3. Otherwise, try KITE_REQUEST_TOKEN from .env
        """
        try:
            # If request_token is provided, use it to generate session
            if request_token:
                session_data = self.generate_session_from_token(request_token)
                return session_data["profile"]
            
            # Try to use stored access token first (if enabled)
            if use_stored_token and not self.kite:
                if self._initialize_with_stored_token():
                    profile = self.kite.profile()
                    return profile
            
            # If we have an initialized kite instance, use it
            if self.kite:
                profile = self.kite.profile()
                return profile
            
            # Last resort: try env token (but warn user)
            from dotenv import load_dotenv
            load_dotenv()
            request_token_env = os.getenv("KITE_REQUEST_TOKEN")
            if request_token_env:
                logging.warning("Using KITE_REQUEST_TOKEN from .env. This token may expire. Consider using the login flow instead.")
                session_data = self.generate_session_from_token(request_token_env)
                return session_data["profile"]
            else:
                raise ValueError(
                    "No valid access token found. Please:\n"
                    "1. Use the login flow at /broker/connect to authenticate once\n"
                    "2. The access token will be stored and reused automatically\n"
                    "3. Or provide a request_token parameter"
                )
        except TokenException as e:
            error_msg = f"Token error while fetching profile: {str(e)}. The access token may have expired."
            logging.error(error_msg)
            raise ValueError(error_msg)
        except NetworkException as e:
            error_msg = f"Network error while fetching profile: {str(e)}"
            logging.error(error_msg)
            raise ConnectionError(error_msg)
        except KiteException as e:
            error_msg = f"Kite API error while fetching profile: {str(e)}"
            logging.error(error_msg)
            raise ValueError(error_msg)
        except Exception as e:
            error_msg = f"Error fetching profile: {str(e)}"
            logging.error(error_msg)
            raise

