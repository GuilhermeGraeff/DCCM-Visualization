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
    

    universe = mda.Universe('./data/mc1r/WT/WT_1/protein_CA_only.pdb', './data/mc1r/WT/WT_1/protein_CA_centralized.xtc')

    calpha_atoms = universe.select_atoms('name CA')

  
    R = rms.RMSD(calpha_atoms,  
                calpha_atoms, 
                select='name CA', 
                ref_frame=0)     


    R.run()

    rmsd_data = R.results.rmsd

    tempos = rmsd_data[:, 1]
    valores_rmsd = rmsd_data[:, 2]

    plt.figure(figsize=(10, 6))
    plt.plot(tempos, valores_rmsd, label='RMSD C-alpha')
    plt.title('RMSD da Trajetória')
    plt.xlabel('Tempo (ps)')
    plt.ylabel('RMSD (Å)')                                                                              
    plt.legend()
    plt.grid(True)
    plt.show()

    return 0




if __name__ == '__main__':
    sys.exit(main()) 
