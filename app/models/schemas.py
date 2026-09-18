from pydantic import BaseModel, Field


class ChatRequest(BaseModel):

    mode: str = Field(
        ...,
        pattern="^(sales|tutor)$"
    )

    message: str


class ChatResponse(BaseModel):

    mode: str

    answer: str

    sources: list