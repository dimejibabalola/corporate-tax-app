import os
from pypdf import PdfReader, PdfWriter

# Configuration
INPUT_PDF = "Fundamentals of Corporate Taxation.pdf"
OUTPUT_DIR = "chapters"

# Chapter Ranges (Start Page, End Page, Filename Label)
# Note: Page numbers are 1-based (as seen in PDF viewer).
# Logic: Book Page + 70 = PDF Page.
# Ranges are INCLUSIVE (Start, End).
CHAPTERS = [
    (73, 124, "Ch1_Intro_to_Corp_Tax"),
    (125, 184, "Ch2_Formation_of_Corp"),
    (185, 222, "Ch3_Capital_Structure"),
    (223, 270, "Ch4_Nonliquidating_Distributions"),
    (271, 366, "Ch5_Redemptions_and_Partial_Liq"),
    (367, 394, "Ch6_Stock_Dividends_and_Sec_306"),
    (395, 426, "Ch7_Complete_Liquidations"),
    (427, 458, "Ch8_Taxable_Corp_Acquisitions"),
    (459, 522, "Ch9_Acquisitive_Reorgs"),
    (523, 592, "Ch10_Corp_Divisions"),
    (593, 628, "Ch11_Nonacquisitive_Reorgs"),
    (629, 664, "Ch12_Carryovers_of_Attributes"),
    (665, 688, "Ch13_Affiliated_Corps"),
    (689, 736, "Ch14_Anti_Avoidance_Rules"),
    (737, 828, "Ch15_S_Corporations"),
]

def split_pdf():
    if not os.path.exists(INPUT_PDF):
        print(f"Error: {INPUT_PDF} not found.")
        return

    # Create output directory
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    reader = PdfReader(INPUT_PDF)
    total_pages = len(reader.pages)
    print(f"Total Pages in PDF: {total_pages}")

    for start_page, end_page, label in CHAPTERS:
        output = PdfWriter()
        
        # Convert 1-based to 0-based
        # Start: includes start_page (start_page - 1)
        # End: INCLUSIVE in our list, so we slice up to end_page (which excludes end_page index, but pypdf slice matches python slice)
        # Wait, Python slice [0:1] gets index 0.
        # If we want Page 1 to Page 1 (inclusive), we want index 0. Slicing [0:1]. 
        # So end_idx should be end_page.
        
        start_idx = start_page - 1
        end_idx = end_page # e.g. end_page 124 means we want up to index 123. Slice [72:124] includes 123.
        
        print(f"Processing {label}: Pages {start_page} to {end_page}...")

        # Robust slicing
        chapter_pages = reader.pages[start_idx:end_idx]
        
        for page in chapter_pages:
            output.add_page(page)

        output_filename = os.path.join(OUTPUT_DIR, f"{label}.pdf")
        with open(output_filename, "wb") as f:
            output.write(f)
        
        print(f"Saved: {output_filename}")

if __name__ == "__main__":
    split_pdf()
