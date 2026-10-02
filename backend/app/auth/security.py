import hashlib
import datetime
from typing import Optional
from jose import jwt, JWTError
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.db.session import get_db
from app.db.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    # Use salted sha256 for maximum compatibility and zero native binary hitch
    salt = "bput_campus_life_salt_2026_"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Optional[User]:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

def require_role(*required_roles: str):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role.upper() not in [r.upper() for r in required_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires one of {required_roles} role, current role is {user.role}"
            )
        return user
    return role_checker

def can(user: User, action: str, resource: any = None) -> bool:
    """
    Centralized authorization logic matching /docs/permissions.md.
    Evaluates role permissions and ensures resource ownership (IDOR prevention).
    """
    role = user.role.upper()

    if role == "ADMIN":
        return True  # Campus administrators have broad operational oversight

    if action == "view_complaint":
        if role in ["STAFF", "ADMIN"]:
            return True
        if role == "STUDENT" and resource:
            return resource.student_id == user.id
        return False

    if action == "update_complaint":
        return role in ["STAFF", "ADMIN"]

    if action == "request_gatepass":
        return role == "STUDENT"

    if action == "view_gatepass":
        if role in ["ADMIN", "GUARD"]:
            return True
        if role == "STUDENT" and resource:
            return resource.student_id == user.id
        return False

    if action == "approve_gatepass":
        return role == "ADMIN"

    if action == "verify_gatepass_scan":
        return role in ["GUARD", "ADMIN"]

    if action == "broadcast_notice":
        return role == "ADMIN"

    if action == "manage_mess":
        return role in ["MESS", "ADMIN"]

    return False

def authorize(user: User, action: str, resource: any = None):
    """
    Raises HTTP 403 Forbidden or HTTP 404 Not Found if authorization fails.
    """
    if not can(user, action, resource):
        # If student tries to access someone else's resource by ID, return 404 to avoid leaking existence
        if resource and getattr(resource, 'student_id', None) is not None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied for action '{action}'"
        )

