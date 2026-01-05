#!/usr/bin/env python3
"""
BAHB Codebase Cleanup Tool

Automates safe cleanup of dead code, duplicates, and unused files.
Run with --dry-run first to preview changes.

Usage:
    python cleanup.py --dry-run          # Preview changes
    python cleanup.py --execute          # Apply changes
    python cleanup.py --execute --backup # Apply with backup
"""

import argparse
import shutil
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Tuple

class CodebaseCleanup:
    """Automated cleanup tool for BAHB codebase."""

    def __init__(self, project_root: Path, dry_run: bool = True, create_backup: bool = False):
        self.project_root = Path(project_root)
        self.dry_run = dry_run
        self.create_backup = create_backup
        self.changes = []
        self.backup_dir = None

    def run(self):
        """Execute all cleanup tasks."""
        print("=" * 60)
        print("BAHB Codebase Cleanup Tool")
        print("=" * 60)
        print(f"Project root: {self.project_root}")
        print(f"Mode: {'DRY RUN (no changes)' if self.dry_run else 'EXECUTE (will modify files)'}")
        print()

        if self.create_backup and not self.dry_run:
            self._create_backup()

        # Run cleanup tasks
        self._remove_dead_files()
        self._remove_unrelated_external_datasets()
        self._clean_generated_test_images()
        self._remove_empty_directories()
        self._find_unused_imports()

        # Report
        self._print_summary()

    def _create_backup(self):
        """Create timestamped backup of project."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_dir = self.project_root.parent / f"BAHB_backup_{timestamp}"

        print(f"\nCreating backup: {self.backup_dir}")
        try:
            shutil.copytree(
                self.project_root,
                self.backup_dir,
                ignore=shutil.ignore_patterns('__pycache__', '*.pyc', '.git', 'venv', 'runs')
            )
            print("✓ Backup created successfully")
        except Exception as e:
            print(f"✗ Backup failed: {e}")
            sys.exit(1)

    def _remove_dead_files(self):
        """Remove confirmed dead code files."""
        print("\n" + "=" * 60)
        print("REMOVING DEAD CODE FILES")
        print("=" * 60)

        dead_files = [
            "_train.py",  # Auto-generated artifact
            "train_bahb.py",  # Redundant with run_training.py
        ]

        for filename in dead_files:
            file_path = self.project_root / filename
            if file_path.exists():
                self._record_change("DELETE", file_path)
                if not self.dry_run:
                    file_path.unlink()
                    print(f"  ✓ Deleted: {filename}")
                else:
                    print(f"  Would delete: {filename}")
            else:
                print(f"  ⊗ Not found (already deleted?): {filename}")

    def _remove_unrelated_external_datasets(self):
        """Remove external datasets that aren't used."""
        print("\n" + "=" * 60)
        print("REMOVING UNRELATED EXTERNAL DATASETS")
        print("=" * 60)

        external_dir = self.project_root / "external_datasets"
        if not external_dir.exists():
            print("  ⊗ external_datasets/ directory not found")
            return

        unrelated = [
            "open-buildings",  # Unrelated to power infrastructure
            "qgis-gee-data-catalogs-plugin",  # QGIS desktop plugin
        ]

        for dirname in unrelated:
            dir_path = external_dir / dirname
            if dir_path.exists():
                size_mb = sum(f.stat().st_size for f in dir_path.rglob('*') if f.is_file()) / (1024 * 1024)
                self._record_change("DELETE_DIR", dir_path, extra=f"{size_mb:.1f}MB")

                if not self.dry_run:
                    shutil.rmtree(dir_path)
                    print(f"  ✓ Deleted: {dirname} ({size_mb:.1f}MB)")
                else:
                    print(f"  Would delete: {dirname} ({size_mb:.1f}MB)")
            else:
                print(f"  ⊗ Not found: {dirname}")

    def _clean_generated_test_images(self):
        """Clean up old generated test images (keep generators)."""
        print("\n" + "=" * 60)
        print("CLEANING GENERATED TEST IMAGES")
        print("=" * 60)

        test_image_dirs = [
            "adversarial_test_images",
            "confusion_images",
        ]

        for dirname in test_image_dirs:
            dir_path = self.project_root / dirname
            if not dir_path.exists():
                print(f"  ⊗ Not found: {dirname}")
                continue

            # Count images
            images = list(dir_path.rglob("*.jpg")) + list(dir_path.rglob("*.png"))
            if not images:
                print(f"  ⊗ No images in {dirname}")
                continue

            size_mb = sum(f.stat().st_size for f in images) / (1024 * 1024)
            self._record_change("CLEAN_DIR", dir_path, extra=f"{len(images)} files, {size_mb:.1f}MB")

            if not self.dry_run:
                for img in images:
                    img.unlink()
                print(f"  ✓ Cleaned: {dirname} ({len(images)} images, {size_mb:.1f}MB)")
            else:
                print(f"  Would clean: {dirname} ({len(images)} images, {size_mb:.1f}MB)")

    def _remove_empty_directories(self):
        """Remove empty directories."""
        print("\n" + "=" * 60)
        print("REMOVING EMPTY DIRECTORIES")
        print("=" * 60)

        empty_dirs = []

        # Find empty directories
        for dirpath in self.project_root.rglob("*"):
            if not dirpath.is_dir():
                continue
            if dirpath.name in ["__pycache__", ".git", "venv"]:
                continue

            # Check if truly empty (no files, only empty subdirs)
            if not any(dirpath.iterdir()):
                empty_dirs.append(dirpath)

        if not empty_dirs:
            print("  ✓ No empty directories found")
            return

        for dir_path in empty_dirs:
            rel_path = dir_path.relative_to(self.project_root)
            self._record_change("DELETE_DIR", dir_path)

            if not self.dry_run:
                dir_path.rmdir()
                print(f"  ✓ Removed empty dir: {rel_path}")
            else:
                print(f"  Would remove empty dir: {rel_path}")

    def _find_unused_imports(self):
        """Find potentially unused imports (requires manual review)."""
        print("\n" + "=" * 60)
        print("FINDING UNUSED IMPORTS (for manual review)")
        print("=" * 60)

        try:
            import ast
        except ImportError:
            print("  ⊗ AST module not available")
            return

        python_files = list(self.project_root.rglob("*.py"))
        files_with_unused = []

        for py_file in python_files:
            if "__pycache__" in str(py_file):
                continue

            try:
                with open(py_file) as f:
                    tree = ast.parse(f.read(), filename=str(py_file))

                # Simple heuristic: find imports
                imports = []
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imports.append(alias.name)
                    elif isinstance(node, ast.ImportFrom):
                        for alias in node.names:
                            imports.append(alias.name)

                # Check for common suspects
                unused_suspects = []
                for imp in ["Any", "Optional", "TypeVar", "Callable"]:
                    if imp in imports:
                        # Simple check: is it used in file?
                        content = py_file.read_text()
                        # Don't count the import line itself
                        import_line = f"from typing import.*{imp}"
                        content_without_import = content.replace(import_line, "")
                        if content_without_import.count(imp) <= 1:  # Only in import
                            unused_suspects.append(imp)

                if unused_suspects:
                    files_with_unused.append((py_file, unused_suspects))

            except Exception:
                # Parsing errors are ok, skip file
                pass

        if not files_with_unused:
            print("  ✓ No obvious unused imports found")
        else:
            print(f"  Found {len(files_with_unused)} files with potentially unused imports:")
            print("  (Manual review recommended)")
            for py_file, suspects in files_with_unused[:10]:  # Show first 10
                rel_path = py_file.relative_to(self.project_root)
                print(f"    {rel_path}: {', '.join(suspects)}")

            if len(files_with_unused) > 10:
                print(f"    ... and {len(files_with_unused) - 10} more")

    def _record_change(self, action: str, path: Path, extra: str = ""):
        """Record a change for summary."""
        self.changes.append((action, path, extra))

    def _print_summary(self):
        """Print summary of changes."""
        print("\n" + "=" * 60)
        print("CLEANUP SUMMARY")
        print("=" * 60)

        if not self.changes:
            print("No changes made.")
            return

        # Count by action
        actions = {}
        for action, path, extra in self.changes:
            if action not in actions:
                actions[action] = []
            actions[action].append((path, extra))

        for action, items in actions.items():
            print(f"\n{action}:")
            for path, extra in items:
                rel_path = path.relative_to(self.project_root)
                if extra:
                    print(f"  - {rel_path} ({extra})")
                else:
                    print(f"  - {rel_path}")

        print(f"\nTotal changes: {len(self.changes)}")

        if self.dry_run:
            print("\n⚠ DRY RUN MODE - No files were modified")
            print("Run with --execute to apply changes")
        else:
            print("\n✓ Changes applied successfully")
            if self.backup_dir:
                print(f"✓ Backup saved to: {self.backup_dir}")


