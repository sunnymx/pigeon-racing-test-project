#!/usr/bin/env python3
"""
Check test coverage and validate against quality standards.

Usage:
    python check_test_coverage.py <module_path>

Example:
    python check_test_coverage.py src/utils/string_utils.py
"""

import sys
import subprocess
import re
from pathlib import Path


class CoverageChecker:
    """Validates test coverage against quality standards."""

    MIN_COVERAGE = 90.0

    def __init__(self, module_path: str):
        self.module_path = Path(module_path)
        self.coverage_percent = 0.0
        self.missing_lines: list[str] = []

    def run_pytest_coverage(self) -> tuple[bool, str]:
        """
        Run pytest with coverage.

        Returns:
            (success, output): Success status and pytest output
        """
        try:
            # Convert file path to module path for coverage
            module_for_coverage = str(self.module_path).replace('/', '.').replace('.py', '')

            cmd = [
                'pytest',
                f'--cov={module_for_coverage}',
                '--cov-report=term-missing',
                '-v'
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60
            )

            output = result.stdout + result.stderr
            return result.returncode == 0, output

        except subprocess.TimeoutExpired:
            return False, "ERROR: Test execution timed out (>60s)"
        except FileNotFoundError:
            return False, "ERROR: pytest not found. Install with: pip install pytest pytest-cov"

    def parse_coverage_output(self, output: str) -> None:
        """Parse coverage percentage from pytest output."""
        # Look for coverage line: "src/utils/string_utils.py    92%   5-7"
        coverage_match = re.search(
            r'(\S+)\s+(\d+)%(?:\s+(.+))?',
            output
        )

        if coverage_match:
            self.coverage_percent = float(coverage_match.group(2))
            missing = coverage_match.group(3)
            if missing:
                self.missing_lines = [missing.strip()]

    def validate_coverage(self) -> bool:
        """
        Validate coverage meets minimum threshold.

        Returns:
            True if coverage >= MIN_COVERAGE, False otherwise
        """
        return self.coverage_percent >= self.MIN_COVERAGE

    def print_report(self, test_success: bool, output: str) -> None:
        """Print coverage report."""
        print("\n" + "=" * 60)
        print("TEST COVERAGE REPORT")
        print("=" * 60)

        print(f"\n📁 Module: {self.module_path}")
        print(f"🎯 Target Coverage: ≥{self.MIN_COVERAGE}%")
        print(f"📊 Actual Coverage: {self.coverage_percent:.1f}%")

        if test_success:
            print("✅ Tests: All passing")
        else:
            print("❌ Tests: Some failing")

        if self.missing_lines:
            print(f"\n⚠️  Missing Coverage:")
            for line in self.missing_lines:
                print(f"  Lines: {line}")

        print("\n" + "=" * 60)

        if not test_success:
            print("❌ RESULT: Tests failing - Fix tests first")
        elif self.validate_coverage():
            print(f"✅ RESULT: Coverage OK ({self.coverage_percent:.1f}% ≥ {self.MIN_COVERAGE}%)")
        else:
            print(f"❌ RESULT: Coverage insufficient ({self.coverage_percent:.1f}% < {self.MIN_COVERAGE}%)")
            print(f"\n💡 Suggestion: Add tests to cover lines: {', '.join(self.missing_lines)}")

        print("=" * 60 + "\n")

    def check(self) -> bool:
        """
        Run coverage check.

        Returns:
            True if coverage meets standards, False otherwise
        """
        print(f"\n🔍 Running coverage check for: {self.module_path}\n")

        test_success, output = self.run_pytest_coverage()
        self.parse_coverage_output(output)
        self.print_report(test_success, output)

        return test_success and self.validate_coverage()


def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python check_test_coverage.py <module_path>")
        print("\nExample:")
        print("  python check_test_coverage.py src/utils/string_utils.py")
        print("\nThis script runs pytest with coverage and validates:")
        print("  1. All tests pass")
        print("  2. Coverage ≥ 90%")
        sys.exit(1)

    module_path = sys.argv[1]

    if not Path(module_path).exists():
        print(f"❌ Error: Module not found: {module_path}")
        sys.exit(1)

    checker = CoverageChecker(module_path)
    success = checker.check()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
