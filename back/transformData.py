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

        for i in range(0, n_slices, n_frames_per_slice):
            if i == n_slices:
                if aux_rest > 0:
                    np.concatenate([mean_sliced_covariances, covariances[i:]])
            else:
                if mean_sliced_covariances == None:
                    np.concatenate([mean_sliced_covariances, covariances[i:i+n_frames_per_slice]])
                else:
                    mean_sliced_covariances = [covariances[i:i+n_frames_per_slice]]

        return mean_sliced_covariances

def main() -> int:
    app = dataTranformer()
    
    # coords = app.algs.matrixFromPDB("./data/1AKI.pdb")
    
    # app.algs.writeNakedArray(coords, "./data/output.txt")

    # deltas = app.algs.getFullDeltaFromMatrix(coords)
    
    # covariances = app.algs.getFullCovariancesFromDeltas(deltas)

    # aux = 1

    a = np.array([[ [1,  2,  3],     [4,  5,  6],     [7,  8,  9], 
                    [10, 11, 12],    [13, 14, 15],    [16, 17, 18]],
                   [[19, 20, 21],    [22, 23, 24],    [25, 26, 27], 
                    [28, 29, 30],    [31, 32, 33],    [34, 35, 36]],
                   [[37, 38, 39],    [40, 41, 42],    [43, 44, 45], 
                    [46, 47, 48],    [49, 50, 51],    [52, 53, 54]],
                   [[55, 56, 57],    [58, 59, 60],    [61, 62, 63], 
                    [64, 65, 66],    [67, 68, 69],    [70, 71, 72]],
                   [[73, 74, 75],    [76, 77, 78],    [79, 80, 81], 
                    [82, 83, 84],    [85, 86, 87],    [88, 89, 90]],
                   [[91, 92, 93],    [94, 95, 96],    [97, 98, 99], 
                    [100, 101, 102], [103, 104, 105], [106, 107, 108]],
                   [[109, 110, 111], [112, 113, 114], [115, 116, 117], 
                    [118, 119, 120], [121, 122, 123], [124, 125, 126]],
                   [[127, 128, 129], [130, 131, 132], [133, 134, 135], 
                    [136, 137, 138], [139, 140, 141], [142, 143, 144]],
                   [[145, 146, 147], [148, 149, 150], [151, 152, 153], 
                    [154, 155, 156], [157, 158, 159], [160, 161, 162]],
                   [[163, 164, 165], [166, 167, 168], [169, 170, 171], 
                    [172, 173, 174], [175, 176, 177], [178, 179, 180]],
                   [[181, 182, 183], [184, 185, 186], [187, 188, 189], 
                    [190, 191, 192], [193, 194, 195], [196, 197, 198]],
                   [[199, 200, 201], [202, 203, 204], [205, 206, 207], 
                    [208, 209, 210], [211, 212, 213], [214, 215, 216]],
                   [[217, 218, 219], [220, 221, 222], [223, 224, 225], 
                    [226, 227, 228], [229, 230, 231], [232, 233, 234]],
                   [[235, 236, 237], [238, 239, 240], [241, 242, 243], 
                    [244, 245, 246], [247, 248, 249], [250, 251, 252]],              
                  ])

    for i in a:
       print(i)

    mean_sliced_covariances = app.algs.getAverageSlicesFromCovariances(a, 3)

    for i in mean_sliced_covariances:
        print(i)



    # for i in covariances:    
    #     plt.imshow(i, cmap='hot', interpolation='nearest', aspect='auto')
    #     plt.savefig(f'./data/frames/cov_3c_frame_{aux}.png')
    #     aux += 1

    return 0

# meuArray = np.array(array_all_trajectory)
# tararan vs a transposta


if __name__ == '__main__':
    sys.exit(main()) 

