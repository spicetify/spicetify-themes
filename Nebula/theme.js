function createBackgroundProgram(gl) {
    const backgroundVs = `#version 300 es
    layout(location=0) in vec2 iPosition;

    void main() {
      gl_Position = vec4(iPosition, 0.0, 1.0);
    }`

    const backgroundFs = `#version 300 es
    precision mediump float; 

    uniform float uTime; 
    uniform float uDpi;
    uniform vec2 uResolution;
    uniform float uRng;

    out vec4 fragColor;

    #define SRGB_TO_LINEAR(c) pow((c), vec3(2.2))
    #define LINEAR_TO_SRGB(c) pow((c), vec3(1.0 / 2.2))
    #define SRGB(r, g, b) SRGB_TO_LINEAR(vec3(float(r), float(g), float(b)) / 255.0)
    #define TONE_MAP(c) 1.0 - exp(-c)

    const vec3 COLOR0 = SRGB(20, 43, 81);
    const vec3 COLOR1 = SRGB(0, 0, 2);
    const vec3 cometColors[5] = vec3[]( 
      SRGB(126, 33, 255), // Violet
      SRGB(92, 154, 255),  // Blue
      SRGB(42, 212, 90),   // Green
      SRGB(239, 72, 255), // Pink
      SRGB(255, 201, 92)   // Yellow
    );

    // Noise from Jorge Jimenez's presentation:
    // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
    float noise(vec2 uv)
    {
        const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
        return fract(magic.z * fract(dot(uv, magic.xy)));
    }

    // Another noise function
    float hash21(vec2 p)
    {
        p = fract(p * vec2(234.34, 543.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
    }

    // Hard coded 45 degree rotation
    mat2 rotate45()
    {
        float c = 0.70710678; // sin(45) = cos(45)
        return mat2(c, -c, c, c);
    }

    float star(vec2 uv, float salt) 
    {
        // --------------------------------------- Star rng ----------------------------------------- 
        float size = fract(salt * 5411.71);           // Set the size of the star
        float loop = .5 + .5 * sin(uTime * salt);     // Star lifecycle, 0 to 1 range
        float flare = smoothstep(.97, 1., size);      // Only the biggest stars will have flare
        float bloom = .014 * (loop);                  // Animate the bloom of stars

        // -------------------------------------- Render Star --------------------------------------- 
        float dist = length(uv);                  // Distance from every pixel to the center of frame.
        float star = max(0.0, bloom / dist);      // Bloom factor, adjust scalar to brighten star.
        star = pow(star, 2.4);
        
        // Use (x,y) coordinates to generate rays, as x and y approach 0s, rays will approach 1. 
        float rays = max(0.0, .8 - abs(uv.x * uv.y * 1000.));
        star += rays * flare * loop * 0.5;

        uv *= rotate45();
        rays = max(0.0, .8 - abs(uv.x * uv.y * 1000.));
        star += rays * flare * loop * 0.2;

        // Smooth step to control bloom reach and fade
        star *= smoothstep(.8, 0., dist);

        return star * size;
    }

    float sdUnevenCapsule(vec2 uv, vec2 pa, vec2 pb, float ra, float rb)
    {
        // Vector from pa to pb
        vec2  ab  = pb - pa;
        float len = length(ab);
        vec2  dir = ab / len;  // Unit direction

        // Project (p - pa) onto the line’s direction to find param t
        float t = dot(uv - pa, dir);

        // Radius at param t (linearly interpolated)
        float r = mix(ra, rb, clamp(t/len, 0.0, 1.0));

        // Now clamp t to segment [0, len] so we get distance to the correct region
        t = clamp(t, 0.0, len);

        // Closest point on the line segment
        vec2 closest = pa + dir * t;

        // Distance from p to the line segment
        float dist = length(uv - closest) - r;

        return dist;
    }

    void main()
    {
        // --------------------------------------- Background --------------------------------------- 
        float t = gl_FragCoord.y / uResolution.y;
        t = smoothstep(0.0, 0.8, t);
        vec3 gradientColor = mix(COLOR0, COLOR1, t);

        // ----------------------------------------- Stars ------------------------------------------
        // Centered uv in middle of screen
        vec2 uv = (gl_FragCoord.xy - .5 * uResolution.xy) / uResolution.y;
        
        // Apply zoom, adjusting for screen size
        float screenHeightInches = uResolution.y / uDpi;
        float adjustForLargeDisplay = 5. * step(12., screenHeightInches);
        vec2 starsUv = uv * (18. + adjustForLargeDisplay);

        vec3 starsColor = vec3(0);
        
        // Grid starsUv, the fractional part of the starsUv, subtract
        // 0.5 to recenter the origin from (0,0) to (0.5, 0.5)
        vec2 gridUv = fract(starsUv) - .5;
        
        // ID values are used to identify each star bounding box
        vec2 id = floor(starsUv);
        
        // Sample around cell block to blend blooms
        for (int y = -1; y <= 1; ++y) {
            for (int x = -1; x <= 1; ++x) {
                vec2 offs = vec2(x, y);
                float salt = hash21(id + offs);

                vec2 starUv = gridUv - offs - vec2(salt, fract(salt * 51.11)) + .5;
                starsColor += star(starUv, salt);  
            }
        }

      // ----------------------------------------- Comets -------------------------------------------
      vec3 cometColor = vec3(0);

      float r1 = 0.003;
      float r2 = 0.001;

      for (float i = 0.; i < 17.; ++i) {
        float salt = noise(vec2(71.11 * i, 423.49 * i) * uRng);

        // Use noise to position comets
        float translate = 5. * tan(i*salt + .02*uTime);

        // Modified salt to better center and distribute comets
        vec2 v1 = vec2(2. * salt - 1., 0.) - translate;
        vec2 v2 = v1 + 0.3;

        float dist = smoothstep(r2, r1, -sdUnevenCapsule( uv, v1, v2, r1, r2 ));
        cometColor += dist * cometColors[int(mod(i, 5.))] * 8.;
      }

      // ------------------------------------- Compose Scene ----------------------------------------
      vec3 color = vec3(0);

      gradientColor = TONE_MAP(gradientColor);
      gradientColor = LINEAR_TO_SRGB(gradientColor);

      starsColor = TONE_MAP(starsColor);
      starsColor = LINEAR_TO_SRGB(starsColor);

      cometColor = TONE_MAP(cometColor);
      cometColor = LINEAR_TO_SRGB(cometColor);

      color += gradientColor;
      color += starsColor;
      color += cometColor;

      // Then add noise to reduce banding.
      color += (1.0/255.0) * noise(gl_FragCoord.xy) - (0.5/255.0);

      fragColor = vec4(color, 1.0);
    }`

    const program = createWebGLProgram(gl, backgroundVs, backgroundFs)

    // Gets the location of a uniform variable, programatically set in draw calls.
    const uResolutionLoc = gl.getUniformLocation(program, 'uResolution')
    const uTimeLoc = gl.getUniformLocation(program, 'uTime')
    const uDpiLoc = gl.getUniformLocation(program, 'uDpi')
    const uRng = gl.getUniformLocation(program, 'uRng')

    gl.useProgram(program)
    
    // set RNG values for commet placement
    gl.uniform1f(uRng, Math.random() * 1000) 

    gl.useProgram(null)

    // we count up from 0 indefinetly, however at the current
    // rate we're going, it'll take a lifetime to reach the
    // max Javascript safe numeric value of 9007199254740991
    let then = 0
    let uTime = 51

    function draw(canvas, now) {
        const deltaTime = now - then
        then = now
        uTime += deltaTime * 0.001

        gl.useProgram(program)

        // set uniforms across entire program
        gl.uniform2f(uResolutionLoc, canvas.width, canvas.height)
        gl.uniform1f(uTimeLoc, uTime)
        gl.uniform1f(uDpiLoc, window.devicePixelRatio * 96)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        // always unset the program when you're done drawing
        gl.useProgram(null)
    }
    return { draw }
}

