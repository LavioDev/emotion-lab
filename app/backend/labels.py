"""Canonical label order for the DAIR.AI Emotion classification task."""

from collections.abc import Sequence

LABELS: tuple[str, ...] = (
    "sadness",
    "joy",
    "love",
    "anger",
    "fear",
    "surprise",
)

LABEL2ID: dict[str, int] = {label: index for index, label in enumerate(LABELS)}
ID2LABEL: dict[int, str] = {index: label for label, index in LABEL2ID.items()}


def validate_label_order(label_names: Sequence[str]) -> None:
    """Raise when dataset labels differ from the configured six-class order."""
    actual = tuple(label_names)
    if actual != LABELS:
        raise ValueError(
            "Dataset label order does not match the configured mapping. "
            f"Expected {LABELS}, received {actual}."
        )
