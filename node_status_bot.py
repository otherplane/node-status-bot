#!/usr/bin/env python3
import argparse
import contextlib
import datetime
import json
import os
import requests
import select
import socket
import subprocess
import sys
import time
import _thread as thread
import threading
from time import sleep

TOKEN = os.environ.get("TOKEN")
CHANNEL_ID = os.environ.get("CHANNEL_ID")
POLLING_INTERVAL = int(os.environ.get("POLLING_INTERVAL", "60000")) # 1min
TIMEOUT = int(os.environ.get("TIMEOUT", "5000")) # 5secs

def get_node_list():
    idx = 0
    node_list = []
    while True:
        try:
            node_list.append(get_node_from_env(idx))
        except:
            # Done parsing node list
            return node_list
        idx += 1

def get_node_from_env(idx):
    name = os.environ[f"NODE_{idx}_NAME"]
    host = os.environ[f"NODE_{idx}_HOST"]
    port = int(os.environ.get(f"NODE_{idx}_PORT", "21338"))

    return {"name": name, "host": host, "port": port}

# https://stackoverflow.com/a/64233946
def recv_timeout(sock, timeout_seconds):
    sock.setblocking(0)
    ready = select.select([sock], [], [], timeout_seconds)
    if ready[0]:
        return sock.makefile("rb").readline()

    raise socket.timeout()

def check_node(node):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(TIMEOUT / 1000)
    try:
        s.connect((node["host"], node["port"]))
    except Exception as error:
        print("Failed to connect to node:", error)
        return False
    print("Sending syncStatus to node", node["name"])
    data_bytes = send_sync_status_request(s)

    node_synced = False

    try:
        print(data_bytes)
        data = json.loads(data_bytes)
        res = data["result"]
        node_state = res["node_state"]
        if node_state == "Synced":
            node_synced = True
        else:
            # Bad
            pass
    except (KeyError, json.JSONDecodeError) as e:
        # Bad
        pass

    return node_synced

def send_sync_status_request(s):
    req = { "jsonrpc": "2.0", "id": "1", "method": "syncStatus", "params": None }
    req = json.dumps(req)
    req = req.encode("utf-8")
    req += b'\n'

    s.sendall(req)

    data_bytes = recv_timeout(s, TIMEOUT / 1000)
    return data_bytes

def send_message(text):
    print("Sending message", text)
    # Disable sending message for testing:
    #return

    token = TOKEN
    chat_id = CHANNEL_ID

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    params = {
       "chat_id": chat_id,
       "text": text,
    }
    resp = requests.get(url, params=params)

    # Throw an exception if Telegram API fails
    resp.raise_for_status()

def create_message(node, message):
	icon = "✅" if node["synced"] else "❌"
	name = node["name"]
	host = node["host"]
	return f"{icon} {name}({host}) {message}"

def main(args):
    if TOKEN is None:
        print("Mandatory environment variable TOKEN is missing")
        return
    if CHANNEL_ID is None:
        print("Mandatory environment variable CHANNEL_ID is missing")
        return

    print("Getting node list")
    nodes = get_node_list()

    while True:
        for node in nodes:
            print(f"Checking node {node['name']}")
            try:
                synced = check_node(node)
            except KeyboardInterrupt as error:
                synced = False

            old_synced = node.get("synced")
            
            if old_synced == synced:
                print("Same as before:", "synced" if synced else "not synced")
            else:
                node["synced"] = synced
                if synced:
                    send_message(create_message(node, f"Synced"))
                else:
                    send_message(create_message(node, f"Not synced :("))
        time.sleep(POLLING_INTERVAL / 1000)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Send a notification to a telegram group when one of the specified nodes is down')
    args = parser.parse_args()
    main(args)

