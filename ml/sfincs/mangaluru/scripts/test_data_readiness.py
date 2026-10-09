#!/usr/bin/env python3
"""Dependency-free tests for the real-input readiness boundary."""

import csv
import json
import tempfile
import unittest
from pathlib import Path

from provenance import sha256_file
from validate_inputs import build_readiness_report, load_time_series, validate_flood_extent


class DataReadinessTests(unittest.TestCase):
    def test_rainfall_csv_is_strict_and_canonicalized(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "rain.csv"
            path.write_text("timestamp,rainfall\n2020-01-01T00:00:00Z,1.5\n2020-01-01T01:00:00Z,0\n", encoding="utf-8")
            records, metadata = load_time_series(path, "rainfall")
            self.assertEqual(records[0][0], "2020-01-01T00:00:00Z")
            self.assertEqual(metadata["records"], 2)

    def test_json_duplicate_timestamps_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "tide.json"
            path.write_text(json.dumps([{"time": "2020-01-01T00:00:00Z", "water_level": 1}, {"time": "2020-01-01T00:00:00Z", "water_level": 2}]), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "duplicate"):
                load_time_series(path, "tide")

    def test_flood_extent_must_intersect_domain(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "extent.geojson"
            path.write_text(json.dumps({"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]}}), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "does not intersect"):
                validate_flood_extent(path)

    def test_synthetic_manifest_cannot_be_operational(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rain = root / "rain.csv"
            rain.write_text("timestamp,rainfall\n2020-01-01T00:00:00Z,1\n2020-01-01T01:00:00Z,2\n", encoding="utf-8")
            tide = root / "tide.csv"
            tide.write_text("timestamp,water_level\n2020-01-01T00:00:00Z,1\n2020-01-01T01:00:00Z,2\n", encoding="utf-8")
            extent = root / "extent.geojson"
            extent.write_text(json.dumps({"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[74.85, 12.86], [74.86, 12.86], [74.86, 12.87], [74.85, 12.86]]]}}), encoding="utf-8")
            manifest = root / "manifest.json"
            entries = {}
            for name, path, crs, datum in (("rainfall", rain, "not applicable", "not applicable"), ("tide", tide, "not applicable", "MSL"), ("flood_extent", extent, "EPSG:4326", "not applicable")):
                entries[name] = {"path": str(path), "status": "assumed", "provenance_class": "synthetic", "source": "test fixture", "checksum_sha256": sha256_file(path), "crs": crs, "vertical_datum": datum}
            manifest.write_text(json.dumps({"version": 1, "inputs": entries}), encoding="utf-8")
            report = build_readiness_report(root=root, paths={"dem": None, "rainfall": str(rain), "tide": str(tide), "river": None, "flood_extent": str(extent)}, manifest_path=manifest, operational=True)
            self.assertFalse(report["operational_ready"])
            self.assertEqual(report["inputs"]["rainfall"]["status"], "assumed")


if __name__ == "__main__":
    unittest.main()
