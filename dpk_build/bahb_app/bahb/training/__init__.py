"""
Training Pipeline Module - Based on "Solving a Million-Step LLM Task with Zero Errors"

Key principles:
1. Iterative refinement with validation at each step
2. Checkpointing for recovery
3. Data validation before training
4. Progressive training stages
"""

from bahb.training.pipeline import TrainingPipeline
from bahb.training.data import DataValidator, DatasetManager
from bahb.training.stages import TrainingStage, TrainingState

__all__ = [
    "TrainingPipeline",
    "DataValidator",
    "DatasetManager",
    "TrainingStage",
    "TrainingState",
]
