# Visualizador de _Dynamic Cross Correlation Maps_(DCCM) como grafos dinâmicos

**Tags:** #visualização-de-dados #dinâmica-molecular #bioinformatica-estrutural


---


## Visualizador tridimensional de _Dynamic Cross Correlation Maps_ que consideram o tempo, como matrizes de adjacência sobrepostas

A ideia deste projeto surgiu no desenvolvimento de um projeto na cadeira de _Visual Analytics_, desde então a o projeto vem tomando forma. Ao compartilhar momentos com colegas de laboratório identifiquei a necessidade da exploração temporal da métrica que estava sendo visualizada de maneira estática, motivando o início do desenvolvimento da ideia.

O projeto então assume um carácter exploratório, visto que o desenvolvimento da ferramenta possui limitações consideráveis, contudo, exemplificam o que a pesquisa busca evidenciar.




### Back-end: _Backend experimental_ 

O Backend desta ferramenta é 'desacoplado' do uso da mesma, por conter um caráter exploratório, visto que o pré-processamento dos dados tanto por parte do GROMACS quanto por parte da lógica principal, desenvolvida em Python, que 'fatia' o DCCM trabalham com um volume de dados que torna impraticável a transferência destes arquivos gigantescos :)

Características principais:
- Python (lang)
- Mdtraj (lib)
- Uso de matrizes para cálculos ()

Como aplicar o uso para uma trajetória não contida no caso de testes explorado no trabalho:

Etapa do GROMACS:

Etapa do Python:

retorna um arquivo binário otimizado

não usa container sepa

### Front-end: _Fully developed_

Desenvolvida por completo utilizando Node e Three js, o three é uma biblioteca desenvolvida com o fim de abstrair o uso do WebGL, simplificando processos para o desenvolvimento de diversas ferramentas, tanto em simples projetos web como até mesmo aplicações complexas, que neste caso servem como prova de conceito.

O Frontend utiliza a aplicação de _shaders_ para uma melhor otimização da renderização, demonstrando esta matriz tridimensional que **demonstra a correlação de todos os resíduos contra todos os resíduos ao decorrer do tempo**. Segue uma imagem meramente ilustrativa como uma pequena demonstração das correlações que podem 'desaparecer' quando a média completa da trajetória é considerada (quadrado verde = volume de correlações, xis rosa = correlações e anti correlações acontecendo simultaneamente em um curto momento de tempo): 

![DCCM-Time](/front/images/example.png)

Como rodar a aplicação de visualização após o pré-processamento dos dados:

Localizando arquivos de entrada (Binários vindo do backend)

Rodar container coisarada
---

## Referências/Links/Nota final

dalek