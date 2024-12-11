import sys
import random
import MDAnalysis as mda
import numpy as np
from Bio.PDB.PDBParser import PDBParser
import numpy , tempfile ,os , re

import matplotlib.pyplot as plt
import numpy as np
import math

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

    def getFullCovariancesFromDeltas(self, deltas):
        covariances = []
        aux = 0
        for i in deltas:
            print(aux)
            aux += 1
            covariances.append(self.divDotPdctByPdctOfPowSqrtRoots(np.array(i), np.transpose(np.array(i))))
        return covariances

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

    def getAverageSlicesFromCovariances(self, covariances, n_frames_per_slice = 3):

                 # round(len(covariances)
        n_slices = math.floor(len(covariances) / n_frames_per_slice)
        aux_rest = len(covariances) % n_frames_per_slice

        mean_sliced_covariances = None
        is_first_pass = True

        for i in range(0, n_slices, 1):
            if i == n_slices - 1:
                if aux_rest > 0:
                    mean_sliced_covariances = np.concatenate([mean_sliced_covariances, [self.getAverageFromSlice(covariances[(i*n_frames_per_slice):])]])
            else:
                if is_first_pass:
                    mean_sliced_covariances = [self.getAverageFromSlice(covariances[(i*n_frames_per_slice):((i*n_frames_per_slice)+n_frames_per_slice)])]
                else:
                    mean_sliced_covariances = np.concatenate([mean_sliced_covariances, [self.getAverageFromSlice(covariances[(i*n_frames_per_slice):((i*n_frames_per_slice)+n_frames_per_slice)])]])
            is_first_pass = False
        return mean_sliced_covariances

    def getAverageFromSlice(self, _slice):
        average = _slice[0]
        for i in _slice[1:]:
            average = np.add(average, i)
        return average/len(_slice)

def main() -> int:
    app = dataTranformer()
    
    coords = app.algs.matrixFromPDB("./data/1AKI.pdb")
    
    app.algs.writeNakedArray(coords, "./data/output.txt")

    deltas = app.algs.getFullDeltaFromMatrix(coords)
    
    covariances = app.algs.getFullCovariancesFromDeltas(deltas)

    mean_sliced_covariances = app.algs.getAverageSlicesFromCovariances(covariances, 10)


    aux = 0
    for i in mean_sliced_covariances:    
        plt.imshow(i, cmap='hot', interpolation='nearest', aspect='auto')
        plt.savefig(f'./data/frames/cov_3c_frame_{aux}.png')
        aux += 1

    return 0

# meuArray = np.array(array_all_trajectory)
# tararan vs a transposta


if __name__ == '__main__':
    sys.exit(main()) 

