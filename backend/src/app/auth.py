from fastapi import Header, HTTPException


# TODO: replace with JWKS-based JWT verification once Neon auth contract is known
async def get_current_user_id(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id")
    return x_user_id
