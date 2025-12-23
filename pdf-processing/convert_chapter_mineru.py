#!/usr/bin/env python3
"""
MinerU 2.6 CLI Conversion Script

Converts PDF chapters using MinerU CLI to produce structured output:
- {filename}.md — Rendered markdown
- {filename}_content_list.json — Ordered content blocks (PRIMARY)
- {filename}_middle.json — Detailed intermediate format
- {filename}_model.json — Raw model inference
- /images/ — Extracted images

Usage:
    python convert_chapter_mineru.py 1         # Convert Chapter 1
    python convert_chapter_mineru.py all       # Convert all chapters
"""

import os
import subprocess
import glob
import re
import shutil
import json
from pathlib import Path

# Configuration
INPUT_DIR = "pdf-processing/chapters"
OUTPUT_DIR = "public/data/mineru"  # New directory for MinerU CLI output

def check_mineru_installed():
    """Check if MinerU CLI is available."""
    try:
        result = subprocess.run(
            ["mineru", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        print(f"MinerU CLI version: {result.stdout.strip() or result.stderr.strip()}")
        return True
    except FileNotFoundError:
        print("ERROR: MinerU CLI not found. Install with: pip install magic-pdf")
        return False
    except Exception as e:
        print(f"ERROR checking MinerU: {e}")
        return False


def convert_chapter(chapter_num: int) -> bool:
    """
    Convert a single chapter PDF using MinerU CLI.
    
    Args:
        chapter_num: Chapter number (1-15)
        
    Returns:
        True if successful
    """
    # Find the PDF - use regex to match exact chapter number
    all_pdfs = glob.glob(os.path.join(INPUT_DIR, "Ch*.pdf"))
    pdf_path = None
    
    for pdf in all_pdfs:
        basename = os.path.basename(pdf)
        # Match ChN_ or ChN. or ChN- (followed by non-digit)
        match = re.match(r'^Ch(\d+)[_.\-]', basename)
        if match and int(match.group(1)) == chapter_num:
            pdf_path = pdf
            break
    
    if not pdf_path:
        print(f"ERROR: No PDF found for Chapter {chapter_num} in {INPUT_DIR}")
        return False
    pdf_name = Path(pdf_path).stem
    
    # Create output directory
    chapter_output_dir = os.path.join(OUTPUT_DIR, f"Ch{chapter_num}")
    os.makedirs(chapter_output_dir, exist_ok=True)
    
    print(f"\n{'='*60}")
    print(f"Converting Chapter {chapter_num}: {pdf_name}")
    print(f"Output: {chapter_output_dir}")
    print(f"{'='*60}")
    
    try:
        # Run MinerU CLI
        cmd = [
            "mineru",
            "-p", pdf_path,
            "-o", chapter_output_dir
        ]
        
        print(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=900  # 15 minute timeout per chapter
        )
        
        if result.returncode != 0:
            print(f"MinerU CLI error:\n{result.stderr}")
            return False
        
        # Verify expected outputs exist
        expected_files = [
            f"{pdf_name}_content_list.json",
            f"{pdf_name}.md"
        ]
        
        for filename in expected_files:
            filepath = os.path.join(chapter_output_dir, filename)
            if os.path.exists(filepath):
                size = os.path.getsize(filepath)
                print(f"  ✓ {filename} ({size:,} bytes)")
            else:
                print(f"  ✗ {filename} (missing)")
        
        # Check for images directory
        images_dir = os.path.join(chapter_output_dir, "images")
        if os.path.exists(images_dir):
            img_count = len(os.listdir(images_dir))
            print(f"  ✓ images/ ({img_count} files)")
        
        # Rename content_list.json to standard name for easier loading
        source_cl = os.path.join(chapter_output_dir, f"{pdf_name}_content_list.json")
        target_cl = os.path.join(chapter_output_dir, "content_list.json")
        if os.path.exists(source_cl) and source_cl != target_cl:
            shutil.copy(source_cl, target_cl)
            print(f"  ✓ Copied to content_list.json")
        
        print(f"\n✓ Chapter {chapter_num} conversion complete!")
        return True
        
    except subprocess.TimeoutExpired:
        print(f"ERROR: Timeout processing Chapter {chapter_num}")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False


def convert_all_chapters():
    """Convert all chapter PDFs."""
    
    if not check_mineru_installed():
        return
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Find all chapter PDFs
    pdf_files = glob.glob(os.path.join(INPUT_DIR, "Ch*.pdf"))
    if not pdf_files:
        print(f"No PDFs found in {INPUT_DIR}")
        return
    
    # Extract chapter numbers
    chapters = []
    for pdf in pdf_files:
        match = re.search(r'Ch(\d+)', os.path.basename(pdf))
        if match:
            chapters.append(int(match.group(1)))
    
    chapters.sort()
    print(f"Found {len(chapters)} chapters to convert: {chapters}")
    
    successful = 0
    failed = 0
    
    for ch_num in chapters:
        if convert_chapter(ch_num):
            successful += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"CONVERSION SUMMARY")
    print(f"{'='*60}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print(__doc__)
        print("\nAvailable chapters:")
        for pdf in sorted(glob.glob(os.path.join(INPUT_DIR, "Ch*.pdf"))):
            print(f"  - {os.path.basename(pdf)}")
        sys.exit(1)
    
    arg = sys.argv[1].lower()
    
    if arg == "all":
        convert_all_chapters()
    else:
        try:
            ch_num = int(arg)
            if check_mineru_installed():
                convert_chapter(ch_num)
        except ValueError:
            print(f"Invalid argument: {arg}")
            print("Usage: python convert_chapter_mineru.py <chapter_number|all>")
            sys.exit(1)
