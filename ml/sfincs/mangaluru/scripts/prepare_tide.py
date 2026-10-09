#!/usr/bin/env python3
"""Prepare an explicitly supplied tide/water-level time series.

This script intentionally does not synthesize a harmonic tide when the input
is absent.  Synthetic fixtures remain available in the checked-in simulation
directories, but cannot be mistaken for operational forcing.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from .validate_inputs import load_time_series
except ImportError:
    from validate_inputs import load_time_series


def prepare_tide(input_path: str, output_path: str, datum_offset_m: float = 0.0) -> bool:
    input_p = Path(input_path)
    output_p = Path(output_path)
    records, _ = load_time_series(input_p, "tide")
    output_p.parent.mkdir(parents=True, exist_ok=True)
    with output_p.open("w", encoding="utf-8") as stream:
        for timestamp, level in records:
            formatted = timestamp.replace("-", "").replace("T", " ").replace(":", "")[:15]
            stream.write(f"{formatted} {level + datum_offset_m:.3f}\n")
    print(f"[Tide] wrote {len(records)} validated water-level records to {output_p}")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare a local tide/water-level forcing file")
    parser.add_argument("--input", required=True, help="Explicit local CSV or JSON time series")
    parser.add_argument("--output", required=True)
    parser.add_argument("--datum-offset", type=float, default=0.0, help="Documented offset applied to source values")
    args = parser.parse_args()
    try:
        prepare_tide(args.input, args.output, args.datum_offset)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
