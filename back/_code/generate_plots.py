import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


# Carrega os dados
df_source = pd.read_csv('front_performance.csv')

df = df_source.iloc[1:]

# Agrupa pela média de pontos visíveis para cada threshold
limpeza = df.groupby('pos_threshold')['visible_points'].mean()

plt.figure(figsize=(8, 5))
limpeza.plot(kind='line', marker='o', color='#2ca02c', linewidth=2)
plt.title('Impacto do Limiar (Threshold) na Densidade de Pontos')
plt.xlabel('Threshold (Positivo/Negativo)')
plt.ylabel('Média de Pontos Renderizados')
plt.grid(True, linestyle='--', alpha=0.6)
plt.tight_layout()
plt.show()


#------------------------------------------------------------


# sistemas = list(set(df['filename']))
# cores_num = range(0, len(sistemas))
# color_map = dict(zip(sistemas, cores_num))

# cores = []

# for i in range(0, len(df)):
#     temp = df.iloc[i]['filename']
#     cores.append(color_map.get(temp))

# # df['color'] = cores

# plt.figure(figsize=(8, 5))
# plt.scatter(df['visible_points'], df['render_time_ms'], c = cores, alpha=0.6, cmap = 'magma', label = df['simulation'])
# plt.title('Custo Computacional de Renderização por Volume de Dados')
# plt.xlabel('Número de Pontos Visíveis')
# plt.ylabel('Tempo de Renderização (ms)')


# plt.show()

# -----------------------------------------------------------

# g1 = sns.catplot(
#     data=df, 
#     x='pos_threshold',   # Eixo X agora é o threshold
#     y='avg_fps', 
#     col='filename',      # Desagrega criando um gráfico por arquivo
#     col_wrap=3,          # Quebra a linha a cada 3 gráficos (ajuste se necessário)
#     kind='box', 
#     palette='Set2',
#     height=4, 
#     aspect=1.0
# )

# # Ajuste de títulos e eixos
# g1.fig.suptitle('Impacto do Threshold no FPS para Cada Arquivo', y=1.05)
# g1.set_axis_labels('Threshold (Limiar)', 'FPS Médio')
# g1.set_titles('Arquivo: {col_name}')

# # Adiciona a linha de meta em todos os gráficos
# for ax in g1.axes.flat:
#     ax.axhline(30, color='red', linestyle='--', label='Meta (30 FPS)')

# # Pega a legenda do primeiro eixo para não duplicar
# g1.axes.flat[0].legend(loc='lower right')
# plt.tight_layout()
# plt.show()


# ----------------------------------


# # O catplot cria múltiplos gráficos baseados na coluna 'col'
# g = sns.catplot(
#     data=df, 
#     x='filename', 
#     y='avg_fps', 
#     col='pos_threshold', # Cria um gráfico separado para cada threshold
#     kind='box', 
#     palette='Set2',
#     height=5,    # Altura do gráfico
#     aspect=0.8   # Proporção largura/altura de cada subgráfico
# )

# for ax in g.axes.flat:
#     for label in ax.get_xticklabels():
#         label.set_rotation(45)
#         label.set_ha('right') # Alinha a ponta direita do texto com a marcação

# # Ajustes de Título e Eixos
# g.fig.suptitle('Estabilidade de FPS por Tipo de Arquivo sob Diferentes Thresholds', y=1.05)
# g.set_axis_labels('Tipo de Arquivo', 'FPS Médio (Navegação)')
# g.set_titles('Threshold: {col_name}') # Renomeia o título de cada subgráfico

# # Adiciona a linha de 30 FPS em TODOS os subgráficos
# for ax in g.axes.flat:
#     ax.axhline(30, color='red', linestyle='--', label='Meta (30 FPS)')

# # Adiciona a legenda apenas no último gráfico para não poluir
# plt.legend(loc='lower right')
# plt.show()