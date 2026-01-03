import json
import re
import argparse
import os
import glob
from typing import List, Dict, Set, Tuple
import bisect

def load_json(filepath: str) -> List[Dict]:
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data: List[Dict], filepath: str):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def get_longest_non_decreasing_subsequence(nums: List[int]) -> List[int]:
    if not nums: return []
    n = len(nums)
    dp = [1] * n
    pre = [-1] * n
    
    for i in range(n):
        for j in range(i):
            if nums[j] <= nums[i]:
                if dp[j] + 1 > dp[i]:
                    dp[i] = dp[j] + 1
                    pre[i] = j
    length = max(dp)
    idx = dp.index(length)
    seq_indices = []
    while idx != -1:
        seq_indices.append(idx)
        idx = pre[idx]
    return seq_indices[::-1]

def filter_outliers_lis(found_nums: List[Tuple[int, int]]) -> Dict[int, Set[int]]:
    found_nums.sort(key=lambda x: (x[0], x[1]))
    pages = [x[1] for x in found_nums]
    lis_indices = get_longest_non_decreasing_subsequence(pages)
    valid_indices_set = set(lis_indices)
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
    cleaned_map = filter_outliers_lis(found_nums)
    return cleaned_map

def get_valid_pages(num: int, footer_map: Dict[int, Set[int]]) -> Set[int]:
    if num in footer_map:
        pages = footer_map[num]
        valid = set()
        for p in pages:
            valid.add(p)
            valid.add(p-1)
            valid.add(p+1)
        return valid

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
    return set(range(lower_page - 1, upper_page + 2))

def cleanup_text_single_block(text: str, page_idx: int, footer_map: Dict[int, Set[int]], verbose=False) -> str:
    def reverter(match):
        num = int(match.group(1))
        valid_pages = get_valid_pages(num, footer_map)
        if page_idx in valid_pages:
            return match.group(0) 
        else:
            if verbose:
                print(f"Reverting Invalid Footnote: $^{{{num}}}$ on Page {page_idx}.")
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
        if num == 0 or num > 300: return full
        valid_pages = get_valid_pages(num, footer_map)
        if page_idx in valid_pages:
            return f'{prefix}$^{{{num_str}}}$'
        else:
            return full
    return replacer

def process_file(json_path):
    print(f"Processing {json_path}...")
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        footer_map = build_footer_map(data)
        
        cleaned_data = []
        cleanup_count = 0
        for item in data:
            if item.get('type') == 'text':
                page_idx = item.get('page_idx')
                orig_text = item.get('text', '')
                if orig_text:
                    cleaned_item_text = cleanup_text_single_block(orig_text, page_idx, footer_map)
                    if cleaned_item_text != orig_text:
                        cleanup_count += 1
                    item['text'] = cleaned_item_text
            cleaned_data.append(item)
        
        fixed_data = []
        changes_count = 0
        for item in cleaned_data:
            if item.get('type') == 'text':
                page_idx = item.get('page_idx')
                orig_text = item.get('text', '')
                if orig_text:
                    res = orig_text
                    res = re.sub(r'\[(\d+)\]', make_replacer(page_idx, footer_map, is_bracket=True), res)
                    res = re.sub(r'<sup>(\d+)</sup>', make_replacer(page_idx, footer_map, is_sup=True), res)
                    res = re.sub(r'([a-z\.\,\"\”])(\d+)(?=\s|$)', make_replacer(page_idx, footer_map), res)
                    res = re.sub(r'([a-z])(\d+)(?=\s|$)', make_replacer(page_idx, footer_map), res)
                    
                    if res != orig_text:
                        changes_count += 1
                    item['text'] = res
            fixed_data.append(item)

        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(fixed_data, f, indent=4, ensure_ascii=False)
            
        print(f"Cleanup revisions: {cleanup_count}")
        print(f"Total blocks modified: {changes_count}")
        print(f"Done: {json_path}")
        return True
    except Exception as e:
        print(f"Error processing {json_path}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", help="Single JSON file to fix")
    parser.add_argument("--root", help="Root directory to scan for content_list.json")
    args = parser.parse_args()

    if args.file:
        process_file(args.file)
    elif args.root:
        pattern = os.path.join(args.root, "**", "*_content_list.json")
        files = glob.glob(pattern, recursive=True)
        print(f"Found {len(files)} files in {args.root}")
        for f in files:
            process_file(f)
    else:
        print("Please specify --file or --root")

if __name__ == "__main__":
    main()
