from fastapi import FastAPI
from transformData import dataTranformer

app = FastAPI()

@app.get("/")
def home():
    return "Minha api está no ar"


@app.get("/get1AKI")
def get1AKI():
    dataTransformer = dataTranformer()
    resultMatrix = dataTransformer.algs.matrixFromPDB('./data/1AKI.pdb')
    return resultMatrix