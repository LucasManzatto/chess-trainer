from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import settings

_bearer = HTTPBearer(auto_error=False)


def get_http_client(request: Request) -> httpx.AsyncClient:
    return request.app.state.http_client  # type: ignore[no-any-return]


HttpClient = Annotated[httpx.AsyncClient, Depends(get_http_client)]


Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


async def get_current_user_id(
    credentials: Credentials,
    client: HttpClient,
) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    resp = await client.get(
        f"{settings.neon_auth_url}/get-session",
        headers={"Authorization": f"Bearer {credentials.credentials}"},
        timeout=5.0,
    )

    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    data = resp.json()
    if not isinstance(data, dict):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    user_id: str | None = data.get("user", {}).get("id") or data.get("userId") or data.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")

    return user_id
