# # from .task import Task
# from .result import (
#     InspirationResult,
#     CrazyWalkResult,
#     CrazyWalk2Result,
#     BookBreakdownResult
# )


# __all__ = [
#     'InspirationResult',
#     'CrazyWalkResult',
#     'CrazyWalk2Result',
#     'BookBreakdownResult',
#     # ... 其他模型
# ] 





from enum import Enum


class TaskTypeEnum(str, Enum):
    CRAZY_WALK = "CRAZY_WALK"
    INSPIRATION = "INSPIRATION"
    CRAZY_WALK_2 = "CRAZY_WALK_2"
    BOOK_BREAKDOWN = "BOOK_BREAKDOWN"