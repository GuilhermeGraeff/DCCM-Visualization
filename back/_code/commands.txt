# Comandos utilizados durante o desenvolvimento da pesquisa, para tratamento de dados, criação de ambiente e etc

## Criação do ambiente em python utilizando o conda

Python 3.10, Mdtraj, Cupy (Numpy utilizando GPU/Cuda) and Numpy 

source activate base (Activate conda)
conda create -n mdtraj_py_31 -c conda-forge python=3.10 mdtraj cupy numpy


## Tratamento da tajetória para a extração dos C-alpha

source /opt/apps/gromacs20250/bin/GMXRC

Extraindo um novo index que contém apenas os C-alpha pertencentes a proteína da trajetória:
echo -e "1 & 3 \nq" | gmx make_ndx -n index_novo.ndx

Utiliza index gerado e trajetória para a extração da trajetória dos C-alpha da simulação, resultando em um arquivo .xtc:
echo 'Protein_&_C-alpha' | gmx trjconv -s protein_md.tpr -f protein_md_rot_trans.trr -n index.ndx  -o traj_CA.xtc

echo 'Protein_&_C-alpha'| gmx trjconv -s protein_md.tpr -f protein_md.gro -n index.ndx -o protein_CA_only.gro -dump 0

Rodar o script que escreve os arquivos _batch_ que utiliza o Slurm Workload Manager para rodar os diferentes comandos do GROMACS para cada um dos sistemas e réplicas. 

python write_batches.py

Rodar os batches
sistemas=('wt' 'wt_lig' 'asp84glu' 'asp84glu_lig' 'asp294his' 'asp294his_lig')
for sistema in ${sistemas[@]};do
    for replica in {1..5}; do
        sbatch ../dados/${sistema}/Rep_${replica}/get_c_alpha_and_gro_${sistema}_rep_${replica}.batch
    done
done

Rodar o script que trata a trajetória e extrai as correlações de uma maneira fatiada, retornando múltiplos arquivos para cada réplica, para o tamanho defenido de cada fatia [25, 50, 100, 200, 400, 800, 1600]:
python transform_num.py 
ou
python transform_cup.py 
para utilizar gpu

Armazena em um zip para exportar os arquivos até o frontend
zip -r dados.zip dados -i '*.bin'

Coisas do Node e Docker:
npm install
npx vite
sudo docker compose up --build -d
sudo docker compose down


* Adiquirir os dados e inserir na pasta dados através dos arquivos disponibilizados na aplicação para a replicação dos scripts aqui utilizados
