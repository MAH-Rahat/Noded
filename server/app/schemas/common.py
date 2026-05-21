from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str


class ResponseModel(BaseModel, Generic[T]):
    status: str  # "success" or "error"
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

    @classmethod
    def success(cls, data: T) -> "ResponseModel[T]":
        return cls(status="success", data=data)

    @classmethod
    def error_response(cls, code: str, message: str) -> "ResponseModel[None]":
        return cls(status="error", data=None, error=ErrorDetail(code=code, message=message))
