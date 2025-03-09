import re
from typing import Tuple, Any

class InputValidator:
    @staticmethod
    def validate_text(text: str, min_length: int = 1, max_length: int = 1000) -> Tuple[bool, str]:
        """Validates text input"""
        if not text:
            return False, "Text cannot be empty"
        if len(text) < min_length:
            return False, f"Text must be at least {min_length} characters long"
        if len(text) > max_length:
            return False, f"Text cannot exceed {max_length} characters"
        return True, ""

    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """Validates email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            return False, "Invalid email format"
        return True, ""

    @staticmethod
    def validate_price(price: Any) -> Tuple[bool, str]:
        """Validates price input"""
        try:
            price = float(price)
            if price <= 0:
                return False, "Price must be greater than 0"
            if price > 999999.99:  # Add maximum price limit
                return False, "Price exceeds maximum allowed value"
            return True, ""
        except (ValueError, TypeError):
            return False, "Invalid price format"

    @staticmethod
    def validate_phone(phone: str) -> Tuple[bool, str]:
        """Validates phone number format"""
        pattern = r'^\+?1?\d{9,15}$'
        if not re.match(pattern, phone):
            return False, "Invalid phone number format"
        return True, ""

    @staticmethod
    def validate_username(username: str) -> Tuple[bool, str]:
        """Validates username format"""
        if not username:
            return False, "Username cannot be empty"
        if len(username) < 3:
            return False, "Username must be at least 3 characters long"
        if len(username) > 32:
            return False, "Username cannot exceed 32 characters"
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return False, "Username can only contain letters, numbers, and underscores"
        return True, ""

    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitizes input text"""
        # Remove any HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Remove any SQL injection attempts
        text = re.sub(r'[\'";\-\\]', '', text)
        # Remove any potential command injection characters
        text = re.sub(r'[&|;`]', '', text)
        # Limit to reasonable length
        return text[:1000]

def validate_input(func):
    """Decorator for validating input in bot handlers"""
    async def wrapper(*args, **kwargs):
        # Get the first argument after self/cls (usually the update object)
        if len(args) > 1:
            update = args[1]
            if hasattr(update, 'message') and update.message:
                text = update.message.text
                if text:
                    # Validate and sanitize input
                    validator = InputValidator()
                    is_valid, error_message = validator.validate_text(text)
                    if not is_valid:
                        await update.message.reply_text(error_message)
                        return
                    # Replace the original text with sanitized version
                    update.message.text = validator.sanitize_input(text)
        return await func(*args, **kwargs)
    return wrapper