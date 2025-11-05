sistemas  = ['wt', 'wt_lig', 'asp84glu', 'asp84glu_lig', 'asp294his', 'asp294his_lig']

replicas=['1', '2', '3', '4', '5']

path = "/home/ggraeff/workspace/dccm/dados"

for sistema in sistemas: 
    for replica in replicas:
        data_path = path
        file_path = f'{path}/{sistema}/Rep_{replica}'
        cabecalho = f'''#!/bin/bash
#SBATCH -n 1
#SBATCH -p fila4
#SBATCH
source /opt/apps/gromacs20250/bin/GMXRC
WORKDIR={file_path} 
cd $WORKDIR

echo -e "1 & 3 \\nq" | gmx make_ndx -n {data_path}/{sistema}/Rep_{replica}/index_novo.ndx

echo 'Protein_&_C-alpha' | gmx trjconv -s {data_path}s/{sistema}/Rep_{replica}/protein_md.tpr -f {data_path}/{sistema}/Rep_{replica}/protein_md_rot_trans.trr -n {data_path}/{sistema}/Rep_{replica}/index.ndx  -o {data_path}/{sistema}/Rep_{replica}/traj_CA.xtc


echo 'Protein_&_C-alpha'| gmx trjconv -s {data_path}/{sistema}/Rep_{replica}/protein_md.tpr -f {data_path}/{sistema}/Rep_{replica}/protein_md.gro -n  {data_path}/{sistema}/Rep_{replica}/index.ndx -o {data_path}/{sistema}/Rep_{replica}/protein_CA_only.gro -dump 0
'''

        with open(f'../dados/{sistema}/Rep_{replica}/get_c_alpha_and_gro_{sistema}_rep_{replica}.batch', 'w') as pre:
            pre.write(cabecalho)