function createFullscreenQuadVAO(gl) {
    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]) // (x,y) pairs

    const quadVAO = gl.createVertexArray()
    gl.bindVertexArray(quadVAO)

    const quadVBO = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO)
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW)

    // vertexAttribPointer
    // Tells webGL how to interpret the currently bound ARRAY_BUFFER
    // as the data for the vertex attribute at positionLocation.
    //
    // enableVertexAttribArray
    // Enables that attribute array so the GPU will use the buffer data for that attribute when drawing.

    // iPosition -> location=0
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0)
    gl.enableVertexAttribArray(0)

    // unbind
    gl.bindVertexArray(null)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)

    return quadVAO
}

function createWebGLProgram(gl, vs, fs) {
    const program = gl.createProgram()

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    gl.shaderSource(vertexShader, vs)
    gl.compileShader(vertexShader)
    gl.attachShader(program, vertexShader)

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    gl.shaderSource(fragmentShader, fs)
    gl.compileShader(fragmentShader)
    gl.attachShader(program, fragmentShader)

    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader))
        console.log(gl.getShaderInfoLog(fragmentShader))
    }

    return program
}

function initializeWebGL(topContainer) {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')

    canvas.className = 'background-canvas'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '-1'
    canvas.style.pointerEvents = 'none'
    canvas.style.background = 'black'

    let observedDisplayHeight = canvas.clientHeight
    let observedDisplayWidth = canvas.clientWidth

    canvas.width = observedDisplayWidth
    canvas.height = observedDisplayHeight
    gl.viewport(0, 0, canvas.width, canvas.height)
    topContainer.appendChild(canvas)

    // create a resize observer, pass it a function to call
    // anytime any elements we're observing do change size.
    const observer = new ResizeObserver((entries) => {
        // We assume only a single entry, the canvas
        const entry = entries[0]
        const dpSize = entry.devicePixelContentBoxSize?.[0]

        const width = dpSize.inlineSize
        const height = dpSize.blockSize

        const displayWidth = Math.trunc(width)
        const displayHeight = Math.trunc(height)

        observedDisplayWidth = displayWidth
        observedDisplayHeight = displayHeight
    })
    observer.observe(canvas, { box: 'device-pixel-content-box' })

    function resizeCanvasToDisplaySize(canvas, gl) {
        const needResize =
            canvas.width !== observedDisplayWidth || canvas.height !== observedDisplayHeight

        if (needResize) {
            canvas.width = observedDisplayWidth
            canvas.height = observedDisplayHeight
            gl.viewport(0, 0, canvas.width, canvas.height)
        }
    }

    const quadVAO = createFullscreenQuadVAO(gl)
    gl.bindVertexArray(quadVAO)

    const backgroundProgram = createBackgroundProgram(gl)

    const targetDelta = 41 // ms ~ 24 FPS
    //const targetDelta = 66 // ms ~ 15 FPS
    let then = 0

    function animate(now) {
        const deltaTime = now - then

        if (deltaTime > targetDelta) {
            then = now

            // Clear contents before paint
            gl.clearColor(0, 0, 0, 1)
            gl.clear(gl.COLOR_BUFFER_BIT)

            resizeCanvasToDisplaySize(canvas, gl)

            backgroundProgram.draw(canvas, now)
        }
        requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
}

document.addEventListener('DOMContentLoaded', () => {
    // Observe for the required elements once the DOM is loaded.
    const targetNode = document.body
    const observerConfig = { childList: true, subtree: true }

    let initialized = false

    const observer = new MutationObserver((mutations) => {
        // Check if .Root__top-container is present
        const topContainer = document.querySelector('.Root__top-container')

        if (!initialized && topContainer) {
            initializeWebGL(topContainer)
            initialized = true
        }

        // Once all targets are found, we can safely disconnect the observer.
        if (initialized) {
            observer.disconnect()
        }
    })

    observer.observe(targetNode, observerConfig)
})
