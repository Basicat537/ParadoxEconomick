from datetime import datetime, timedelta
from typing import Dict, Tuple
import logging
from config import Config
from collections import defaultdict

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        # Store attempts as {user_id: {limit_type: [(timestamp, count)]}}
        self._attempts = defaultdict(lambda: defaultdict(list))
        
        # Define limits for different actions
        self._limits = {
            'message': Config.RATE_LIMIT_MESSAGES,  # messages per minute
            'command': Config.RATE_LIMIT_COMMANDS,  # commands per minute
            'auth': 5,  # auth attempts per minute
            'payment': 3,  # payment attempts per minute
        }
        
        # Define windows for different actions (in seconds)
        self._windows = {
            'message': 60,
            'command': 60,
            'auth': 300,  # 5 minutes for auth
            'payment': 600,  # 10 minutes for payments
        }

    def _clean_old_attempts(self, user_id: int, limit_type: str):
        """Remove attempts older than the window"""
        now = datetime.utcnow()
        window = timedelta(seconds=self._windows.get(limit_type, 60))
        
        self._attempts[user_id][limit_type] = [
            attempt for attempt in self._attempts[user_id][limit_type]
            if now - attempt[0] < window
        ]

    def _get_attempts_count(self, user_id: int, limit_type: str) -> int:
        """Get number of attempts within the current window"""
        self._clean_old_attempts(user_id, limit_type)
        return sum(attempt[1] for attempt in self._attempts[user_id][limit_type])

    def check_limit(self, user_id: int, limit_type: str = 'message') -> bool:
        """
        Check if user has exceeded rate limit
        Returns True if within limits, False if exceeded
        """
        try:
            now = datetime.utcnow()
            
            # Clean old attempts first
            self._clean_old_attempts(user_id, limit_type)
            
            # Get current count
            current_count = self._get_attempts_count(user_id, limit_type)
            
            # Check if limit exceeded
            limit = self._limits.get(limit_type, self._limits['message'])
            if current_count >= limit:
                logger.warning(
                    f"Rate limit exceeded for user {user_id} on {limit_type}"
                )
                return False
            
            # Add new attempt
            self._attempts[user_id][limit_type].append((now, 1))
            return True
            
        except Exception as e:
            logger.error(f"Error in rate limiter: {str(e)}")
            # In case of error, allow the request
            return True

    def get_remaining_attempts(self, user_id: int, limit_type: str = 'message') -> Tuple[int, int]:
        """Get remaining attempts and wait time"""
        try:
            current_count = self._get_attempts_count(user_id, limit_type)
            limit = self._limits.get(limit_type, self._limits['message'])
            
            if not self._attempts[user_id][limit_type]:
                return limit, 0
            
            oldest_attempt = min(
                attempt[0] for attempt in self._attempts[user_id][limit_type]
            )
            window = timedelta(seconds=self._windows.get(limit_type, 60))
            wait_time = max(
                0,
                int((oldest_attempt + window - datetime.utcnow()).total_seconds())
            )
            
            return limit - current_count, wait_time
            
        except Exception as e:
            logger.error(f"Error getting rate limit info: {str(e)}")
            return 0, 0

    def reset_limits(self, user_id: int):
        """Reset all limits for a user"""
        try:
            if user_id in self._attempts:
                del self._attempts[user_id]
        except Exception as e:
            logger.error(f"Error resetting rate limits: {str(e)}")
