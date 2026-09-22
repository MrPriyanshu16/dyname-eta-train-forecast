"""
Unit tests for rajasthan_live_tracker package
"""

import unittest
import os
import sys

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from rajasthan_live_tracker.live_locator import get_station_geo, is_rajasthan_train
from rajasthan_live_tracker.ntes_live_fetcher import _parse_delay_minutes


class TestRajasthanLiveTracker(unittest.TestCase):

    def test_parse_delay_minutes(self):
        self.assertEqual(_parse_delay_minutes('00:28'), 28)
        self.assertEqual(_parse_delay_minutes('01:15'), 75)
        self.assertEqual(_parse_delay_minutes('Delay- 00:42'), 42)
        self.assertEqual(_parse_delay_minutes(''), 0)
        self.assertEqual(_parse_delay_minutes(None), 0)

    def test_station_geo_lookup(self):
        geo = get_station_geo('NGO')
        self.assertIsNotNone(geo)
        self.assertEqual(geo['code'], 'NGO')
        self.assertAlmostEqual(geo['latitude'], 27.20, places=1)
        self.assertAlmostEqual(geo['longitude'], 73.72, places=1)

    def test_rajasthan_train_validation(self):
        # Train 14888 touches Rajasthan (Barmer, Jodhpur, Bikaner, etc.)
        info = is_rajasthan_train('14888')
        self.assertTrue(info['touches_rajasthan'])
        self.assertGreater(info['rajasthan_stop_count'], 0)

        # Train 19720 touches Rajasthan (Suratgarh, Jaipur, Marwar Chapri)
        info2 = is_rajasthan_train('19720')
        self.assertTrue(info2['touches_rajasthan'])
        self.assertGreater(info2['rajasthan_stop_count'], 0)


if __name__ == '__main__':
    unittest.main()
