import * as THREE from 'three'
import {Text} from 'troika-three-text'

class DccmFunctions {
    /**
     * Carrega e processa um arquivo .bin de DCCM compactado.
     * O arquivo deve ter um cabeçalho de 12 bytes [numSlices, numAtoms, dataTypeId]
     * seguido pelos dados do triângulo superior de cada matriz.
     * @param {string} url O caminho para o arquivo 'dccm_data.bin'.
     * @returns {Promise<Object>} Uma promessa que resolve para um objeto contendo os dados e métodos de acesso.
     */
    async loadBinaryDCCM(url) {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Erro de HTTP ao carregar ${url}: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();

      // 1. LER O CABEÇALHO (12 bytes)
      const headerView = new DataView(arrayBuffer, 0, 12);
      const numSlices = headerView.getUint32(0, true); // O 'true' indica little-endian
      const numAtoms = headerView.getUint32(4, true);
      const dataTypeId = headerView.getUint32(8, true); // 1 para Float32

      // 2. LER O CORPO DOS DADOS
      let rawData;
      const dataOffset = 12; // Os dados começam após o cabeçalho

      if (dataTypeId === 1) { // float32
          rawData = new Float32Array(arrayBuffer, dataOffset);
      } else {
          throw new Error(`Tipo de dado não suportado: ${dataTypeId}`);
      }

      const numElementsPerSlice = (numAtoms * (numAtoms + 1)) / 2;

      /**
       * Acessa de forma eficiente um valor na matriz DCCM compactada.
       * @param {number} sliceIndex O índice da fatia (slice).
       * @param {number} i O índice do primeiro átomo.
       * @param {number} j O índice do segundo átomo.
       * @returns {number} O valor de correlação.
       */
      const getDCCMValue = (sliceIndex, i, j) => {
          // Garante que i <= j para acessar o triângulo superior
          if (i > j) {
              [i, j] = [j, i]; // Troca os valores
          }

          // Fórmula para encontrar o índice no array 1D do triângulo superior
          const sliceOffset = sliceIndex * numElementsPerSlice;
          const indexInTriangle = (numAtoms * i - (i * (i - 1)) / 2) + (j - i);
          
          return rawData[sliceOffset + indexInTriangle];
      };

      /**
       * Reconstrói uma matriz 2D completa para uma única fatia.
       * Útil para compatibilidade com funções que esperam uma matriz completa.
       * @param {number} sliceIndex O índice da fatia a ser reconstruída.
       * @returns {Array<Array<number>>} A matriz 2D completa.
       */
      const getSliceAsMatrix = (sliceIndex) => {
          const matrix = Array(numAtoms).fill(0).map(() => Array(numAtoms).fill(0));
          for (let i = 0; i < numAtoms; i++) {
              for (let j = i; j < numAtoms; j++) {
                  const value = getDCCMValue(sliceIndex, i, j);
                  matrix[i][j] = value;
                  matrix[j][i] = value; // Espelha o valor
              }
          }
          return matrix;
      };

      console.log(`Dados binários carregados: ${numSlices} fatias, ${numAtoms} átomos.`);
      
      return {
          numSlices,
          numAtoms,
          rawData,
          getDCCMValue,
          getSliceAsMatrix
      };
    }
    // misc
    createRandomDCCM( size ) {
        var random_DCCM_columns = new Array();
        for (var i = 0; i < size; i++) {
            var random_DCCM_line = new Array();
            for (var j = 0; j < size; j++) {
                random_DCCM_line.push((Math.random()*2) - 1)
            }
            random_DCCM_columns.push(random_DCCM_line)
        }
        return random_DCCM_columns
    }

    // particle stuff
    createParticleSlice( slice, pos_x, pos_y, pos_z, step_length, particle_size, neg_tre, pos_tre ) {
        const particle_geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const colors = [];
        
        for (var residue = 0; residue < slice.length; residue++) {
            for (var j = 0; j < slice[residue].length; j++) {
                if ((slice[residue][j] > -neg_tre && (slice[residue][j] < pos_tre))) {
                    continue
                }
                positions.push( pos_x+(residue*step_length), pos_y+(j*step_length), pos_z );
                var color_gradient = this.gradientColorForCorrelationForParticles(slice[residue][j])
                colors.push( color_gradient[0]/255.0, color_gradient[1]/255.0, color_gradient[2]/255.0)
            }
        }
        
        particle_geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        particle_geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        
        particle_geometry.computeBoundingSphere();
        
        const particle_material = new THREE.PointsMaterial( { size: particle_size, vertexColors: true } );
        
        return [particle_geometry, particle_material]
    }

    gradientColorForCorrelationForParticles(value) {
        const blue = { r: 0, g: 0, b: 255 };  // Azul
        const white = { r: 255, g: 255, b: 255 }; // Branco
        const red = { r: 255, g: 0, b: 0 };    // Vermelho
      
        let resultColor;
      
        if (value < 0) {
          const t = (value + 0.75); 
          resultColor = {
            r: Math.round(blue.r * (1 - t) + white.r * t),  
            g: Math.round(blue.g * (1 - t) + white.g * t),
            b: Math.round(blue.b * (1 - t) + white.b * t),
          };
        } else {
          const t = value + 0.25; 
          resultColor = {
            r: Math.round(red.r * t + white.r * (1 - t)),
            g: Math.round(red.g * t + white.g * (1 - t)),
            b: Math.round(red.b * t + white.b * (1 - t)),
          };
        }
        return [resultColor.r, resultColor.g, resultColor.b];
      }

}

export default DccmFunctions