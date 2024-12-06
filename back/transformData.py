import sys
import random
import MDAnalysis as mda
import numpy as np
from Bio.PDB.PDBParser import PDBParser
import numpy , tempfile ,os , re

import matplotlib.pyplot as plt
import numpy as np

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
        models = self.PDB_parse(pdb_file_handle)
        print(np.array(models).shape)

        structure = self.parser.get_structure("1aki", pdb_file_handle)

        for model in structure:
            array_all_structure = []
            for chain in model:
                for residue in chain:
                    for atom in residue:
                        array_all_structure.append(atom.coord)
            array_all_trajectory.append(array_all_structure)

        print(np.array(array_all_structure).shape)
        return array_all_trajectory
    
    def writeNakedArray(self, coords, file_path):
        with open(file_path, "w") as txt_file:
            txt_file.write("[")
            for line in range(0, len(coords), 1):
                txt_file.write("[")
                for single_cord in range(0, len(coords[line]), 1):
                    txt_file.write(f"{coords[line][single_cord]}{'' if single_cord == (len(coords[line]) - 1) else ','}")
                if line != (len(coords) - 1):
                    txt_file.write("]\n")
                else:
                    txt_file.write("],")
            txt_file.write("]\n")


    def getFullDeltaFromMatrix(self, trajectory):
        deltaMatrixTrajectory = []
        #len() usage adjustment and delta adjustment, -1 -1
        for i in range(0,len(trajectory)-1-1,1):
            deltaFrame = self.getDeltaFromOneToOneFrame(trajectory[i], trajectory[i+1])
            deltaMatrixTrajectory.append(deltaFrame)

        return deltaMatrixTrajectory
    
    def getDeltaFromOneToOneFrame(self, reference_frame, next_frame):
        deltaMatrix = np.subtract(next_frame, reference_frame)
        return deltaMatrix

    def divDotPdctByPdctOfPowSqrtRoots(self, a, b):
        result = np.zeros((a.shape[0], b.shape[1]))
        for i in range(a.shape[0]):
            for j in range(b.shape[1]):
                result[i][j] = self.operateBewteenTwoVectors(a[i], np.array([b[0][j], b[1][j], b[2][j]]))
        return result


    def operateBewteenTwoVectors(self, a, b):
        # print(a, b)
        dot_product = np.dot(a, b)
        sqrt_a = np.sqrt(np.power(a, 2))
        sqrt_b = np.sqrt(np.power(b, 2))
        numerator = dot_product
        denominator = sum(sqrt_a) * sum(sqrt_b)
        result = numerator / denominator
        return result


# meuArray = np.array(array_all_trajectory)
# tararan vs a transposta

def main() -> int:
    app = dataTranformer()

    coords = app.algs.matrixFromPDB("./data/1AKI.pdb")

    app.algs.writeNakedArray(coords, "./data/output.txt")

    deltas = app.algs.getFullDeltaFromMatrix(coords)
    
    covariance_of_one_frame = app.algs.divDotPdctByPdctOfPowSqrtRoots(np.array(deltas[0]), np.transpose(np.array(deltas[0])))

    print(covariance_of_one_frame)

    # This step have to been taken after the matrix subtraction (delta in betweeen coordinates)
    # covariance_of_one_frame = app.algs.divDotPdctByPdctOfPowSqrtRoots(np.array(coords[0]), np.transpose(np.array(coords[0])))
    print("One frame cross correlation")
    # for i in covariance_of_one_frame:
    #     print("\n")
    #     for j in i:
    #         print(j, end=" ")

    plt.imshow(covariance_of_one_frame, cmap='hot', interpolation='nearest')
    plt.show()
    return 0


if __name__ == '__main__':
    sys.exit(main()) 

