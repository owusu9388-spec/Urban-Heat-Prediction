"""Minimal logging configuration for the API."""

import logging


def configure_logging() -> logging.Logger:
    logger = logging.getLogger("urbanheat_accra")
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


logger = configure_logging()
