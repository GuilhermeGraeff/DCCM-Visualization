'''
Algoritmo responsável pelo pré-processamento dos dados de dinâmica molecular
''' 

import sys
import random
import numpy as np
import mdtraj as md
import math
import matplotlib.pyplot as plt
import os
import struct

# Classe principal responsável pelo gerenciamento das outras classes 
class dataTranformer:
    def __init__(self):
        self.algs = Algorithms(self)


# Classe que contém os algoritmos desenvolvidos
class Algorithms:
    
    def __init__(self, parent):
        self.utils = parent

    # Principal função iterada nos dados
    def processTrajectory(self, path):
        
        # Reconhece a trajetória e nomes dos resíduos utilizando a biblioteca MDtraj
        trajectory_path = os.path.join(path, 'traj_CA.xtc')
        gro_path = os.path.join(path, 'protein_CA_only.gro')
        traj, names = self.matrixFromXTCandGRO(trajectory_path, gro_path)  

        # Padroniza o tamanho das strings contendo os nomes dos resíduos (4 bytes)
        encoded_names = b''.join([name.encode('utf-8').ljust(4, b'\0') for name in names])

        # Define diferentes tamanhos de janelas para calcular a correlação segmentada
        slice_sizes = [25, 50, 100, 200, 400, 800, 1600]

        for slice_size in slice_sizes:
        
            # 'Fatia' a trajetória de acordo com o tamanho da janela, 
            # recebe uma trajetória (coordenadas que mudam com o tempo) e devolve o número de fatias necessárias para contemplar o tamanho da janela
            sliced_trajectory = self.slicedTrajectory(traj, slice_size)

            # Cálcula o método para cada uma das janelas
            DCCM_slices = self.calculateDCCMfromSlices(sliced_trajectory)
        
            DTYPE = np.float32
        
            num_fatias = len(DCCM_slices)
            num_atomos = len(DCCM_slices[0])
            
            # Compacta os dados para que não seja necessária o armazenamento de dados redundantes
            indices_triu = np.triu_indices(num_atomos)
            num_elementos_triangulo = len(indices_triu[0])
            dados_compactados = np.zeros((num_fatias, num_elementos_triangulo), dtype=DTYPE)
            for i in range(num_fatias):
                dados_compactados[i] = DCCM_slices[i][indices_triu]

            output_filename = os.path.join(path, f'dccm_data_{slice_size}.bin')
            with open(output_filename, 'wb') as f:
                tipo_dado_id = 1 
                # Empacota os metadados em formato binário. (Header)
                header = struct.pack('<III', num_fatias, num_atomos, tipo_dado_id)
                f.write(header)
            
                # Escrever o Corpo (Payload) - Primeiramente os nomes dos resíduos
                f.write(encoded_names)
                # Segundamente escreve o array numpy diretamente para o arquivo.
                f.write(dados_compactados.tobytes())
            

            # Prints que demonstram a evolução das trajetórias sendo analisadas
            print(f"Arquivo '{output_filename}' salvo com sucesso!")
            print(f"Dimensões originais por fatia: {num_atomos}x{num_atomos} = {num_atomos*num_atomos} floats")
            print(f"Dimensões compactadas por fatia: {num_elementos_triangulo} floats")
            tamanho_original_total = num_fatias * num_atomos * num_atomos * 4 # 4 bytes por float32
            tamanho_compactado_total = len(header) + num_fatias * num_elementos_triangulo * 4
            print(f"Tamanho original estimado: {tamanho_original_total / 1024:.2f} KB")
            print(f"Tamanho final do arquivo: {tamanho_compactado_total / 1024:.2f} KB")
        return
    
    def matrixFromXTCandGRO(self, ca_path, gro_path):
        # Utiliza o mdtraj para extrair trajetória em formato de coordenadas e também os nomes dos resíduos que cada C-alpha pertence
        # TODO: Fazer funcionar para diferentes entradas
        trajetory = md.load(ca_path, top=gro_path)

        # Alinha a trajetória com o frame 0, buscando eliminar a correlação totalmente positiva que a translação e rotação da molécular pode gerar
        trajetory.superpose(trajetory, 0)
        
        # Coleta os nomes dos reíduos
        names = [atom.residue.name for atom in trajetory.topology.atoms]
        
        # Retorna as coordenadas que se alteram com o tempo e os nomes dos resíduos
        return trajetory.xyz, names

    def slicedTrajectory(self, traj, slice_size):

        # Tratar fatias remanescentes
        n_slices = math.floor(len(traj) / slice_size)
        aux_rest = len(traj) % slice_size

        # Trajetória segmentada
        trajectory_sliced = None

        for i in range(0, n_slices, 1):

            if i == n_slices - 1:
                # TODO Tratamento mais ideal para as fatias remanescentes
                if aux_rest > 0:
                    # Trata a última fatia
                    trajectory_sliced = np.concatenate([trajectory_sliced, [traj[(i*slice_size):(i*slice_size)+slice_size]]]) 
                else:
                    # Concatena última fatia
                    trajectory_sliced = np.concatenate([trajectory_sliced, [traj[(i*slice_size):((i*slice_size)+slice_size)]]])
            else:
                if i == 0:
                    # Concatena a primeira fatia
                    trajectory_sliced = [traj[(i*slice_size):((i*slice_size)+slice_size)]]
                else:
                    # Concatena todas as outras fatias
                    trajectory_sliced = np.concatenate([trajectory_sliced, [traj[(i*slice_size):((i*slice_size)+slice_size)]]])

        return trajectory_sliced

    def calculateDCCMfromSlices(self, sliced_traj):
        # Cálcula o método para a primeira fatia
        dccms = [self.calculateDCCM(sliced_traj[0])]
        
        # Cálcular o método para as fatias restantes
        for i in range(1, len(sliced_traj), 1):
            dccms = np.concatenate([dccms, [self.calculateDCCM(sliced_traj[i])]])
        return dccms

    def calculateDCCMxyz(self, traj):
        n_frames, n_atoms, _ = traj.shape
        coords = np.asarray(traj, dtype=np.float32)
    
        mean_coords = np.mean(coords, axis=0)
        
        fluctuations = coords - mean_coords

        # 4. Remodelar a matriz de flutuações para o produto de matrizes
        # Achatamos as dimensões de átomos e coordenadas numa única dimensão.
        # A forma passa de (N_frames, N_atoms, 3) para (N_frames, N_atoms * 3)
        fluctuations_reshaped = fluctuations.reshape(n_frames, n_atoms * 3)
        
        # 5. Calcular a matriz de covariância
        # Este é o passo computacionalmente mais intensivo.
        # (N_atoms*3, N_frames) @ (N_frames, N_atoms*3) -> (N_atoms*3, N_atoms*3)
        cov_matrix = np.dot(fluctuations_reshaped.T, fluctuations_reshaped) / n_frames
    
        # 6. Normalizar a matriz de covariância para obter a matriz DCC
        # Extrair a diagonal (variâncias)
        diag = np.diag(cov_matrix)
        
        # Adicionar um pequeno epsilon para evitar a divisão por zero no caso de variância nula
        # embora seja raro em simulações reais.
        diag_sqrt = np.sqrt(diag + 1e-10)

    
        # Calcular a matriz de normalização usando um produto externo
        norm_matrix = np.outer(diag_sqrt, diag_sqrt)
        
        # Realizar a divisão elemento a elemento
        dcc_matrix_cpu = cov_matrix / norm_matrix
    
        
        return dcc_matrix_cpu

    
    
    def calculateDCCM(self, traj_slice: np.ndarray) -> np.ndarray:

        n_frames, n_atoms, _ = traj_slice.shape
        
        # Assure datatype
        coords = np.asarray(traj_slice, dtype=np.float32)

        # Calculate the mean position for each atom (n_atoms, 3)
        mean_coords = np.mean(coords, axis=0) 

        # Calculate the vector for the fluctuations from it's own mean
        # (n_frames, n_atoms, 3) - (n_atoms, 3) -> (n_frames, n_atoms, 3)
        fluctuations = coords - mean_coords

        # Calculate the covariance matrix for the atoms, using dot product (scalar product)
        # The dot product of the fluctuation vectors
        # Using cp.einsum:
        # 'tij, tkj -> ik':
        # - For each atom (i,k)
        # - Some (Σ) sobre os frames (t) e sobre as coordenadas (j)...
        # - The product of fluctuation[t, i, j] * fluctuation[t, k, j]
        # That is: C_ik = <Δr_i ⋅ Δr_k>
        cov_matrix = np.einsum('tij,tkj->ik', fluctuations, fluctuations) / n_frames
        
        # Normalize covariance to get the DCCM (dividing by the variances)
        # The diagonal has the variance for the atom
        diag = np.diag(cov_matrix)

        # Add a realy small number, to get rid of 0 division and get the square root
        diag_sqrt = np.sqrt(diag + 1e-10)
        
        # Normalization matrix for each element
        norm_matrix = np.outer(diag_sqrt, diag_sqrt)
        
        # Normalize covariances
        dccm_matrix_cpu = cov_matrix / norm_matrix


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

    # Instanciando a classe principal
    app = dataTranformer()

    # Define o caminho dos dados
    trajectory_data_path = '../dados'
    
    # Lista os sistemas presentes nos dados
    main_folders = None
    try:
        main_folders = [d for d in os.listdir(trajectory_data_path) if os.path.isdir(os.path.join(trajectory_data_path, d)) and not d.startswith('.')]
    except FileNotFoundError:
        print(f"Error: The directory '{base_dir}' was not found.")
        exit()

    
    for folder in sorted(main_folders):
        folder_path = os.path.join(trajectory_data_path, folder)
        print('System', folder)

        # Lista as réplicas presentes no sistema
        replicas = [r for r in os.listdir(folder_path) if os.path.isdir(os.path.join(folder_path, r)) and r.startswith('Rep_')]
        
        for replica in sorted(replicas):
            print('Replica', replica)
            replica_path = os.path.join(folder_path, replica)

            # Aplica o algoritmo para cada sistema e réplica presente dos dados
            app.algs.processTrajectory(replica_path)
                
    return 0

if __name__ == '__main__':
    sys.exit(main()) 

