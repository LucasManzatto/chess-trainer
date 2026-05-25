class AppError(Exception):
    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppError):
    pass


class BadRequestError(AppError):
    pass


class ConflictError(AppError):
    pass
