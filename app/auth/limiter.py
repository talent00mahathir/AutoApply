"""Thread-safe sliding window rate limiter for security-sensitive API routes."""

import time
from collections import defaultdict
from threading import Lock
from typing import Callable
from fastapi import Request, HTTPException, status


class RateLimiter:
    """Sliding-window in-memory rate limiter per client IP address."""

    def __init__(self, requests_limit: int, time_window_seconds: int = 60, action_name: str = "requests"):
        self.requests_limit = requests_limit
        self.time_window = time_window_seconds
        self.action_name = action_name
        self.history = defaultdict(list)
        self.lock = Lock()

    def __call__(self, request: Request):
        # SEC-16: prefer X-Forwarded-For only when TRUST_PROXY=true, else spoofable.
        client_ip = "127.0.0.1"
        if request.client and request.client.host:
            client_ip = request.client.host
        try:
            import os as _os
            if _os.getenv("TRUST_PROXY", "false").lower() == "true":
                fwd = request.headers.get("x-forwarded-for", "")
                if fwd:
                    client_ip = fwd.split(",")[0].strip() or client_ip
        except Exception:
            pass

        now = time.time()

        with self.lock:
            # Filter timestamps within current window
            window_start = now - self.time_window
            valid_timestamps = [t for t in self.history[client_ip] if t > window_start]

            # SEC-16: purge stale IPs to bound memory (was unbounded defaultdict).
            if len(self.history) > 10000:
                for k in list(self.history.keys()):
                    if k == client_ip:
                        continue
                    ks = [t for t in self.history[k] if t > window_start]
                    if ks:
                        self.history[k] = ks
                    else:
                        del self.history[k]
                    if len(self.history) <= 9000:
                        break

            if len(valid_timestamps) >= self.requests_limit:
                oldest_timestamp = valid_timestamps[0]
                retry_after = max(1, int(self.time_window - (now - oldest_timestamp)))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Too many {self.action_name}. Rate limit exceeded. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)}
                )

            valid_timestamps.append(now)
            self.history[client_ip] = valid_timestamps


# Pre-configured rate limiters
login_limiter = RateLimiter(requests_limit=5, time_window_seconds=60, action_name="login attempts")
register_limiter = RateLimiter(requests_limit=3, time_window_seconds=60, action_name="registration attempts")
export_pdf_limiter = RateLimiter(requests_limit=10, time_window_seconds=60, action_name="PDF export requests")
# SEC-9: Uncapped Gemini pipeline was quota-drain vector. 10/hour per IP.
analyze_limiter = RateLimiter(requests_limit=10, time_window_seconds=3600, action_name="pipeline analyses")
