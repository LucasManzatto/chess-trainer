.PHONY: venv install run dev start clean

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
UVICORN := $(VENV)/bin/uvicorn

venv:
	python3 -m venv $(VENV)

install: venv
	$(PIP) install -r requirements.txt

run: install
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --app-dir src

dev: install
	$(UVICORN) app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir src

start: run

clean:
	rm -rf $(VENV) __pycache__ src/__pycache__ .ruff_cache
