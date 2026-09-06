"""Registry of all dataset preparers."""

from ai.datasets.ip102 import IP102Preparer
from ai.datasets.maize_nutrient import MaizeNutrientPreparer
from ai.datasets.nitrogen_maize import NitrogenMaizePreparer
from ai.datasets.own_field import OwnFieldPreparer
from ai.datasets.plantdoc import PlantDocPreparer
from ai.datasets.plantvillage import PlantVillagePreparer

PREPARERS = {
    "plantvillage": PlantVillagePreparer,
    "plantdoc": PlantDocPreparer,
    "ip102": IP102Preparer,
    "maize_nutrient": MaizeNutrientPreparer,
    "nitrogen_maize": NitrogenMaizePreparer,
    "own_field": OwnFieldPreparer,
}

AI_TASK_MAP = {
    "disease": ["plantvillage", "plantdoc"],
    "pest": ["ip102"],
    "nutrient": ["maize_nutrient"],
    "nitrogen": ["nitrogen_maize"],
    "domain_adaptation": ["own_field"],
}
