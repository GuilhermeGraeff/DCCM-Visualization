#source /opt/apps/gromacs20250/bin/GMXRC

import sys
import random
import numpy as np
import mdtraj as md
import cupy as cp
import math
import matplotlib.pyplot as plt
import os
import struct

class dataTranformer:
    def __init__(self):
        self.algs = Algorithms(self)


class Algorithms:
    
    def __init__(self, parent):
        self.utils = parent

    def processTrajectory(self, path):

        trajectory_path = os.path.join(path, 'traj_CA.xtc')
        gro_path = os.path.join(path, 'protein_CA_only.gro')
        traj, names = self.matrixFromXTCandGRO(trajectory_path, gro_path)  

        slice_sizes = [25, 50, 100, 200, 400, 800, 1600]

        for slice_size in slice_sizes:
        
            sliced_trajectory = self.slicedTrajectory(traj, slice_size)
        
            DCCM_slices = self.calculateDCCMfromSlices(sliced_trajectory)
        
            DTYPE = np.float32
        
            num_fatias = len(DCCM_slices)
            num_atomos = len(DCCM_slices[0])
            
            indices_triu = np.triu_indices(num_atomos)
            
            num_elementos_triangulo = len(indices_triu[0])
            dados_compactados = np.zeros((num_fatias, num_elementos_triangulo), dtype=DTYPE)
            
            for i in range(num_fatias):
                dados_compactados[i] = DCCM_slices[i][indices_triu]
     
            output_filename = os.path.join(path, f'dccm_data_{slice_size}.bin')
            
            with open(output_filename, 'wb') as f:
                tipo_dado_id = 1 
                # Empacota os metadados em formato binário. '<' indica little-endian.
                header = struct.pack('<III', num_fatias, num_atomos, tipo_dado_id)
                f.write(header)
            
                # --- Escrever o Corpo (Payload) ---
                # Escreve o array numpy diretamente para o arquivo.
                f.write(dados_compactados.tobytes())
            
            print(f"Arquivo '{output_filename}' salvo com sucesso!")
            print(f"Dimensões originais por fatia: {num_atomos}x{num_atomos} = {num_atomos*num_atomos} floats")
            print(f"Dimensões compactadas por fatia: {num_elementos_triangulo} floats")
            tamanho_original_total = num_fatias * num_atomos * num_atomos * 4 # 4 bytes por float32
            tamanho_compactado_total = len(header) + num_fatias * num_elementos_triangulo * 4
            print(f"Tamanho original estimado: {tamanho_original_total / 1024:.2f} KB")
            print(f"Tamanho final do arquivo: {tamanho_compactado_total / 1024:.2f} KB")
        return
    
    def matrixFromXTCandGRO(self, ca_path, gro_path):
        # Use mdtraj to get the trajectory xyz coordinates and the c-alpha residue names from .xtc and .gro files 
        # TODO: Make this function work with diferent types of input format
        trajetory = md.load(ca_path, top=gro_path)

        # Align trajectory with the first frame (necessary to eliminate full positive correlations, result form translation and rotation of the complex)
        trajetory.superpose(trajetory, 0)
        
        names = [atom.residue.name for atom in trajetory.topology.atoms]
        
        return trajetory.xyz, names

    def slicedTrajectory(self, traj, slice_size):

        # Treat ramaining frames
        n_slices = math.floor(len(traj) / slice_size)
        aux_rest = len(traj) % slice_size

        # Return trajectory sliced wih slice_size size
        trajectory_sliced = None

        for i in range(0, n_slices, 1):
            if i == n_slices - 1:
                if aux_rest > 0:
                    # Concatenate the remaining slice if it's not even (as it is, it's redundant)
                    trajectory_sliced = np.concatenate([trajectory_sliced, [traj[(i*slice_size):(i*slice_size)+slice_size]]]) 
                else:
                    # Concatenate last slice
                    trajectory_sliced = np.concatenate([trajectory_sliced, [traj[(i*slice_size):((i*slice_size)+slice_size)]]])
            else:
                if i == 0:
                    # Concatenate first slice
                    trajectory_sliced = [traj[(i*slice_size):((i*slice_size)+slice_size)]]
                else:
                    # Concatenant all other slices
                    trajectory_sliced = np.concatenate([trajectory_sliced, [traj[(i*slice_size):((i*slice_size)+slice_size)]]])

        return trajectory_sliced

    def calculateDCCMfromSlices(self, sliced_traj):
        # Calculate Dynamic Cross Correlation Matrix for the first slice
        dccms = [self.calculateDCCM(sliced_traj[0])]
        
        for i in range(1, len(sliced_traj), 1):
            # Clculate DCCM for the remaining slices
            dccms = np.concatenate([dccms, [self.calculateDCCM(sliced_traj[i])]])
        return dccms

    def calculateDCCMxyz(self, traj):
        n_frames, n_atoms, _ = traj.shape
        coords_gpu = cp.asarray(traj, dtype=np.float32)
    
        mean_coords = cp.mean(coords_gpu, axis=0)
        
        fluctuations = coords_gpu - mean_coords

        # 4. Remodelar a matriz de flutuações para o produto de matrizes
        # Achatamos as dimensões de átomos e coordenadas numa única dimensão.
        # A forma passa de (N_frames, N_atoms, 3) para (N_frames, N_atoms * 3)
        fluctuations_reshaped = fluctuations.reshape(n_frames, n_atoms * 3)
        
        # 5. Calcular a matriz de covariância
        # Este é o passo computacionalmente mais intensivo.
        # (N_atoms*3, N_frames) @ (N_frames, N_atoms*3) -> (N_atoms*3, N_atoms*3)
        cov_matrix = cp.dot(fluctuations_reshaped.T, fluctuations_reshaped) / n_frames
    
        # 6. Normalizar a matriz de covariância para obter a matriz DCC
        # Extrair a diagonal (variâncias)
        diag = cp.diag(cov_matrix)
        
        # Adicionar um pequeno epsilon para evitar a divisão por zero no caso de variância nula
        # embora seja raro em simulações reais.
        diag_sqrt = cp.sqrt(diag + 1e-10)

    
        # Calcular a matriz de normalização usando um produto externo
        norm_matrix = cp.outer(diag_sqrt, diag_sqrt)
        
        # Realizar a divisão elemento a elemento
        dcc_matrix_gpu = cov_matrix / norm_matrix
        
        # 7. Transferir a matriz DCC final de volta para a CPU (host)
        dcc_matrix_cpu = cp.asnumpy(dcc_matrix_gpu)
        
        return dcc_matrix_cpu

    
    
    def calculateDCCM(self, traj_slice: np.ndarray) -> np.ndarray:

        n_frames, n_atoms, _ = traj_slice.shape
        
        # Transfer to GPU
        coords_gpu = cp.asarray(traj_slice, dtype=cp.float32)

        # Calculate the mean position for each atom (n_atoms, 3)
        mean_coords = cp.mean(coords_gpu, axis=0) 

        # Calculate the vector for the fluctuations from it's own mean
        # (n_frames, n_atoms, 3) - (n_atoms, 3) -> (n_frames, n_atoms, 3)
        fluctuations = coords_gpu - mean_coords

        # Calculate the covariance matrix for the atoms, using dot product (scalar product)
        # The dot product of the fluctuation vectors
        # Using cp.einsum:
        # 'tij, tkj -> ik':
        # - For each atom (i,k)
        # - Some (Σ) sobre os frames (t) e sobre as coordenadas (j)...
        # - The product of fluctuation[t, i, j] * fluctuation[t, k, j]
        # That is: C_ik = <Δr_i ⋅ Δr_k>
        cov_matrix = cp.einsum('tij,tkj->ik', fluctuations, fluctuations) / n_frames
        
        # Normalize covariance to get the DCCM (dividing by the variances)
        # The diagonal has the variance for the atom
        diag = cp.diag(cov_matrix)

        # Add a realy small number, to get rid of 0 division and get the square root
        diag_sqrt = cp.sqrt(diag + 1e-10)
        
        # Normalization matrix for each element
        norm_matrix = cp.outer(diag_sqrt, diag_sqrt)
        
        # Normalize covariances
        dccm_matrix_gpu = cov_matrix / norm_matrix

        # Go back to cpu
        dccm_matrix_cpu = cp.asnumpy(dccm_matrix_gpu)

        return dccm_matrix_cpu

    def plotAndSaveDCCM(self, dccm_matrix, output_path, slice_index):
        # Save image for 
        fig, ax = plt.subplots(figsize=(10, 8))
        cax = ax.imshow(dccm_matrix, cmap='seismic', vmin=-1, vmax=1)
        ax.set_title(f'Dynamic Cross-Correlation Map (DCCM) - Slice {slice_index}')
        ax.set_xlabel('Índice do Resíduo')
        ax.set_ylabel('Índice do Resíduo')
        fig.colorbar(cax, label='Correlação')
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        plt.close(fig)

    def writeNakedArrayCovariances(self, covariances, file_path):
        # Archaic Method to save the matrix as a .js 
        with open(file_path, "w") as txt_file:
            txt_file.write("[")
            for frame in range(0, len(covariances), 1):
                txt_file.write("[")
                for line in range(0, len(covariances[frame]), 1):    
                    txt_file.write("[")
                    for column in range(0, len(covariances[frame][line]), 1): 
                        txt_file.write(f"{f'{covariances[frame][line][column]}' if column == (len(covariances[frame][line]) - 1 ) else f'{covariances[frame][line][column]},'}")
                    txt_file.write(f"{']' if line == (len(covariances[frame]) - 1 ) else '],'}")
                txt_file.write(f"{']' if frame == (len(covariances) - 1 ) else '],'}")
            txt_file.write("]")
        
def main() -> int:
    app = dataTranformer()

    trajectory_data_path = '../dados'
    
    main_folders = None
    try:
        main_folders = [d for d in os.listdir(trajectory_data_path) if os.path.isdir(os.path.join(trajectory_data_path, d)) and not d.startswith('.')]
    except FileNotFoundError:
        print(f"Error: The directory '{base_dir}' was not found.")
        exit()

    for folder in sorted(main_folders):
        folder_path = os.path.join(trajectory_data_path, folder)
        if (folder == 'wt_lig'):
            print('Entrou no', folder)
            replicas = [r for r in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, r)) and r.startswith('Rep_')]
            
            for replica in sorted(replicas):
                if replica == 'Rep_1':
                    print('Entrou na replica', replica)
                    replica_path = os.path.join(folder_path, replica)
                    app.algs.processTrajectory(replica_path)
                
    return 0

if __name__ == '__main__':
    sys.exit(main()) 

