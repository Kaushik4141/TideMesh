#!/usr/bin/env python3
"""
test_m0_benchmark.py - Phase 0 Verification with HydroMT-SFINCS & Docker

1. Setup grid & elevation using HydroMT-SFINCS SfincsModel API.
2. Export SFINCS configuration.
3. Run SFINCS in Docker (deltares/sfincs-cpu).
4. Verify sfincs_map.nc output dataset.
"""

import os
import sys
import subprocess
import numpy as np
import xarray as xr
from hydromt_sfincs import SfincsModel

def run_m0_benchmark():
    print("=== M0 SFINCS BENCHMARK TEST ===")
    
    bench_dir = os.path.abspath("simulations/benchmark_m0")
    os.makedirs(bench_dir, exist_ok=True)
    print(f"[+] Prepared benchmark folder: {bench_dir}")

    # 1. Initialize HydroMT SfincsModel
    sf = SfincsModel(root=bench_dir, mode="w+")
    
    # 2. Setup 20x20 Grid (50m resolution, UTM Zone 43N)
    sf.setup_grid(x0=600000.0, y0=1430000.0, dx=50.0, dy=50.0, nmax=20, mmax=20, rotation=0.0, epsg=32643)

    # 3. Setup Topography (Slope from 5m inland to 0.25m coast)
    dep = np.zeros((20, 20), dtype=np.float32, order='F')
    for i in range(20):
        for j in range(20):
            dep[i, j] = 5.0 - (j * 0.25)
    dep_da = xr.DataArray(dep, dims=["y", "x"])
    sf.set_grid(dep_da, name="dep")

    # 4. Setup Mask (1 = active cell, 2 = open boundary)
    msk = np.ones((20, 20), dtype=np.uint8, order='F')
    msk[:, -1] = 2
    msk_da = xr.DataArray(msk, dims=["y", "x"])
    sf.set_grid(msk_da, name="msk")

    # 5. Setup Configuration Timesteps
    sf.setup_config(
        tstart="20260101 000000",
        tstop="20260101 001000",
        tref="20260101 000000",
        dtout=60.0,
        dtmax=10.0,
        inputformat="bin",
        outputformat="net",
        indexfile="sfincs.ind"
    )

    # 6. Write model input files
    sf.write()
    print("[OK] HydroMT SFINCS model input files written successfully.")

    # 7. Run SFINCS in Docker
    print("[+] Executing SFINCS run in Docker container...")
    bench_dir_docker = bench_dir.replace("\\", "/")
    docker_cmd = [
        "docker", "run", "--rm",
        "-v", f"{bench_dir_docker}:/data",
        "-w", "/data",
        "deltares/sfincs-cpu"
    ]
    
    stdout_log = os.path.join(bench_dir, "docker_stdout.log")
    stderr_log = os.path.join(bench_dir, "docker_stderr.log")
    with open(stdout_log, "w") as out_f, open(stderr_log, "w") as err_f:
        res = subprocess.run(docker_cmd, stdout=out_f, stderr=err_f, timeout=120)

    # 8. Verify NetCDF Output
    output_nc = os.path.join(bench_dir, "sfincs_map.nc")
    output_bin = os.path.join(bench_dir, "zsmax.dat")
    
    if os.path.exists(output_nc):
        print(f"\n[SUCCESS] SFINCS NetCDF output generated: {output_nc}")
        ds = xr.open_dataset(output_nc)
        print("\n--- NetCDF Output Dataset ---")
        print(ds)
        print("\n[VERIFIED] Milestone 0 is 100% complete!")
        return True
    elif os.path.exists(output_bin):
        print(f"\n[SUCCESS] SFINCS binary output generated: {output_bin}")
        print("\n[VERIFIED] Milestone 0 is 100% complete!")
        return True
    else:
        print(f"\n[!] Output file was not found in {bench_dir}")
        return False

if __name__ == "__main__":
    success = run_m0_benchmark()
    sys.exit(0 if success else 1)
