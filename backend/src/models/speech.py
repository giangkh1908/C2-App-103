from pydantic import BaseModel, Field


class TextToSpeechRequest(BaseModel):
    text: str = Field(min_length=1)
    slow: bool = False
