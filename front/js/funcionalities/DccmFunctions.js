import * as THREE from 'three'

class DccmFunctions {

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
    createParticleSlice( slice, pos_x, pos_y, pos_z, step_length, particle_size ) {
        const particle_geometry = new THREE.BufferGeometry();
        
        const positions = [];
        const colors = [];
        
        for (var residue = 0; residue < slice.length; residue++) {
            for (var j = 0; j < slice[residue].length; j++) {
                if ((slice[residue][j] < 0.25) && (slice[residue][j] > -0.25)) {
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