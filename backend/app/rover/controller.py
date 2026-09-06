"""Rover state management."""

import logging
from datetime import datetime

from app.schemas.api import RoverStatusResponse

logger = logging.getLogger(__name__)

_rover_state = {
  "state": "ACTIVE",
  "battery": 76.0,
  "current_zone": "ZONE_B",
  "current_sampling_point": 14,
  "distance_covered": 1.24,
  "total_sampling_points": 30,
  "completed_sampling_points": 18,
  "obstacle_status": "Clear",
  "connection": "Connected",
}


def get_rover_status() -> RoverStatusResponse:
  return RoverStatusResponse(
    state=_rover_state["state"],
    battery=_rover_state["battery"],
    current_zone=_rover_state["current_zone"],
    current_sampling_point=_rover_state["current_sampling_point"],
    distance_covered=_rover_state["distance_covered"],
    total_sampling_points=_rover_state["total_sampling_points"],
    completed_sampling_points=_rover_state["completed_sampling_points"],
    obstacle_status=_rover_state["obstacle_status"],
    connection=_rover_state["connection"],
    last_scan=datetime.utcnow().strftime("%I:%M %p"),
  )


def execute_rover_command(command: str) -> RoverStatusResponse:
  mapping = {
    "start": "ACTIVE",
    "pause": "PAUSED",
    "resume": "ACTIVE",
    "return": "RETURNING",
    "emergency_stop": "EMERGENCY_STOP",
  }
  _rover_state["state"] = mapping.get(command, _rover_state["state"])
  logger.info("Rover command executed: %s -> %s", command, _rover_state["state"])
  return get_rover_status()
