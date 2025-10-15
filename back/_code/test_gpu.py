import cupy as cp
import numpy as np

try:
    gpu_array = cp.arange(10)
    gpu_array_squared = gpu_array ** 2
    cpu_result = cp.asnumpy(gpu_array_squared)

except Exception as e:
    print(f"CuPy could not access the GPU.")
    print(f"Error: {e}")