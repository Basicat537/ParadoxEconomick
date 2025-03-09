import pytest
from datetime import datetime, timedelta
from time import sleep
from utils.rate_limiter import RateLimiter

@pytest.fixture
def rate_limiter():
    return RateLimiter()

class TestRateLimiter:
    def test_basic_rate_limiting(self, rate_limiter):
        user_id = 12345
        
        # First attempt should succeed
        assert rate_limiter.check_limit(user_id, 'message') is True
        
        # Make multiple attempts to trigger limit
        for _ in range(rate_limiter._limits['message']):
            rate_limiter.check_limit(user_id, 'message')
            
        # Next attempt should fail
        assert rate_limiter.check_limit(user_id, 'message') is False

    def test_exponential_backoff(self, rate_limiter):
        user_id = 12345
        
        # Make multiple violations to test backoff
        for _ in range(3):
            # Fill up the limit
            for _ in range(rate_limiter._limits['message']):
                rate_limiter.check_limit(user_id, 'message')
            
            # Get backoff time after violation
            _, wait_time = rate_limiter.get_remaining_attempts(user_id, 'message')
            
            # Each violation should increase wait time exponentially
            assert wait_time > 0
            if _ > 0:
                assert wait_time > previous_wait
            previous_wait = wait_time

    def test_different_limit_types(self, rate_limiter):
        user_id = 12345
        
        # Test message limits
        assert rate_limiter.check_limit(user_id, 'message') is True
        
        # Test command limits
        assert rate_limiter.check_limit(user_id, 'command') is True
        
        # Test auth limits
        assert rate_limiter.check_limit(user_id, 'auth') is True
        
        # Verify different limit types don't interfere
        for _ in range(rate_limiter._limits['auth']):
            rate_limiter.check_limit(user_id, 'auth')
        
        assert rate_limiter.check_limit(user_id, 'auth') is False
        assert rate_limiter.check_limit(user_id, 'message') is True

    def test_limit_reset(self, rate_limiter):
        user_id = 12345
        
        # Trigger limit
        for _ in range(rate_limiter._limits['message'] + 1):
            rate_limiter.check_limit(user_id, 'message')
        
        assert rate_limiter.check_limit(user_id, 'message') is False
        
        # Reset limits
        rate_limiter.reset_limits(user_id)
        
        # Should be able to make requests again
        assert rate_limiter.check_limit(user_id, 'message') is True

    def test_remaining_attempts(self, rate_limiter):
        user_id = 12345
        
        # Check initial state
        remaining, wait_time = rate_limiter.get_remaining_attempts(user_id, 'message')
        assert remaining == rate_limiter._limits['message']
        assert wait_time == 0
        
        # Make some attempts
        for _ in range(3):
            rate_limiter.check_limit(user_id, 'message')
        
        # Verify remaining attempts decreased
        remaining, _ = rate_limiter.get_remaining_attempts(user_id, 'message')
        assert remaining == rate_limiter._limits['message'] - 3

    def test_error_handling(self, rate_limiter):
        # Test with invalid user_id
        assert rate_limiter.check_limit(None, 'message') is True
        
        # Test with invalid limit_type
        assert rate_limiter.check_limit(12345, 'invalid_type') is True
        
        # Test remaining attempts with invalid data
        remaining, wait_time = rate_limiter.get_remaining_attempts(None, 'invalid_type')
        assert remaining == 0
        assert wait_time == 0
