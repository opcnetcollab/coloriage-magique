"""Pydantic models for Coloriage Magique jobs."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel


class Difficulty(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    expert = "expert"


class Format(str, Enum):
    a4 = "a4"
    a3 = "a3"


class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    failed = "failed"


class ColorLegendEntry(BaseModel):
    symbol: str
    hex: str
    name: str


class Job(BaseModel):
    id: str
    status: JobStatus = JobStatus.pending
    difficulty: Difficulty
    format: Format
    color_count: Optional[int] = None
    color_legend: Optional[List[ColorLegendEntry]] = None
    preview_url: Optional[str] = None
    coloring_pdf_url: Optional[str] = None
    reference_pdf_url: Optional[str] = None
    processing_ms: Optional[int] = None
    created_at: datetime
    expires_at: datetime
    error: Optional[str] = None


class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus
    poll_url: str
