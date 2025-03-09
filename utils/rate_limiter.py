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

        # Define backoff factors for different actions
        self._backoff_factors = {
            'message': 2,
            'command': 2,
            'auth': 4,  # More aggressive backoff for auth attempts
            'payment': 5,  # Most aggressive backoff for payment attempts
        }

        # Store backoff history
        self._backoff_history = defaultdict(lambda: defaultdict(int))

    def _clean_old_attempts(self, user_id: int, limit_type: str):
        """Remove attempts older than the window"""
        if not user_id or limit_type not in self._windows:
            return

        now = datetime.utcnow()
        window = timedelta(seconds=self._windows.get(limit_type, 60))

        self._attempts[user_id][limit_type] = [
            attempt for attempt in self._attempts[user_id][limit_type]
            if now - attempt[0] < window
        ]

    def _get_attempts_count(self, user_id: int, limit_type: str) -> int:
        """Get number of attempts within the current window"""
        if not user_id or limit_type not in self._windows:
            return 0

        self._clean_old_attempts(user_id, limit_type)
        return sum(attempt[1] for attempt in self._attempts[user_id][limit_type])

    def _calculate_backoff_time(self, user_id: int, limit_type: str) -> int:
        """Calculate exponential backoff time in seconds"""
        if not user_id or limit_type not in self._backoff_factors:
            return 0

        violations = self._backoff_history[user_id][limit_type]
        if violations == 0:
            return 0

        base_wait = 5  # Base wait time in seconds
        factor = self._backoff_factors.get(limit_type, 2)
        max_wait = 3600  # Maximum wait time (1 hour)

        wait_time = min(base_wait * (factor ** (violations - 1)), max_wait)
        return int(wait_time)

    def check_limit(self, user_id: int, limit_type: str = 'message') -> bool:
        """
        Check if user has exceeded rate limit with exponential backoff
        Returns True if within limits, False if exceeded
        """
        try:
            # Handle invalid inputs gracefully
            if not user_id:
                logger.warning("Invalid user_id provided to rate limiter")
                return True  # Allow request but log warning

            if limit_type not in self._limits:
                logger.warning(f"Unknown limit type: {limit_type}")
                limit_type = 'message'  # Default to message limit

            now = datetime.utcnow()

            # Clean old attempts first
            self._clean_old_attempts(user_id, limit_type)

            # Get current count
            current_count = self._get_attempts_count(user_id, limit_type)

            # Check if limit exceeded
            limit = self._limits.get(limit_type, self._limits['message'])
            if current_count >= limit:
                # Increment violation count and calculate backoff
                self._backoff_history[user_id][limit_type] += 1
                wait_time = self._calculate_backoff_time(user_id, limit_type)

                logger.warning(
                    f"Rate limit exceeded for user {user_id} on {limit_type}. "
                    f"Violations: {self._backoff_history[user_id][limit_type]}, "
                    f"Wait time: {wait_time}s"
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
            # Handle invalid inputs
            if not user_id or limit_type not in self._limits:
                return 0, 0

            current_count = self._get_attempts_count(user_id, limit_type)
            limit = self._limits.get(limit_type, self._limits['message'])

            if not self._attempts[user_id][limit_type]:
                return limit, 0

            oldest_attempt = min(
                attempt[0] for attempt in self._attempts[user_id][limit_type]
            )
            window = timedelta(seconds=self._windows.get(limit_type, 60))

            # Calculate base window wait time
            base_wait = max(
                0,
                int((oldest_attempt + window - datetime.utcnow()).total_seconds())
            )

            # Add exponential backoff if applicable
            backoff_wait = self._calculate_backoff_time(user_id, limit_type)
            total_wait = max(base_wait, backoff_wait)

            return limit - current_count, total_wait

        except Exception as e:
            logger.error(f"Error getting rate limit info: {str(e)}")
            return 0, 0

    def reset_limits(self, user_id: int):
        """Reset all limits for a user"""
        try:
            if user_id in self._attempts:
                del self._attempts[user_id]
            if user_id in self._backoff_history:
                del self._backoff_history[user_id]
        except Exception as e:
            logger.error(f"Error resetting rate limits: {str(e)}")