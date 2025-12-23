#!/usr/bin/env python3
"""
MinerU CPU-only wrapper - patches torch to disable MPS before running MinerU.
"""
import sys
import os

# Patch torch before it's used
import torch
import torch.backends.mps

# Disable MPS
torch.backends.mps.is_available = lambda: False
torch.backends.mps.is_built = lambda: False

print(f"[MinerU CPU Wrapper] MPS disabled: is_available={torch.backends.mps.is_available()}")

# Now import and run mineru - correct entry point
from mineru.cli.client import main

if __name__ == '__main__':
    main()