def main():
    parser = argparse.ArgumentParser(
        description="BAHB Codebase Cleanup Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Preview changes without modifying files
  python cleanup.py --dry-run

  # Apply changes
  python cleanup.py --execute

  # Apply changes with backup
  python cleanup.py --execute --backup

  # Specify custom project directory
  python cleanup.py --project /path/to/BAHB --execute
        """
    )

    parser.add_argument(
        "--project",
        type=str,
        default=None,
        help="Path to BAHB project root (default: auto-detect)"
    )

    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without modifying files"
    )
    mode_group.add_argument(
        "--execute",
        action="store_true",
        help="Execute cleanup (modifies files)"
    )

    parser.add_argument(
        "--backup",
        action="store_true",
        help="Create backup before executing (only with --execute)"
    )

    args = parser.parse_args()

    # Auto-detect project root
    if args.project:
        project_root = Path(args.project)
    else:
        # Assume script is in simplification/scripts/
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent

    if not project_root.exists():
        print(f"Error: Project root not found: {project_root}")
        sys.exit(1)

    if not (project_root / "bahb").exists():
        print(f"Error: Not a valid BAHB project: {project_root}")
        print("Expected to find 'bahb/' directory")
        sys.exit(1)

    # Validate backup flag
    if args.backup and args.dry_run:
        print("Warning: --backup has no effect with --dry-run")

    # Run cleanup
    cleanup = CodebaseCleanup(
        project_root=project_root,
        dry_run=args.dry_run,
        create_backup=args.backup
    )
    cleanup.run()


if __name__ == "__main__":
    main()
