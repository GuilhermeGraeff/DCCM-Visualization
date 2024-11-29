from fastapi import FastAPI
import MDAnalysis as mda
from transformData import dataTranformer

app = FastAPI()

@app.get("/")
def home():
    return "Minha api está no ar"


@app.get("/get1AKI")
def pegar_algo():
    dataTransformer = dataTranformer()
    u = mda.Universe('/data/1AKI.pdb')
    result = dataTransformer.misc.templateFunction(1,10)
    return result