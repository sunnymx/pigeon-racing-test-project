#!/usr/bin/env python3
"""
Generate Mermaid dependency graph from tickets.

Usage:
    python build_dependency_graph.py <tickets_directory>

Example:
    python build_dependency_graph.py docs/tickets/feature-name/
"""

import sys
import re
from pathlib import Path
from typing import Dict, List, Set


class DependencyGraphBuilder:
    """Builds Mermaid dependency graph from ticket files."""

    def __init__(self, tickets_dir: str):
        self.tickets_dir = Path(tickets_dir)
        self.tickets: Dict[str, Dict] = {}
        self.graph_lines: List[str] = []

    def parse_tickets(self) -> None:
        """Parse all ticket files in directory."""
        ticket_files = sorted(self.tickets_dir.glob("ticket-*.md"))

        for ticket_file in ticket_files:
            content = ticket_file.read_text(encoding='utf-8')

            # Extract ticket ID
            ticket_id = ticket_file.stem  # e.g., "ticket-001-setup"
            ticket_number = re.search(r'ticket-(\d+)', ticket_id).group(1)

            # Extract title
            title_match = re.search(r'^#\s+Ticket-\d+:\s*(.+)$', content, re.MULTILINE)
            title = title_match.group(1) if title_match else "Unknown"

            # Extract dependencies
            depends_match = re.search(r'\*\*depends_on\*\*:\s*(.+)$', content, re.MULTILINE)
            depends_on = []
            if depends_match:
                deps_str = depends_match.group(1).strip()
                if deps_str and deps_str.lower() != "none":
                    # Parse dependencies (format: "ticket-001, ticket-002")
                    depends_on = [d.strip() for d in deps_str.split(',')]

            # Extract status
            status_match = re.search(r'\*\*status\*\*:\s*([🟡🔵✅🔴])', content)
            status = status_match.group(1) if status_match else "🟡"

            self.tickets[ticket_number] = {
                'id': ticket_number,
                'title': title,
                'depends_on': depends_on,
                'status': status
            }

    def detect_circular_dependencies(self) -> List[str]:
        """Detect circular dependencies using DFS."""
        def has_cycle(ticket_num: str, visited: Set[str], rec_stack: Set[str]) -> bool:
            visited.add(ticket_num)
            rec_stack.add(ticket_num)

            deps = self.tickets[ticket_num]['depends_on']
            for dep in deps:
                dep_num = re.search(r'(\d+)', dep)
                if not dep_num:
                    continue
                dep_num = dep_num.group(1)

                if dep_num not in self.tickets:
                    continue

                if dep_num not in visited:
                    if has_cycle(dep_num, visited, rec_stack):
                        return True
                elif dep_num in rec_stack:
                    return True

            rec_stack.remove(ticket_num)
            return False

        visited: Set[str] = set()
        rec_stack: Set[str] = set()
        cycles = []

        for ticket_num in self.tickets:
            if ticket_num not in visited:
                if has_cycle(ticket_num, visited, rec_stack):
                    cycles.append(ticket_num)

        return cycles

    def build_graph(self) -> str:
        """Build Mermaid graph syntax."""
        self.graph_lines = ["```mermaid", "graph TD"]

        # Add nodes
        for ticket_num, ticket in self.tickets.items():
            node_id = f"T{ticket_num}"
            title = ticket['title'][:30]  # Truncate long titles
            status = ticket['status']

            # Add node with styling based on status
            self.graph_lines.append(f"    {node_id}[Ticket-{ticket_num}: {title}]")

            # Add dependencies (edges)
            for dep in ticket['depends_on']:
                dep_num = re.search(r'(\d+)', dep)
                if dep_num:
                    dep_num = dep_num.group(1)
                    dep_id = f"T{dep_num}"
                    self.graph_lines.append(f"    {dep_id} --> {node_id}")

        # Add styling
        self.graph_lines.append("")
        self.graph_lines.append("    %% Styling")
        for ticket_num, ticket in self.tickets.items():
            node_id = f"T{ticket_num}"
            status = ticket['status']

            if status == "✅":
                self.graph_lines.append(f"    style {node_id} fill:#90EE90")  # Green
            elif status == "🔵":
                self.graph_lines.append(f"    style {node_id} fill:#87CEEB")  # Blue
            elif status == "🔴":
                self.graph_lines.append(f"    style {node_id} fill:#FFB6C1")  # Red
            else:  # 🟡
                self.graph_lines.append(f"    style {node_id} fill:#FFD700")  # Yellow

        self.graph_lines.append("```")

        return "\n".join(self.graph_lines)

    def save_graph(self, output_path: str) -> None:
        """Save graph to file."""
        output_file = Path(output_path)
        output_file.write_text(self.build_graph(), encoding='utf-8')
        print(f"✅ Dependency graph saved to: {output_file}")


def main():
    """Main entry point."""
    if len(sys.argv) != 2:
        print("Usage: python build_dependency_graph.py <tickets_directory>")
        print("\nExample:")
        print("  python build_dependency_graph.py docs/tickets/feature-name/")
        sys.exit(1)

    tickets_dir = sys.argv[1]
    builder = DependencyGraphBuilder(tickets_dir)

    print(f"🔍 Scanning tickets in: {tickets_dir}")
    builder.parse_tickets()
    print(f"📊 Found {len(builder.tickets)} tickets")

    # Check for circular dependencies
    cycles = builder.detect_circular_dependencies()
    if cycles:
        print(f"\n❌ ERROR: Circular dependencies detected involving tickets: {', '.join(cycles)}")
        sys.exit(1)
    else:
        print("✅ No circular dependencies detected")

    # Build and save graph
    output_path = Path(tickets_dir) / "dependencies.mermaid"
    builder.save_graph(str(output_path))

    print("\n📈 Dependency graph generated successfully!")


if __name__ == "__main__":
    main()
