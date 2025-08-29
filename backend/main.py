from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()

@app.get("/env")
def read_env():
    api_key = os.getenv("API_KEY", "undefined")
    return {"api_key": api_key}

if __name__ == "__main__":
    print(f"API_KEY={os.getenv('API_KEY')}")
