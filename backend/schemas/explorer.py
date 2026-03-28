from pydantic import BaseModel, Field


class ExplorerQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Natural language question about a known space object.")
