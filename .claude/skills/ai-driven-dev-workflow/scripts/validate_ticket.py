#!/usr/bin/env python3
"""
Validate ticket structure against AI-Driven Development Workflow standards.

Usage:
    python validate_ticket.py <ticket_file_path>

Example:
    python validate_ticket.py docs/tickets/feature-name/ticket-001-setup.md
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Tuple


class TicketValidator:
    """Validates ticket structure and content quality."""

    REQUIRED_SECTIONS = [
        "Summary",
        "Why",
        "Scope",
        "Out-of-Scope",
        "Acceptance Criteria",
        "Implementation Steps",
        "Test/Validation",
        "Files to Modify/Add",
        "Definition of Done",
    ]

    def __init__(self, ticket_path: str):
        self.ticket_path = Path(ticket_path)
        self.content = self._read_ticket()
        self.errors: List[str] = []
        self.warnings: List[str] = []
        self.score = 0
        self.max_score = 12

    def _read_ticket(self) -> str:
        """Read ticket file content."""
        try:
            return self.ticket_path.read_text(encoding='utf-8')
        except FileNotFoundError:
            print(f"❌ Error: Ticket file not found: {self.ticket_path}")
            sys.exit(1)

    def validate_metadata(self) -> None:
        """Validate YAML frontmatter metadata."""
        # Check depends_on
        if "depends_on:" in self.content:
            self.score += 1
        else:
            self.errors.append("Missing 'depends_on:' field")

        # Check estimated_time
        if "estimated_time:" in self.content:
            self.score += 1
        else:
            self.errors.append("Missing 'estimated_time:' field")

        # Check priority
        if re.search(r'priority:\s*(P[0-4])', self.content):
            self.score += 1
        else:
            self.errors.append("Missing or invalid 'priority:' field")

    def validate_sections(self) -> None:
        """Validate required sections exist."""
        for section in self.REQUIRED_SECTIONS:
            if f"## {section}" in self.content or f"# {section}" in self.content:
                self.score += 1
            else:
                self.errors.append(f"Missing section: {section}")
                if section == "Out-of-Scope":
                    self.errors.append("  ⚠️  CRITICAL: Out-of-Scope section is mandatory!")

    def validate_acceptance_criteria(self) -> None:
        """Validate Acceptance Criteria quality."""
        ac_match = re.findall(r'-\s*\[\s*\]\s*\*\*AC\d+\*\*:', self.content)
        ac_count = len(ac_match)

        if ac_count == 0:
            self.warnings.append("No Acceptance Criteria found")
        elif ac_count < 3:
            self.warnings.append(f"Only {ac_count} AC (recommended: 3-5)")
        elif ac_count > 5:
            self.warnings.append(f"{ac_count} AC (recommended: 3-5, may be too many)")

    def validate_time_estimate(self) -> None:
        """Validate time estimate is realistic."""
        time_match = re.search(r'estimated_time:\s*(\d+)-(\d+)h', self.content)
        if time_match:
            min_hours = int(time_match.group(1))
            max_hours = int(time_match.group(2))

            if max_hours <= 4:
                pass  # Ideal
            elif max_hours <= 6:
                self.warnings.append(f"Time estimate {min_hours}-{max_hours}h is on the high side (ideal: 2-4h)")
            else:
                self.errors.append(f"Time estimate {min_hours}-{max_hours}h is too large (should split ticket)")

    def validate(self) -> Tuple[bool, int]:
        """
        Run all validations.

        Returns:
            (is_valid, score): Boolean indicating if ticket is valid, and quality score
        """
        print(f"\n🔍 Validating: {self.ticket_path.name}\n")

        self.validate_metadata()
        self.validate_sections()
        self.validate_acceptance_criteria()
        self.validate_time_estimate()

        is_valid = len(self.errors) == 0

        return is_valid, self.score

    def print_report(self) -> None:
        """Print validation report."""
        print("=" * 60)
        print("VALIDATION REPORT")
        print("=" * 60)

        print(f"\n📁 File: {self.ticket_path}")
        print(f"📊 Score: {self.score}/{self.max_score}")

        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  • {error}")

        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")

        if not self.errors and not self.warnings:
            print("\n✅ All checks passed!")

        print("\n" + "=" * 60)

        if self.score >= 10:
            print("✅ RESULT: Excellent - Ready for execution")
        elif self.score >= 8:
            print("✅ RESULT: Good - Minor improvements suggested")
        elif self.score >= 6:
            print("⚠️  RESULT: Acceptable - Needs revision")
        else:
            print("❌ RESULT: Needs improvement - Must revise before execution")

        print("=" * 60 + "\n")


def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python validate_ticket.py <ticket_file_path>")
        print("\nExample:")
        print("  python validate_ticket.py docs/tickets/feature-name/ticket-001-setup.md")
        sys.exit(1)

    ticket_path = sys.argv[1]
    validator = TicketValidator(ticket_path)
    is_valid, score = validator.validate()
    validator.print_report()

    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
