#!/usr/bin/env python3
"""
Check system setup and prerequisites for INT8 calibration pipeline.
Verifies hardware, software, and data availability.
"""

import os
import sys
import subprocess
from pathlib import Path


class ColorText:
    """ANSI color codes for terminal output."""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color

    @staticmethod
    def success(text):
        return f"{ColorText.GREEN}✓ {text}{ColorText.NC}"

    @staticmethod
    def error(text):
        return f"{ColorText.RED}✗ {text}{ColorText.NC}"

    @staticmethod
    def warning(text):
        return f"{ColorText.YELLOW}⚠ {text}{ColorText.NC}"

    @staticmethod
    def info(text):
        return f"{ColorText.BLUE}ℹ {text}{ColorText.NC}"


def print_header(text):
    """Print section header."""
    print("\n" + "="*80)
    print(f"{ColorText.BLUE}{text}{ColorText.NC}")
    print("="*80 + "\n")


def check_python_packages():
    """Check required Python packages."""
    print_header("Python Packages")

    packages = {
        'numpy': 'NumPy',
        'cv2': 'OpenCV (opencv-python)',
        'tqdm': 'tqdm',
        'tensorrt': 'TensorRT',
        'pycuda': 'PyCUDA',
        'ultralytics': 'Ultralytics YOLO',
    }

    all_good = True

    for module, name in packages.items():
        try:
            if module == 'cv2':
                import cv2
                version = cv2.__version__
            elif module == 'ultralytics':
                import ultralytics
                version = ultralytics.__version__
            else:
                mod = __import__(module)
                version = getattr(mod, '__version__', 'unknown')

            print(ColorText.success(f"{name:30s} - version {version}"))
        except ImportError:
            print(ColorText.error(f"{name:30s} - NOT INSTALLED"))
            all_good = False

    return all_good


