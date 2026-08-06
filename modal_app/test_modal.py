import os
import modal

os.environ["MODAL_TOKEN_ID"] = "ak-5AVCt3d63mJ1MVxJi7sUow"
os.environ["MODAL_TOKEN_SECRET"] = "as-x1ezA5BXQm3Z4xCLo2vQUg"

app = modal.App("test-kimi")

@app.function()
def hello():
    return "Hello from Kimi 3 on Modal Cloud!"

if __name__ == "__main__":
    with app.run():
        print(hello.remote())
