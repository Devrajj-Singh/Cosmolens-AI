from pydantic import BaseModel


class TokenSyncRequest(BaseModel):
    id_token: str


class AuthUser(BaseModel):
    uid: str
    email: str | None = None
    display_name: str | None = None
    provider: str | None = None


class AuthSessionResponse(BaseModel):
    user: AuthUser
    access_token: str
    token_type: str = "bearer"
    expires_in: int
