import requests
import json

url = 'http://localhost:8000/api/auth/login'
data = {
    'email': 'planner@demandflow.ai',
    'password': 'plannerpassword'
}

try:
    response = requests.post(url, json=data)
    result = response.json()
    
    if response.status_code == 200:
        print('✅ JWT Login Success!')
        print(f'Token Type: {result["token_type"]}')
        print(f'Token (first 50 chars): {result["access_token"][:50]}...')
        print(f'User Email: {result["user"]["email"]}')
        print(f'User Role: {result["user"]["role"]}')
        print()
        
        # Test the /api/auth/me endpoint with the token
        print('Testing /api/auth/me endpoint...')
        headers = {'Authorization': f'Bearer {result["access_token"]}'}
        me_response = requests.get('http://localhost:8000/api/auth/me', headers=headers)
        me_data = me_response.json()
        
        if me_response.status_code == 200:
            print('✅ Token Verification Success!')
            print(f'User from /me: {me_data["email"]} ({me_data["role"]})')
        else:
            print(f'❌ Token Verification Failed: {me_response.status_code}')
    else:
        print(f'❌ Login Failed: {response.status_code}')
        print(result)
        
except Exception as e:
    print(f'❌ Error: {e}')
