"""Base class and field types for the models of all modules.

Python uses snake_case, the JSON for the frontend camelCase: ApiModel converts between them.
"""

from typing import Annotated

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Created(ApiModel):
    """Answer when something new was created"""

    id: int


def _empty_to_none(value: object) -> object:
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


# Text fields from forms: trimmed, empty becomes None
OptionalText = Annotated[str | None, BeforeValidator(_empty_to_none)]
RequiredText = Annotated[str, BeforeValidator(lambda v: v.strip() if isinstance(v, str) else v), Field(min_length=1)]

# Whole number ≥ 0 from a form field, e.g. a quota; empty becomes None
OptionalCount = Annotated[Annotated[int, Field(ge=0)] | None, BeforeValidator(_empty_to_none)]

# Number of pieces ≥ 1 from a form field; empty becomes None
OptionalQuantity = Annotated[Annotated[int, Field(ge=1, le=999)] | None, BeforeValidator(_empty_to_none)]

# ID of another entity from a select field; empty ("none selected") becomes None
OptionalId = Annotated[Annotated[int, Field(ge=1)] | None, BeforeValidator(_empty_to_none)]

# ISO date (YYYY-MM-DD) and time of day (HH:MM) as strings, the way they are stored
IsoDate = Annotated[str, Field(pattern=r"^\d{4}-\d{2}-\d{2}$")]
OptionalIsoDate = Annotated[IsoDate | None, BeforeValidator(_empty_to_none)]
Time = Annotated[str, Field(pattern=r"^([01]\d|2[0-3]):[0-5]\d$")]
