"""Custom application exceptions, mapped to HTTP responses in main.py."""


class LocationNotFoundError(Exception):
    def __init__(self, location_id: int):
        self.location_id = location_id
        super().__init__(f"Location {location_id} not found")
