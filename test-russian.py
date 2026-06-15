#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import base64
import os
from requests.auth import HTTPBasicAuth

email = os.environ.get("ATLASSIAN_EMAIL", "")
token = os.environ.get("ATLASSIAN_TOKEN", "")

if not email or not token:
    raise RuntimeError("Set ATLASSIAN_EMAIL and ATLASSIAN_TOKEN before running this script.")

page_id = "589365250"
base_url = "https://shiptify.atlassian.net/wiki/rest/api/content"

# Headers with explicit UTF-8
headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Accept": "application/json"
}

auth = HTTPBasicAuth(email, token)

try:
    # Get current page
    print("Getting current page...")
    get_url = f"{base_url}/{page_id}?expand=body.storage,version"
    response = requests.get(get_url, headers=headers, auth=auth)
    
    if response.status_code != 200:
        print(f"Error getting page: {response.status_code}")
        print(response.text)
        exit(1)
    
    data = response.json()
    print(f"Current title: {data['title']}")
    print(f"Current version: {data['version']['number']}")
    
    new_version = data['version']['number'] + 1
    new_title = "Проверка Python - Русский текст"
    
    # Russian content
    new_content = """<h1>Тестирование Python - Русский язык</h1>
<p>Это содержимое на русском языке, отправленное через Python.</p>
<h2>Проверка кодировки UTF-8</h2>
<p>Если этот текст отображается корректно на русском языке, то Python правильно обрабатывает UTF-8!</p>
<ul>
  <li>Пункт первый: тестирование русского текста</li>
  <li>Пункт второй: проверка кодировки</li>
  <li>Пункт третий: сохранение контента</li>
  <li>Буквы: А Б В Г Д Е Ё Ж З И Й К Л М Н О П Р С Т У Ф Х Ц Ч Ш Щ Ъ Ы Ь Э Ю Я</li>
</ul>"""
    
    # Build update payload
    update_payload = {
        "version": {
            "number": new_version
        },
        "title": new_title,
        "type": "page",
        "body": {
            "storage": {
                "value": new_content,
                "representation": "storage"
            }
        }
    }
    
    # Update page
    print(f"New title: {new_title}")
    print(f"New version: {new_version}")
    print("Updating page with Russian content...")
    
    put_url = f"{base_url}/{page_id}"
    put_response = requests.put(
        put_url,
        json=update_payload,
        headers=headers,
        auth=auth
    )
    
    if put_response.status_code == 200:
        print("✅ Update successful!")
        
        # Verify immediately
        print("\nVerifying content...")
        check_response = requests.get(get_url, headers=headers, auth=auth)
        if check_response.status_code == 200:
            check_data = check_response.json()
            print(f"Saved title: {check_data['title']}")
            print(f"Content preview (first 300 chars):")
            print(check_data['body']['storage']['value'][:300])
    else:
        print(f"Error updating: {put_response.status_code}")
        print(put_response.text)
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
