import os
import json
import time
import requests
import glob
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()

API_KEY = os.getenv("MINERU_API_KEY")
if not API_KEY:
    print("Error: MINERU_API_KEY not found in .env")
    exit(1)

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

BASE_URL = "https://mineru.net/api/v4"

def get_chapter_files():
    all_pdfs = glob.glob("pdf-processing/chapters/Ch*.pdf")
    targets = []
    
    for pdf in all_pdfs:
        filename = os.path.basename(pdf)
        if filename.startswith("Ch1_") or "_part_" in filename: continue 
        targets.append(pdf)
    
    targets.sort()
    return targets

def create_batch(files):
    url = f"{BASE_URL}/file-urls/batch"
    
    file_objs = []
    for f in files:
        fname = os.path.basename(f)
        file_objs.append({
            "name": fname,
            "data_id": fname,
            "enable_table": True,
            "enable_formula": True 
        })
        
    payload = {
        "files": file_objs,
        "model_version": "vlm"
    }
    
    print(f"Creating batch for {len(files)} files...")
    resp = requests.post(url, headers=HEADERS, json=payload, timeout=30)
    if resp.status_code != 200:
        print(f"Error creating batch: {resp.status_code} - {resp.text}")
        exit(1)
        
    data = resp.json()
    if data.get("code") != 0:
         print(f"API Error: {data.get('msg')}")
         exit(1)
         
    return data["data"]

def upload_single(args):
    filepath, upload_url, idx, total = args
    fname = os.path.basename(filepath)
    print(f"[{idx}/{total}] Uploading {fname}...")
    
    try:
        with open(filepath, "rb") as f:
            resp = requests.put(upload_url, data=f, timeout=600)
            if resp.status_code != 200:
                 print(f"Failed to upload {fname}: {resp.status_code}")
                 return False
            print(f"[{idx}/{total}] Uploaded {fname}")
            return True
    except Exception as e:
        print(f"Exception uploading {fname}: {e}")
        return False

def upload_files_parallel(files, file_urls):
    if len(files) != len(file_urls):
        print("Mismatch in files and upload URLs count.")
        return
    
    tasks = []
    for i, filepath in enumerate(files):
        tasks.append((filepath, file_urls[i], i+1, len(files)))
        
    print(f"Starting parallel upload of {len(files)} files (5 threads)...")
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(upload_single, t): t for t in tasks}
        for future in as_completed(futures):
            pass # We print inside upload_single

def download_and_extract(item):
    out_dir = "parsed-chapters"
    os.makedirs(out_dir, exist_ok=True)
    
    fname = item.get("file_name", "unknown")
    full_zip = item.get("full_zip_url")
    
    if not full_zip: return False
    
    dir_name = os.path.splitext(fname)[0]
    target_dir = os.path.join(out_dir, dir_name)
    
    if os.path.exists(target_dir):
         # Skip if exists? Or assume overwrite.
         # For robustness let's just log and continue
         # print(f"Target dir {target_dir} exists.")
         pass
         
    print(f"Downloading result for {fname}...")
    try:
        r = requests.get(full_zip, stream=True, timeout=120)
        zip_path = os.path.join(out_dir, dir_name + ".zip")
        with open(zip_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                
        import zipfile
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(target_dir)
        
        os.remove(zip_path)
        print(f"SUCCESS: Extracted to {target_dir}")
        return True
    except Exception as e:
        print(f"Failed to download {fname}: {e}")
        return False

def poll_and_download(batch_id):
    url = f"{BASE_URL}/extract-results/batch/{batch_id}"
    print(f"Polling batch {batch_id}...")
    
    processed_ids = set()
    
    while True:
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
        except Exception as e:
            print(f"Poll connect error: {e}")
            time.sleep(15)
            continue

        if resp.status_code != 200:
            print(f"Error polling: {resp.status_code}")
            time.sleep(15)
            continue
            
        json_resp = resp.json()
        if json_resp.get("code") != 0:
             print(f"Poll API Error: {json_resp.get('msg')}")
             time.sleep(15)
             continue
             
        data = json_resp.get("data", {})
        results = data.get("extract_result", [])
        
        if not results:
            time.sleep(10)
            continue
            
        done_count = 0
        failed_count = 0
        
        for item in results:
            fname = item.get("file_name")
            status = item.get("state")
            
            if status == "done":
                done_count += 1
                if fname not in processed_ids:
                    if download_and_extract(item):
                        processed_ids.add(fname)
            elif status == "failed":
                failed_count += 1
                if fname not in processed_ids:
                    print(f"FAILED: {fname} - {item.get('err_msg')}")
                    processed_ids.add(fname)
        
        total = len(results)
        print(f"Progress: {done_count}/{total} Done. ({failed_count} Failed)")
        
        if len(processed_ids) == total:
            print("All files processed.")
            break
            
        time.sleep(30)

def main():
    files = get_chapter_files()
    if not files:
        print("No files found.")
        return
        
    print(f"Selected {len(files)} files for processing.")
        
    batch_data = create_batch(files)
    batch_id = batch_data["batch_id"]
    file_urls = batch_data["file_urls"]
    
    print(f"Batch ID: {batch_id}")
    
    upload_files_parallel(files, file_urls)
    
    print("Uploads complete. Starting polling loop...")
    poll_and_download(batch_id)

if __name__ == "__main__":
    main()
