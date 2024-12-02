import sys
import random
import MDAnalysis as mda
import numpy as np
from Bio.PDB.PDBParser import PDBParser
import numpy , tempfile ,os , re

class dataTranformer:
    def __init__(self):
        # print('Program starting up.')
        self.misc = Mycelium(self)
        self.algs = Algorithms(self)
        # print('Program is running.')


class Mycelium:

    def __init__(self, parent):
        self.utils = parent

    def matrixFromPDB(self, param_one, param_two):
        do_stuff_here = param_one + param_two
        return do_stuff_here


class Algorithms:

    def __init__(self, parent):
        self.utils = parent
        self.models_re = re.compile("MODEL")
        self.pdb_re = re.compile(r"MODEL(.*?)ENDMDL", re.DOTALL)
        self.parser = PDBParser()
    
    def PDB_parse(self, pdb_file_handle):
        model_pos = []
        models = []
        k = open(pdb_file_handle,"r").read()
        for i in self.models_re.finditer(k):
            model_pos.append(i.start())
        for i in model_pos:
            models.append(self.pdb_re.search(k,i).group())
        return models

    def matrixFromPDB(self, pdb_file_handle):
        array_all_trajectory = []
        a = 1
        for i in self.PDB_parse(pdb_file_handle):
            print(a)
            if a > 10:
                break
            array_all_structure = []
            structure = self.parser.get_structure("1aki", pdb_file_handle)
            for model in structure:
                for chain in model:
                    for residue in chain:
                        for atom in residue:
                            array_all_structure.append(atom.coord)
            array_all_trajectory.append(array_all_structure)
            a += 1
        return array_all_trajectory
    
    def writeNakedArray(self, coords):
        with open("./data/output.txt", "w") as txt_file:
            txt_file.write("[")
            for line in range(0, len(coords), 1):
                txt_file.write("[")
                for single_cord in range(0, len(coords[line]), 1):
                    txt_file.write(''.join(coords[line][single_cord].tostring()).join(f'{"" if single_cord == (len(coords[line]) - 1) else ","}'))
                if line != (len(coords) - 1):
                    txt_file.write("]")
                else:
                    txt_file.write("],")
            txt_file.write("]")

# meuArray = np.array(array_all_trajectory)
# tararan vs a transposta

def main() -> int:
    app = dataTranformer()
    coords = app.algs.matrixFromPDB("./data/1AKI.pdb")
    app.algs.writeNakedArray(coords)
    return 0


if __name__ == '__main__':
    sys.exit(main()) 

