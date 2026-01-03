import json
import re
import argparse
from typing import List, Dict, Set, Tuple
import bisect

def load_json(filepath: str) -> List[Dict]:
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data: List[Dict], filepath: str):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def get_longest_non_decreasing_subsequence(nums: List[int]) -> List[int]:
    """
    Returns the indices of the longest non-decreasing subsequence.
    """
    if not nums: return []
    
    # Standard O(N log N) patience sorting approach gives length.
    # To get indices, we need tracking.
    # Since N is small (< 1000), O(N^2) DP is fine and easier to reconstruct.
    
    n = len(nums)
    dp = [1] * n
    pre = [-1] * n
    
    for i in range(n):
        for j in range(i):
            if nums[j] <= nums[i]:
                if dp[j] + 1 > dp[i]:
                    dp[i] = dp[j] + 1
                    pre[i] = j
                    
    # Reconstruct
    length = max(dp)
    idx = dp.index(length)
    
    # If multiple max lengths? We typically want the one that spans nicely.
    # But for this problem, maximizing length is sufficient to kill outliers.
    
    seq_indices = []
    while idx != -1:
        seq_indices.append(idx)
        idx = pre[idx]
        
    return seq_indices[::-1]

def filter_outliers_lis(found_nums: List[Tuple[int, int]]) -> Dict[int, Set[int]]:
    """
    found_nums: list of (footnote_num, page_idx).
    Uses LIS on page_indices to filter out jumps.
    """
    # 1. Deduplicate/Conflict resolution?
    # If same Footnote N has multiple pages?
    # found_nums can have duplicates.
    # We should treat each (N, P) as a candidate point.
    # Sort primarily by N, secondarily by P.
    found_nums.sort(key=lambda x: (x[0], x[1]))
    
    pages = [x[1] for x in found_nums]
    
    # 2. Get LIS indices
    lis_indices = get_longest_non_decreasing_subsequence(pages)
    valid_indices_set = set(lis_indices)
    
    # 3. Build map
    cleaned_map = {}
    for i in range(len(found_nums)):
        if i in valid_indices_set:
            n, p = found_nums[i]
            if n not in cleaned_map: cleaned_map[n] = set()
            cleaned_map[n].add(p)
            
    return cleaned_map

def build_footer_map(data: List[Dict], verbose=False) -> Dict[int, Set[int]]:
    found_nums = []
    
    for item in data:
        if item.get('type') == 'page_footnote':
            page_idx = item.get('page_idx')
            text = item.get('text', '').strip()
            
            match = re.match(r'^\[?(\d+)\]?\.?\s', text)
            if match:
                num = int(match.group(1))
                if num > 300: continue 
                found_nums.append((num, page_idx))

    if verbose:
         print(f"Raw footer markers found: {len(found_nums)}")
         # Debug print raw
         # for fn, pg in found_nums: print(f"Raw: {fn} -> {pg}")
         
    cleaned_map = filter_outliers_lis(found_nums)
    
    if verbose:
         print(f"Cleaned footer map size: {len(cleaned_map)}")
         
    return cleaned_map

def get_valid_pages(num: int, footer_map: Dict[int, Set[int]]) -> Set[int]:
    # 1. Exact match
    if num in footer_map:
        pages = footer_map[num]
        valid = set()
        for p in pages:
            valid.add(p)
            valid.add(p-1)
            valid.add(p+1)
        return valid

    # 2. Interpolate
    lower_page = 0
    curr = num - 1
    while curr > 0:
        if curr in footer_map:
            lower_page = min(footer_map[curr])
            break
        curr -= 1
        
    upper_page = 9999
    curr = num + 1
    while curr < 300: 
        if curr in footer_map:
            upper_page = max(footer_map[curr])
            break
        curr += 1
        
    if upper_page == 9999: upper_page = lower_page + 10 
    
    # Valid range
    return set(range(lower_page - 1, upper_page + 2))

def cleanup_text(text: str, page_idx: int, footer_map: Dict[int, Set[int]], verbose=False) -> str:
    def reverter(match):
        num = int(match.group(1))
        valid_pages = get_valid_pages(num, footer_map)
        
        if page_idx in valid_pages:
            return match.group(0) 
        else:
            if verbose:
                print(f"Reverting Invalid Footnote: $^{{{num}}}$ on Page {page_idx}. Valid pages: {valid_pages}")
            return str(num) 

    text = re.sub(r'\$\^\{(\d+)\}\$', reverter, text)
    return text

def make_replacer(page_idx, footer_map, is_bracket=False, is_sup=False):
    def replacer(match):
        if is_bracket or is_sup:
            prefix = ''
            num_str = match.group(1)
            full = match.group(0)
        else:
            prefix = match.group(1)
            num_str = match.group(2)
            full = match.group(0)
            
        num = int(num_str)
        if num == 0 or num > 200: return full
        
        valid_pages = get_valid_pages(num, footer_map)
        if page_idx in valid_pages:
            return f'{prefix}$^{{{num_str}}}$'
        else:
            # DEBUG removed for clean run, or add back if verbose?
            # if verbose: print(...)
            return full
    return replacer

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input_file', help='Path to content_list.json')
    parser.add_argument('--pages', type=str, default='all')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    data = load_json(args.input_file)
    
    footer_map = build_footer_map(data, args.verbose)
        
    start_page, end_page = 0, 99999
    if args.pages != 'all':
        if '-' in args.pages:
            s, e = args.pages.split('-')
            start_page, end_page = int(s), int(e)
        else:
            start_page = end_page = int(args.pages)

    changes_count = 0
    cleanup_count = 0
    
    for item in data:
        if item.get('type') == 'text':
            page_idx = item.get('page_idx')
            if not (start_page <= page_idx <= end_page):
                continue
                
            orig = item.get('text', '')
            if not orig: continue
            
            cleaned = cleanup_text(orig, page_idx, footer_map, args.verbose)
            if cleaned != orig:
                cleanup_count += 1
            
            res = cleaned
            res = re.sub(r'\[(\d+)\]', make_replacer(page_idx, footer_map, is_bracket=True), res)
            res = re.sub(r'<sup>(\d+)</sup>', make_replacer(page_idx, footer_map, is_sup=True), res)
            res = re.sub(r'([a-z\.\,\"\”])(\d+)(?=\s|$)', make_replacer(page_idx, footer_map), res)
            res = re.sub(r'([a-z])(\d+)(?=\s|$)', make_replacer(page_idx, footer_map), res)

            if res != orig:
                changes_count += 1
                if args.verbose:
                     # Limit output logic
                     try:
                        print(f"Page {page_idx} Mod: {orig[:40]}... -> ...{res[-40:]}")
                     except: 
                        pass

            if not args.dry_run:
                item['text'] = res

    print(f"Cleanup revisions: {cleanup_count}")
    print(f"Total blocks modified (Fixed + Cleaned): {changes_count}")
    
    if not args.dry_run:
        save_json(data, args.input_file)
        print("Saved.")

if __name__ == '__main__':
    main()
