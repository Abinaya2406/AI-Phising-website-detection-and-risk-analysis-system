"""Thread-safe background scheduler and worker queue for periodic website integrity monitoring."""
import threading
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional

from app.database import db_manager
from app.utils.logger import logger


class SchedulerService:
    """Manages periodic execution of website change monitoring probes."""

    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._is_running = False
        self._stop_event = threading.Event()
        self._lock = threading.Lock()
        self._total_probes_run = 0
        self._last_tick_time: Optional[str] = None
        self._tick_interval_seconds = 5  # Check DB queue every 5 seconds
        self._min_probe_interval_seconds = 60  # Strict rate limit: no probe runs more frequently than 60s

    def start(self):
        """Start the background scheduler thread if not already running."""
        with self._lock:
            if self._is_running and self._thread and self._thread.is_alive():
                return
            self._stop_event.clear()
            self._is_running = True
            self._thread = threading.Thread(target=self._worker_loop, name="PhishGuard-MonitorScheduler", daemon=True)
            self._thread.start()
            logger.info("PhishGuard Monitoring Scheduler background worker thread started.")

    def stop(self):
        """Signal the background scheduler thread to stop."""
        with self._lock:
            if not self._is_running:
                return
            self._is_running = False
            self._stop_event.set()
            logger.info("PhishGuard Monitoring Scheduler signaled to stop.")

    def get_status(self) -> Dict[str, Any]:
        """Return real-time operational status of the scheduler."""
        now = datetime.now(timezone.utc)
        collection = db_manager.get_collection("monitoring_configs")
        active_count = collection.count_documents({"status": "ACTIVE"})
        paused_count = collection.count_documents({"status": "PAUSED"})

        # Find next scheduled check time across all active targets
        active_targets = collection.find({"status": "ACTIVE"}, sort=[("next_check", 1)], limit=1)
        next_probe_iso = active_targets[0].get("next_check") if active_targets else None
        seconds_until_next = None
        if next_probe_iso:
            try:
                next_dt = datetime.fromisoformat(next_probe_iso.replace("Z", "+00:00"))
                seconds_until_next = max(0, int((next_dt - now).total_seconds()))
            except Exception:
                pass

        return {
            "is_running": self._is_running and bool(self._thread and self._thread.is_alive()),
            "active_targets_count": active_count,
            "paused_targets_count": paused_count,
            "total_probes_run": self._total_probes_run,
            "last_tick_time": self._last_tick_time,
            "next_probe_in_seconds": seconds_until_next,
            "rate_limit_min_interval_seconds": self._min_probe_interval_seconds,
            "worker_thread_alive": bool(self._thread and self._thread.is_alive())
        }

    def _worker_loop(self):
        """Continuous execution loop checking for targets due for monitoring probes."""
        # Avoid circular import by importing monitoring_service inside worker
        from app.services.monitoring_service import monitoring_service

        while not self._stop_event.is_set():
            try:
                now = datetime.now(timezone.utc)
                self._last_tick_time = now.isoformat()

                collection = db_manager.get_collection("monitoring_configs")
                # Query targets due for execution: status ACTIVE and next_check <= now
                due_targets = collection.find({"status": "ACTIVE"})

                for target in due_targets:
                    if self._stop_event.is_set():
                        break

                    next_check_str = target.get("next_check")
                    is_due = False
                    if not next_check_str:
                        is_due = True
                    else:
                        try:
                            next_dt = datetime.fromisoformat(next_check_str.replace("Z", "+00:00"))
                            if now >= next_dt:
                                is_due = True
                        except Exception:
                            is_due = True

                    if is_due:
                        target_id = target.get("id")
                        try:
                            monitoring_service.execute_target_check(target_id)
                            with self._lock:
                                self._total_probes_run += 1
                        except Exception as e:
                            logger.error(f"Scheduler probe execution error for target '{target_id}': {e}")

            except Exception as e:
                logger.error(f"Unexpected exception in monitoring scheduler tick: {e}")

            # Wait for next tick interval or stop event
            self._stop_event.wait(timeout=self._tick_interval_seconds)


scheduler_service = SchedulerService()
