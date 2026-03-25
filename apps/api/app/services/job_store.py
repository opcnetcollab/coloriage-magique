"""In-memory job store. Replace with Redis/DB for production."""
from typing import Dict, Optional
from app.models.job import Job, JobStatus


class JobStore:
    _jobs: Dict[str, Job] = {}

    @classmethod
    def create(cls, job_id: str, filename: str) -> Job:
        job = Job(job_id=job_id, original_filename=filename)
        cls._jobs[job_id] = job
        return job

    @classmethod
    def get(cls, job_id: str) -> Optional[Job]:
        return cls._jobs.get(job_id)

    @classmethod
    def update(cls, job_id: str, **kwargs) -> Optional[Job]:
        job = cls._jobs.get(job_id)
        if not job:
            return None
        updated = job.model_copy(update=kwargs)
        cls._jobs[job_id] = updated
        return updated

    @classmethod
    def set_done(cls, job_id: str, pdf_url: str) -> Optional[Job]:
        return cls.update(job_id, status=JobStatus.DONE, pdf_url=pdf_url)

    @classmethod
    def set_error(cls, job_id: str, error: str) -> Optional[Job]:
        return cls.update(job_id, status=JobStatus.ERROR, error=error)
