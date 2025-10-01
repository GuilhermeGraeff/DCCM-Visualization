import * as THREE from 'three'
import {Text} from 'troika-three-text'

class DccmFunctions {

    async loadBinaryDCCM(url) {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Erro de HTTP ao carregar ${url}: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();


      const headerView = new DataView(arrayBuffer, 0, 12);
      const numSlices = headerView.getUint32(0, true);
      const numAtoms = headerView.getUint32(4, true);
      const dataTypeId = headerView.getUint32(8, true);

      let rawData;
      const dataOffset = 12; // Data after Header

      if (dataTypeId === 1) { // float32
          rawData = new Float32Array(arrayBuffer, dataOffset);
      } else {
          throw new Error(`Tipo de dado não suportado: ${dataTypeId}`);
      }

      const numElementsPerSlice = (numAtoms * (numAtoms + 1)) / 2;


      const getDCCMValue = (sliceIndex, i, j) => {
          if (i > j) {
              [i, j] = [j, i]; 
          }

          const sliceOffset = sliceIndex * numElementsPerSlice;
          const indexInTriangle = (numAtoms * i - (i * (i - 1)) / 2) + (j - i);
          
          return rawData[sliceOffset + indexInTriangle];
      };

      const getSliceAsMatrix = (sliceIndex) => {
          const matrix = Array(numAtoms).fill(0).map(() => Array(numAtoms).fill(0));
          for (let i = 0; i < numAtoms; i++) {
              for (let j = i; j < numAtoms; j++) {
                  const value = getDCCMValue(sliceIndex, i, j);
                  matrix[i][j] = value;
                  matrix[j][i] = value;
              }
          }
          return matrix;
      };
      
      return {
          numSlices,
          numAtoms,
          rawData,
          getDCCMValue,
          getSliceAsMatrix
      };
    }

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

    createParticleSlice( slice, pos_x, pos_y, pos_z, step_length, particle_size, negative_treshold, positive_treshold ) {
        const particle_geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const colors = [];
        
        for (var residue = 0; residue < slice.length; residue++) {
            for (var j = 0; j < slice[residue].length; j++) {
                if ((slice[residue][j] > -negative_treshold && (slice[residue][j] < positive_treshold))) {
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
        const blue = { r: 0, g: 0, b: 255 };
        const white = { r: 255, g: 255, b: 255 };
        const red = { r: 255, g: 0, b: 0 }; 
      
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