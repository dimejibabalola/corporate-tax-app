import os
import json
import time
import requests
import glob
from dotenv import load_dotenv

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

def get_next_chapter():
    # pdf-processing/chapters/Ch*.pdf
    all_pdfs = glob.glob("pdf-processing/chapters/Ch*.pdf")
    all_pdfs.sort()
    
    # Filter processed
    for pdf in all_pdfs:
        filename = os.path.basename(pdf)
        if filename.startswith("Ch1_") or "_part_" in filename: continue
        
        name_no_ext = os.path.splitext(filename)[0]
        out_dir = os.path.join("parsed-chapters", name_no_ext)
        if os.path.exists(out_dir):
            if os.path.exists(os.path.join(out_dir, "full.md")):
                continue # Skip done
                
        return pdf
    return None

def process_file(filepath):
    fname = os.path.basename(filepath)
    print(f"Processing {fname}...")
    
    # Step A: Get Upload URL
    url = f"{BASE_URL}/file-urls/batch"
    payload = {
        "files": [{"name": fname}],
        "model_version": "vlm"
    }
    
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=30)
        if r.status_code != 200:
            print(f"Error getting URL: {r.text}")
            return False
            
        data = r.json()
        if data["code"] != 0:
            print(f"API Error: {data['msg']}")
            return False
            
        batch_id = data["data"]["batch_id"]
        upload_url = data["data"]["file_urls"][0]
        
        # Step B: Upload
        print(f"Uploading to {upload_url[:50]}...")
        with open(filepath, "rb") as f:
            # 10 min timeout
            up = requests.put(upload_url, data=f, timeout=600)
            if up.status_code != 200:
                print(f"Upload failed: {up.status_code}")
                return False
        
        print("Upload success.")
        
        # Step C: Poll
        time.sleep(5)
        poll_url = f"{BASE_URL}/extract-results/batch/{batch_id}"
        
        start_time = time.time()
        while time.time() - start_time < 3600: # 1 hour max
            pr = requests.get(poll_url, headers=HEADERS, timeout=30)
            if pr.status_code != 200:
                print("Poll error")
                time.sleep(10)
                continue
                
            pdata = pr.json().get("data", {})
            results = pdata.get("extract_result", [])
            
            if not results:
                time.sleep(5)
                continue
                
            item = results[0]
            state = item.get("state")
            
            if state == "done":
                 # Download
                 full_zip = item.get("full_zip_url")
                 print("Extraction done. Downloading...")
                 download_zip(full_zip, fname)
                 return True
                 
            if state == "failed":
                 print(f"Failed: {item.get('err_msg')}")
                 return False
                 
            print(f"State: {state} ({int(time.time()-start_time)}s)")
            time.sleep(10)
            
    except Exception as e:
        print(f"Exception: {e}")
        return False

def download_zip(url, fname):
    out_dir = "parsed-chapters"
    name_no_ext = os.path.splitext(fname)[0]
    target_dir = os.path.join(out_dir, name_no_ext)
    os.makedirs(target_dir, exist_ok=True)
    
    r = requests.get(url, stream=True, timeout=120)
    zip_path = os.path.join(out_dir, name_no_ext + ".zip")
    with open(zip_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
            
    import zipfile
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(target_dir)
    os.remove(zip_path)
    print(f"Saved to {target_dir}")

if __name__ == "__main__":
    next_file = get_next_chapter()
    if not next_file:
        print("All chapters processed.")
    else:
        success = process_file(next_file)
        if success:
            print(f"COMPLETED {next_file}")
