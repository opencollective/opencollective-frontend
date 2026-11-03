#!/usr/bin/env python3
"""Remove launcher credentials and application JWTs from retained E2E evidence."""
import json
import pathlib
import re
import sys
import zipfile
import zlib

artifacts = pathlib.Path(sys.argv[1])
owner_file = pathlib.Path(sys.argv[2])
private_artifacts = pathlib.Path(sys.argv[3])
token = json.loads(owner_file.read_text())["token"].encode() if owner_file.exists() else None
jwt = re.compile(rb"eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+")
failures = []


def redact(data):
    if token:
        data = data.replace(token, b"[redacted-fixture-token]")
    return jwt.sub(b"[redacted-auth-token]", data)


for file in list(artifacts.rglob("*")):
    if not file.is_file():
        continue
    if file.suffix == ".zip":
        temporary = file.with_suffix(".redacted.zip")
        try:
            with zipfile.ZipFile(file) as original, zipfile.ZipFile(temporary, "w") as output:
                for entry in original.infolist():
                    output.writestr(entry, redact(original.read(entry)))
            temporary.replace(file)
        except (zipfile.BadZipFile, EOFError, OSError, zlib.error):
            temporary.unlink(missing_ok=True)
            # Cancellation may leave an unreadable archive. Retain its original
            # bytes privately, but never upload evidence that could not be scrubbed.
            retained = private_artifacts / file.relative_to(artifacts)
            retained.parent.mkdir(parents=True, mode=0o700, exist_ok=True)
            file.chmod(0o600)
            file.replace(retained)
            failures.append(str(file.relative_to(artifacts)))
    elif file.suffix in {".log", ".json", ".xml", ".md", ".html"}:
        data = file.read_bytes()
        cleaned = redact(data)
        if cleaned != data:
            file.write_bytes(cleaned)

if failures:
    (artifacts / "redaction-status.json").write_text(json.dumps({
        "status": "incomplete", "quarantined": failures,
        "privateArtifacts": str(private_artifacts),
    }, indent=2))
    print("WARNING: unreadable archives retained privately; see redaction-status.json.", file=sys.stderr)
    sys.exit(1)
