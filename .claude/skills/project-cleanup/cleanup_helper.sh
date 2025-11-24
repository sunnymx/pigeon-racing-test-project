#!/bin/bash
# Project Cleanup Helper Script
# Assists with automated cleanup tasks

set -e

PROJECT_ROOT="${1:-.}"
cd "$PROJECT_ROOT"

echo "🧹 Project Cleanup Helper"
echo "=========================="
echo ""

# Function to find test files
find_test_files() {
    echo "📝 Scanning for test files..."
    find . -maxdepth 1 -type f \( -name "test_*.py" -o -name "*_test.py" \) 2>/dev/null || true
}

# Function to check documentation status
check_docs() {
    echo ""
    echo "📚 Checking documentation..."

    if [ -f "docs/README.md" ]; then
        echo "  ✓ docs/README.md exists"
        LAST_UPDATE=$(grep -o "最後更新.*[0-9-]\+" docs/README.md | tail -1 || echo "Not found")
        echo "    Last update: $LAST_UPDATE"
    else
        echo "  ✗ docs/README.md missing"
    fi

    if [ -f "CLAUDE.md" ]; then
        echo "  ✓ CLAUDE.md exists"
    else
        echo "  ✗ CLAUDE.md missing"
    fi

    if [ -f "tests/README.md" ]; then
        echo "  ✓ tests/README.md exists"
    else
        echo "  ✗ tests/README.md missing"
    fi
}

# Function to check test directory structure
check_test_structure() {
    echo ""
    echo "🧪 Checking test structure..."

    for dir in "tests/ui" "tests/integration" "tests/unit"; do
        if [ -d "$dir" ]; then
            count=$(find "$dir" -name "*.py" | wc -l)
            echo "  ✓ $dir exists ($count test files)"
        else
            echo "  ✗ $dir missing"
        fi
    done
}

# Function to find recent changes
check_recent_changes() {
    echo ""
    echo "📅 Recent changes (last 24 hours)..."
    find . -type f -mtime -1 -not -path "*/\.*" -not -path "*/venv/*" -not -path "*/__pycache__/*" | head -20 || echo "  No recent changes found"
}

# Main execution
echo ""
find_test_files
check_docs
check_test_structure
check_recent_changes

echo ""
echo "✅ Scan complete"
echo ""
echo "Recommended actions:"
echo "  1. Move test files to tests/ subdirectories"
echo "  2. Update documentation if outdated"
echo "  3. Create changelog for today's work"
