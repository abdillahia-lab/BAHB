#!/bin/bash
# BAHB Test Runner Script
# Provides convenient commands for running different test suites

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_msg() {
    color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Print usage
usage() {
    cat << EOF
BAHB Test Runner

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    all         Run all tests
    unit        Run only unit tests (fast)
    integration Run integration tests
    gpu         Run GPU tests (requires CUDA)
    benchmark   Run performance benchmarks
    slow        Run slow tests
    coverage    Run tests with coverage report
    quick       Quick check (unit tests only)
    help        Show this help message

Options:
    -v          Verbose output
    -x          Stop on first failure
    -k EXPR     Only run tests matching EXPR
    --pdb       Drop into debugger on failures

Examples:
    $0 all              # Run all tests
    $0 unit -v          # Run unit tests verbosely
    $0 integration -x   # Stop on first integration test failure
    $0 -k test_yolo     # Run only tests matching 'test_yolo'

EOF
}

# Generate test data if needed
setup_test_data() {
    if [ ! -f "tests/test_data/images/transformer_sample.jpg" ]; then
        print_msg "$YELLOW" "Generating test data..."
        python tests/generate_test_data.py
    fi
}

# Change to repo root
cd "$(dirname "$0")/.."

case "${1:-help}" in
    all)
        shift
        print_msg "$BLUE" "Running all tests..."
        setup_test_data
        pytest tests/ "$@"
        ;;
    unit)
        shift
        print_msg "$BLUE" "Running unit tests..."
        pytest tests/ -m unit "$@"
        ;;
    integration)
        shift
        print_msg "$BLUE" "Running integration tests..."
        setup_test_data
        pytest tests/ -m integration "$@"
        ;;
    gpu)
        shift
        print_msg "$BLUE" "Running GPU tests..."
        setup_test_data
        pytest tests/ -m gpu "$@"
        ;;
    benchmark)
        shift
        print_msg "$BLUE" "Running benchmark tests..."
        setup_test_data
        pytest tests/ -m benchmark -v "$@"
        ;;
    slow)
        shift
        print_msg "$BLUE" "Running slow tests..."
        setup_test_data
        pytest tests/ -m slow "$@"
        ;;
    coverage)
        shift
        print_msg "$BLUE" "Running tests with coverage..."
        setup_test_data
        pytest tests/ --cov=bahb --cov-report=html --cov-report=term "$@"
        print_msg "$GREEN" "Coverage report: htmlcov/index.html"
        ;;
    quick)
        shift
        print_msg "$BLUE" "Quick test (unit tests only)..."
        pytest tests/ -m unit -x "$@"
        ;;
    help)
        usage
        ;;
    *)
        print_msg "$RED" "Unknown command: $1"
        echo
        usage
        exit 1
        ;;
esac

exit_code=$?

if [ $exit_code -eq 0 ]; then
    print_msg "$GREEN" "✓ Tests passed!"
else
    print_msg "$RED" "✗ Tests failed!"
fi

exit $exit_code