def check_nvidia_gpu():
    """Check NVIDIA GPU availability and capabilities."""
    print_header("NVIDIA GPU")

    # Check nvidia-smi
    try:
        result = subprocess.run(
            ['nvidia-smi', '--query-gpu=name,driver_version,memory.total',
             '--format=csv,noheader'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            gpu_info = result.stdout.strip()
            print(ColorText.success(f"GPU detected: {gpu_info}"))

            # Check for INT8 support
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=compute_cap', '--format=csv,noheader'],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode == 0:
                compute_cap = result.stdout.strip()
                major = int(compute_cap.split('.')[0])

                if major >= 6:  # Pascal or newer
                    print(ColorText.success(f"Compute Capability: {compute_cap} (INT8 supported)"))
                    return True
                else:
                    print(ColorText.warning(f"Compute Capability: {compute_cap} (INT8 may not be supported)"))
                    return False

        else:
            print(ColorText.error("nvidia-smi command failed"))
            return False

    except FileNotFoundError:
        print(ColorText.error("nvidia-smi not found - NVIDIA driver not installed?"))
        return False
    except Exception as e:
        print(ColorText.error(f"Failed to check GPU: {e}"))
        return False


def check_cuda():
    """Check CUDA installation."""
    print_header("CUDA")

    # Check nvcc
    try:
        result = subprocess.run(
            ['nvcc', '--version'],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode == 0:
            # Extract CUDA version
            for line in result.stdout.split('\n'):
                if 'release' in line.lower():
                    print(ColorText.success(f"CUDA: {line.strip()}"))
                    return True

    except FileNotFoundError:
        print(ColorText.warning("nvcc not found (CUDA toolkit not in PATH)"))
        print(ColorText.info("This is OK if TensorRT is installed via pip"))
        return True  # Not critical
    except Exception as e:
        print(ColorText.warning(f"Failed to check CUDA: {e}"))
        return True  # Not critical

    return True


def check_tensorrt():
    """Check TensorRT installation and version."""
    print_header("TensorRT")

    try:
        import tensorrt as trt

        print(ColorText.success(f"TensorRT version: {trt.__version__}"))

        # Check builder capabilities
        logger = trt.Logger(trt.Logger.WARNING)
        builder = trt.Builder(logger)

        print(ColorText.success(f"FP16 support: {builder.platform_has_fast_fp16}"))
        print(ColorText.success(f"INT8 support: {builder.platform_has_fast_int8}"))

        if not builder.platform_has_fast_int8:
            print(ColorText.error("INT8 not supported on this platform!"))
            return False

        return True

    except ImportError:
        print(ColorText.error("TensorRT not installed"))
        return False
    except Exception as e:
        print(ColorText.error(f"TensorRT check failed: {e}"))
        return False


def check_model_files():
    """Check model and data files."""
    print_header("Model and Data Files")

    files_to_check = {
        'Model': '/home/user/BAHB/runs/yolo26l_infrastructure/weights/best.pt',
        'Train Images': '/home/user/BAHB/data/merged/train/images',
        'Train Labels': '/home/user/BAHB/data/merged/train/labels',
        'Val Images': '/home/user/BAHB/data/merged/val/images',
        'Val Labels': '/home/user/BAHB/data/merged/val/labels',
    }

    all_good = True

    for name, path in files_to_check.items():
        path_obj = Path(path)

        if path_obj.exists():
            if path_obj.is_file():
                size_mb = path_obj.stat().st_size / (1 << 20)
                print(ColorText.success(f"{name:20s}: {path} ({size_mb:.1f} MB)"))
            else:
                # Directory - count files
                try:
                    num_files = len(list(path_obj.iterdir()))
                    print(ColorText.success(f"{name:20s}: {path} ({num_files} files)"))
                except Exception:
                    print(ColorText.success(f"{name:20s}: {path}"))
        else:
            print(ColorText.error(f"{name:20s}: {path} (NOT FOUND)"))
            all_good = False

    return all_good


def check_disk_space():
    """Check available disk space."""
    print_header("Disk Space")

    output_dir = Path('/home/user/BAHB/models/tensorrt')

    try:
        stat = os.statvfs(output_dir.parent if output_dir.exists() else '/')
        available_gb = (stat.f_bavail * stat.f_frsize) / (1 << 30)

        if available_gb > 5:
            print(ColorText.success(f"Available space: {available_gb:.1f} GB"))
            return True
        else:
            print(ColorText.warning(f"Available space: {available_gb:.1f} GB (recommend >5 GB)"))
            return False

    except Exception as e:
        print(ColorText.warning(f"Failed to check disk space: {e}"))
        return True  # Not critical


def check_permissions():
    """Check write permissions."""
    print_header("Permissions")

    dirs_to_check = [
        '/home/user/BAHB/models/tensorrt',
        '/home/user/BAHB/data/calibration',
    ]

    all_good = True

    for dir_path in dirs_to_check:
        path_obj = Path(dir_path)

        # Create directory if it doesn't exist
        try:
            path_obj.mkdir(parents=True, exist_ok=True)

            # Try to write a test file
            test_file = path_obj / '.write_test'
            test_file.write_text('test')
            test_file.unlink()

            print(ColorText.success(f"Write access: {dir_path}"))

        except Exception as e:
            print(ColorText.error(f"No write access: {dir_path} ({e})"))
            all_good = False

    return all_good


def estimate_runtime():
    """Estimate pipeline runtime."""
    print_header("Estimated Runtime")

    print("Pipeline steps:")
    print("  1. Calibration data prep:     2-3 min")
    print("  2. ONNX export:                1-2 min")
    print("  3. FP32 engine build:          2-3 min")
    print("  4. FP16 engine build:          2-3 min")
    print("  5. INT8 engine build:         10-15 min")
    print("  6. Accuracy validation:        5-8 min")
    print("  7. Performance benchmark:      2-3 min")
    print("  8. Report generation:          <1 min")
    print("  " + "-"*40)
    print("  Total:                        25-35 min")
    print()
    print(ColorText.info("Actual time may vary based on GPU and dataset size"))


def main():
    """Run all checks."""
    print_header("BAHB INT8 Calibration Pipeline - Setup Check")

    checks = {
        'Python Packages': check_python_packages,
        'NVIDIA GPU': check_nvidia_gpu,
        'CUDA': check_cuda,
        'TensorRT': check_tensorrt,
        'Model & Data': check_model_files,
        'Disk Space': check_disk_space,
        'Permissions': check_permissions,
    }

    results = {}

    for name, check_func in checks.items():
        try:
            results[name] = check_func()
        except Exception as e:
            print(ColorText.error(f"Check failed: {e}"))
            results[name] = False

    # Show estimate
    estimate_runtime()

    # Summary
    print_header("Summary")

    all_passed = all(results.values())

    for name, passed in results.items():
        status = ColorText.success("PASS") if passed else ColorText.error("FAIL")
        print(f"{name:20s}: {status}")

    print()

    if all_passed:
        print(ColorText.success("All checks passed! Ready to run calibration pipeline."))
        print()
        print("To start the pipeline, run:")
        print(f"  {ColorText.BLUE}cd /home/user/BAHB/scripts/calibration{ColorText.NC}")
        print(f"  {ColorText.BLUE}./run_full_pipeline.sh{ColorText.NC}")
        return 0
    else:
        print(ColorText.error("Some checks failed. Please resolve issues before running pipeline."))
        print()
        print("Common fixes:")
        print("  - Install missing packages: pip install -r requirements.txt")
        print("  - Check NVIDIA driver: nvidia-smi")
        print("  - Verify model file exists and paths are correct")
        return 1


if __name__ == '__main__':
    sys.exit(main())
