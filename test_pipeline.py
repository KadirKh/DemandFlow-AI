import urllib.request
import urllib.parse
import json
import uuid

# Helper to build multipart form payload manually (standard python, no external dependencies)
def encode_multipart_formdata(fields, files):
    boundary = b'----WebKitFormBoundary7MA4YWxkTrZu0gW'
    lines = []
    for name, value in fields.items():
        lines.append(b'--' + boundary)
        lines.append(f'Content-Disposition: form-data; name="{name}"'.encode('utf-8'))
        lines.append(b'')
        lines.append(str(value).encode('utf-8'))
    for name, filename, file_content in files:
        lines.append(b'--' + boundary)
        lines.append(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"'.encode('utf-8'))
        lines.append(b'Content-Type: text/csv')
        lines.append(b'')
        lines.append(file_content if isinstance(file_content, bytes) else file_content.encode('utf-8'))
    lines.append(b'--' + boundary + b'--')
    lines.append(b'')
    body = b'\r\n'.join(lines)
    content_type = f'multipart/form-data; boundary={boundary.decode("utf-8")}'
    return content_type, body

def send_request(url, method='GET', data=None, headers=None, is_json=True):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        if isinstance(data, bytes):
            req_data = data
        elif isinstance(data, dict):
            req_data = json.dumps(data).encode('utf-8')
            headers['Content-Type'] = 'application/json'
        else:
            req_data = str(data).encode('utf-8')
            
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_content = response.read()
            if is_json:
                return response.status, json.loads(res_content.decode('utf-8'))
            return response.status, res_content.decode('utf-8')
    except urllib.error.HTTPError as e:
        err_content = e.read().decode('utf-8')
        try:
            err_json = json.loads(err_content)
            return e.code, err_json
        except Exception:
            return e.code, err_content

def test_journey():
    base_url = "http://127.0.0.1:8000"
    
    # 1. Register a new user
    test_email = f"user_{uuid.uuid4().hex[:6]}@demandflow.ai"
    test_password = "password123"
    print(f"[*] Registering new test user: {test_email}...")
    
    status, res = send_request(
        f"{base_url}/api/auth/register",
        method="POST",
        data={
            "email": test_email,
            "password": test_password,
            "role": "manufacturer"
        }
    )
    
    if status != 201:
        print(f"[-] Registration failed with status {status}: {res}")
        return False
        
    token = res["access_token"]
    user_id = res["user"]["id"]
    print(f"[+] Registration successful! User ID: {user_id}")
    
    auth_headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Check initial data status (should be false)
    print("[*] Checking data status for new user...")
    status, res = send_request(
        f"{base_url}/api/auth/check-data-status",
        headers=auth_headers
    )
    
    if status != 200:
        print(f"[-] Check status failed: {status}")
        return False
        
    print(f"[+] Data status check response: {res}")
    if res.get("has_data") is not False:
        print("[-] Error: New user should not have data initially")
        return False
        
    # 3. Upload Market Data
    print("[*] Uploading Market Data CSV...")
    market_csv = """product_id,factory_production_metrics,local_retail_sales,pending_shopkeeper_orders
SKU-999,100,50,20
SKU-888,20,5,2
SKU-777,15,40,10"""
    
    ct, body = encode_multipart_formdata({}, [("file", "market_data.csv", market_csv)])
    headers = {**auth_headers, "Content-Type": ct}
    
    status, res = send_request(
        f"{base_url}/api/upload/market-data",
        method="POST",
        data=body,
        headers=headers
    )
    
    if status != 200:
        print(f"[-] Upload market data failed: {status} - {res}")
        return False
        
    print(f"[+] Market data uploaded successfully: {res}")
    
    # 4. Upload Inventory Data
    print("[*] Uploading Inventory Data CSV...")
    # Include spatial anomaly for SKU-777 (Warehouse A has 2 units, Warehouse B has 40 units)
    inventory_csv = """product_id,warehouse_location,current_inventory_counts
SKU-999,Warehouse Alpha,10
SKU-888,Warehouse Alpha,150
SKU-777,Warehouse Alpha,2
SKU-777,Warehouse Beta,40"""
    
    ct, body = encode_multipart_formdata({}, [("file", "inventory_data.csv", inventory_csv)])
    headers = {**auth_headers, "Content-Type": ct}
    
    status, res = send_request(
        f"{base_url}/api/upload/inventory-data",
        method="POST",
        data=body,
        headers=headers
    )
    
    if status != 200:
        print(f"[-] Upload inventory data failed: {status} - {res}")
        return False
        
    print(f"[+] Inventory data uploaded successfully: {res}")
    
    # 5. Re-check data status (should be true now)
    print("[*] Re-checking data status...")
    status, res = send_request(
        f"{base_url}/api/auth/check-data-status",
        headers=auth_headers
    )
    if res.get("has_data") is not True:
        print("[-] Error: User data status should be true now")
        return False
    print(f"[+] Check status: {res}")
    
    # 6. Process Predictions
    print("[*] Triggering AI rule engine predictions...")
    status, res = send_request(
        f"{base_url}/api/upload/process",
        method="POST",
        headers=auth_headers
    )
    if status != 200:
        print(f"[-] Process uploaded data failed: {status} - {res}")
        return False
    print(f"[+] Predictor processed successfully: {res}")
    
    # 7. Fetch Recommendations
    print("[*] Retrieving generated recommendations...")
    status, res = send_request(
        f"{base_url}/api/recommendations",
        headers=auth_headers
    )
    if status != 200:
        print(f"[-] Fetch recommendations failed: {status} - {res}")
        return False
        
    recs = res
    print(f"[+] Total active recommendations found: {len(recs)}")
    
    # Validate recommendations rules are applied correctly
    # SKU-999: Demand=70, Inv=10 -> Production Deficit, status pending
    # SKU-888: Demand=7, Inv=150 -> Balanced Stock, status pending
    # SKU-777: Demand=50, Inv=42 -> Production Deficit (status pending)
    # SKU-777: Spatial anomaly (min 2, max 40) -> Regional Mismatch (status pending_review)
    
    has_deficit = False
    has_balanced = False
    has_mismatch = False
    
    for r in recs:
        print(f"    - Type: {r['type']}, SKU: {r['entity_id']}, Status: {r['action_status']}, Score: {r['score']}")
        if r['type'] == 'production_deficit' and r['entity_id'] == 'SKU-999':
            has_deficit = True
            if r['action_status'] != 'pending':
                print(f"[-] Invalid status for production deficit recommendation: {r['action_status']}")
                return False
        if r['type'] == 'balanced_stock' and r['entity_id'] == 'SKU-888':
            has_balanced = True
            if r['action_status'] != 'pending':
                print(f"[-] Invalid status for balanced stock recommendation: {r['action_status']}")
                return False
        if r['type'] == 'regional_mismatch' and r['entity_id'] == 'SKU-777':
            has_mismatch = True
            if r['action_status'] != 'pending_review':
                print(f"[-] Invalid status for regional mismatch recommendation: {r['action_status']}")
                return False
                
    if not (has_deficit and has_balanced and has_mismatch):
        print(f"[-] Missing key recommendations! Deficit: {has_deficit}, Balanced: {has_balanced}, Mismatch: {has_mismatch}")
        return False
        
    print("[+] All recommendations correctly match the mathematical rules engine rules!")
    
    # 8. Approve one recommendation
    rec_to_approve = next(r for r in recs if r['type'] == 'production_deficit' and r['entity_id'] == 'SKU-999')
    print(f"[*] Approving recommendation ID {rec_to_approve['id']}...")
    
    status, res = send_request(
        f"{base_url}/api/recommendations/{rec_to_approve['id']}/action",
        method="POST",
        data={"action": "approved"},
        headers=auth_headers
    )
    if status != 200:
        print(f"[-] Approving recommendation failed: {status} - {res}")
        return False
    print(f"[+] Approved recommendation successfully: {res}")
    
    # 9. Verify state of approved recommendation in db
    status, res = send_request(
        f"{base_url}/api/recommendations",
        headers=auth_headers
    )
    updated_rec = next(r for r in res if r['id'] == rec_to_approve['id'])
    print(f"[+] Updated recommendation status in DB: {updated_rec['action_status']}")
    if updated_rec['action_status'] != 'approved':
        print(f"[-] Recommendation status did not update to 'approved'!")
        return False
        
    print("\n[SUCCESS] INTEGRATION TESTING COMPLETED SUCCESSFULLY!")
    return True

if __name__ == "__main__":
    success = test_journey()
    if not success:
        exit(1)
    exit(0)
