from fastapi import APIRouter, Header, HTTPException

from backend.schemas.auth import AuthSessionResponse, TokenSyncRequest
from backend.services.auth_service import create_access_token, get_user_from_authorization_header, sync_user_from_token


router = APIRouter()


@router.post("/session", response_model=AuthSessionResponse)
def create_session(body: TokenSyncRequest) -> AuthSessionResponse:
    try:
        user = sync_user_from_token(body.id_token)
        access_token, expires_in = create_access_token(user)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return AuthSessionResponse(user=user, access_token=access_token, expires_in=expires_in)


@router.get("/me", response_model=AuthSessionResponse)
def get_current_user(authorization: str | None = Header(default=None)) -> AuthSessionResponse:
    try:
        user = get_user_from_authorization_header(authorization)
        access_token, expires_in = create_access_token(user)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    return AuthSessionResponse(user=user, access_token=access_token, expires_in=expires_in)
