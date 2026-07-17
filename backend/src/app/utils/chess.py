import chess


def position_key(fen: str) -> str:
    """Normalize a FEN to its transposition-independent identity.

    Drops halfmove/fullmove clocks (FEN fields 5-6) so positions reached via
    different move orders collapse to the same key.
    """
    return chess.Board(fen).epd()
