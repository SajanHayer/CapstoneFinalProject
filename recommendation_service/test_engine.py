import unittest

from engine import generate_recommendations


class RecommendationEngineTests(unittest.TestCase):
    def test_prefers_similar_location_and_type(self):
        payload = {
            "history": [
                {
                    "listing_id": 1,
                    "interaction_score": 3,
                    "type": "auction",
                    "location": "Calgary, AB",
                    "price": 10000,
                    "make": "Honda",
                    "condition": "used",
                    "year": 2021,
                    "views_count": 4,
                    "bid_count": 1,
                }
            ],
            "candidates": [
                {
                    "listing_id": 10,
                    "type": "auction",
                    "location": "Calgary, AB",
                    "price": 9800,
                    "make": "Honda",
                    "condition": "used",
                    "year": 2020,
                    "views_count": 12,
                    "bid_count": 3,
                },
                {
                    "listing_id": 11,
                    "type": "fixed",
                    "location": "Toronto, ON",
                    "price": 25000,
                    "make": "Polaris",
                    "condition": "new",
                    "year": 2024,
                    "views_count": 2,
                    "bid_count": 0,
                },
            ],
            "limit": 2,
        }

        result = generate_recommendations(payload)
        self.assertEqual(result["recommendations"][0]["listing_id"], 10)
        self.assertTrue(result["recommendations"][0]["explanations"])


if __name__ == "__main__":
    unittest.main()
