import sys
import random
import MDAnalysis as mda
from Bio.PDB.PDBParser import PDBParser
import tempfile ,os , re
from MDAnalysis.analysis import rms

import matplotlib.pyplot as plt
import numpy as np
import math
import json
from progress.bar import Bar

# from MDAnalysis.analysis import dccm
import seaborn as sns

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
    
    def dosomething(self, a):

        return a


def main() -> int:
    app = dataTranformer()
    try:
        universe = mda.Universe('./data/mc1r/WT/WT_1/protein_CA_only.pdb', './data/mc1r/WT/WT_1/protein_CA_centralized.xtc')
    except Exception as e:
        print(f"Error loading files: {e}")
        print("Please ensure your topology and trajectory file paths are correct.")

        from MDAnalysis.tests.datafiles import PSF, DCD
        universe = mda.Universe(PSF, DCD)



    alpha_carbons = universe.select_atoms('name CA')


    from MDAnalysis.analysis import align

    average_positions = alpha_carbons.positions.mean(axis=0)
    print(alpha_carbons.positions)
    # return 0

    displacements = np.zeros((universe.trajectory.n_frames, len(alpha_carbons), 3))
    for i, ts in enumerate(universe.trajectory):
        displacements[i] = alpha_carbons.positions - average_positions


    num_atoms = len(alpha_carbons)
    cross_correlation_matrix = np.zeros((num_atoms, num_atoms))

    for i in range(num_atoms):
        for j in range(num_atoms):

            dot_product = np.sum(displacements[:, i] * displacements[:, j], axis=1).mean()


            magnitude_i = np.sqrt(np.sum(displacements[:, i]**2, axis=1)).mean()
            magnitude_j = np.sqrt(np.sum(displacements[:, j]**2, axis=1)).mean()

            if magnitude_i > 0 and magnitude_j > 0:
                cross_correlation_matrix[i, j] = dot_product / (magnitude_i * magnitude_j)

    plt.figure(figsize=(10, 8))
    plt.imshow(cross_correlation_matrix, cmap='seismic', vmin=-1, vmax=1)
    plt.colorbar(label='Correlation Coefficient')
    plt.title('Dynamic Cross-Correlation Map (Alpha Carbons)')
    plt.xlabel('Residue Index')
    plt.ylabel('Residue Index')
    plt.grid(False)
    plt.show()

    return 0




if __name__ == '__main__':
    sys.exit(main()) 

