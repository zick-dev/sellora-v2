from pydantic import BaseModel


class ChatFaqCreate(BaseModel):
    question: str
    answer: str


class ChatFaqUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None


class ChatFaqOut(BaseModel):
    id: str
    store_id: str
    question: str
    answer: str

    model_config = {"from_attributes": True}
