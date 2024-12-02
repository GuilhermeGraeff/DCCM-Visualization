from fastapi import FastAPI

# from transformData import dataTranformer

app = FastAPI()

@app.get("/")
def home():
    return "Minha api está no ar"


@app.get("/get1AKI")
def pegar_algo():
    # dataTransformer = dataTranformer()
    
    # result = dataTransformer.misc.templateFunction(1,10)
    return 'xesquedele'