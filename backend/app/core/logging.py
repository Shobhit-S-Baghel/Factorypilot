import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    log_format = "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s"
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Silence overly verbose external loggers if needed
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
