from functools import wraps
from typing import Callable, Any
import jwt
from datetime import datetime, timedelta
from config import Config
import logging
from models import User

logger = logging.getLogger(__name__)

def generate_jwt_token(user_id: int) -> str:
    """Generate JWT token for user authentication"""
    try:
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    except Exception as e:
        logger.error(f"Error generating JWT token: {str(e)}")
        raise

def verify_jwt_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        return jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token")
        raise
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid JWT token: {str(e)}")
        raise

def check_user_access(required_roles: list = None) -> Callable:
    """Decorator to check user access and roles"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                update = args[1]  # Get telegram update object
                user = User.query.filter_by(telegram_id=update.effective_user.id).first()
                
                if not user:
                    await update.message.reply_text("Unauthorized access.")
                    return
                
                if not user.active:
                    await update.message.reply_text("Your account is deactivated.")
                    return
                
                if required_roles:
                    user_roles = [role.name for role in user.roles]
                    if not any(role in user_roles for role in required_roles):
                        await update.message.reply_text("Insufficient permissions.")
                        return
                
                return await func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Error in access check: {str(e)}")
                await update.message.reply_text("An error occurred during authorization.")
                return
        return wrapper
    return decorator

def sanitize_payload(payload: Any) -> Any:
    """Sanitize input payload to prevent XSS and injection attacks"""
    if isinstance(payload, str):
        # Remove potential XSS payloads
        payload = payload.replace("<script>", "").replace("</script>", "")
        # Remove potential SQL injection patterns
        payload = payload.replace("'", "''").replace(";", "")
        return payload
    elif isinstance(payload, dict):
        return {k: sanitize_payload(v) for k, v in payload.items()}
    elif isinstance(payload, list):
        return [sanitize_payload(item) for item in payload]
    return payload

def check_brute_force(func: Callable) -> Callable:
    """Decorator to prevent brute force attacks"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            update = args[1]
            user_id = update.effective_user.id
            
            # Implementation would track failed attempts and implement exponential backoff
            # This is a simplified version
            from utils.rate_limiter import RateLimiter
            rate_limiter = RateLimiter()
            
            if not rate_limiter.check_limit(user_id, limit_type='auth'):
                await update.message.reply_text(
                    "Too many authentication attempts. Please try again later."
                )
                return
            
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in brute force check: {str(e)}")
            return
    return wrapper
