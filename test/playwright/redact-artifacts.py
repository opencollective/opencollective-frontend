#!/usr/bin/env python3
"""Remove launcher credentials and application JWTs from retained E2E evidence."""
import json
import pathlib
import re
import sys
import zipfile

artifacts = pathlib.Path(sys.argv[1])
owner_file = pathlib.Path(sys.argv[2])
token = json.loads(owner_file.read_text())["token"].encode() if owner_file.exists() else None
jwt = re.compile(rb"eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+")


def redact(data):
    if token:
        data = data.replace(token, b"[redacted-fixture-token]")
    return jwt.sub(b"[redacted-auth-token]", data)


for file in artifacts.rglob("*"):
    if not file.is_file():
        continue
    if file.suffix == ".zip":
        temporary = file.with_suffix(".redacted.zip")
        with zipfile.ZipFile(file) as original, zipfile.ZipFile(temporary, "w") as output:
            for entry in original.infolist():
                output.writestr(entry, redact(original.read(entry)))
        temporary.replace(file)
    elif file.suffix in {".log", ".json", ".xml", ".md", ".html"}:
        data = file.read_bytes()
        cleaned = redact(data)
        if cleaned != data:
            file.write_bytes(cleaned)
