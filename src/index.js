const eyes = () => {
    let eyes = []
    for (let eye of document.querySelectorAll("g.eye")) {
        let margin = 0.7
        let max_speed = 0.08

        let white = eye.querySelector(".white")
        let pupil = eye.querySelector(".pupil")
        let max_radius = white.getAttribute("r") - pupil.getAttribute("r")
        let cx = parseFloat(white.getAttribute("cx"))
        let cy = parseFloat(white.getAttribute("cy"))

        // state
        let pupilState = {
            vx: 0.0,
            vy: 0.0,
            dx: parseFloat(pupil.getAttribute("cx")) - cx,
            dy: parseFloat(pupil.getAttribute("cy")) - cy,
        }

        // goggle callback
        // old state -> new state
        // add a random increment to the velocity of each pupil
        // but don't exceed maximum allowed speed
        // move eye in direction of velocity but stay in bounds
        let update = (amplitude) => {
            amplitude = parseFloat(amplitude)
            if (isNaN(amplitude)) {
                amplitude = 0.05
            }
            let vx = pupilState.vx + gaussianIsh() * amplitude
            let vy = pupilState.vy + gaussianIsh() * amplitude
            let speed = norm(vx, vy)
            if (speed > max_speed) {
                vx *= max_speed / speed
                vy *= max_speed / speed
            }
            pupilState.vx = vx
            pupilState.vy = vy
            pupilState.dx += vx * max_radius
            pupilState.dy += vy * max_radius
            let radius = norm(pupilState.dx, pupilState.dy)
            if (radius > max_radius) {
                pupilState.dx *= max_radius / radius
                pupilState.dy *= max_radius / radius
            }
        }

        // DOM update callback
        let render = () => {
            let { dx, dy } = pupilState
            let radius = norm(dx, dy)
            if (radius > margin * max_radius) {
                dx = dx * margin * max_radius / radius
                dy = dy * margin * max_radius / radius
            }
            pupil.setAttribute("cx", cx + dx)
            pupil.setAttribute("cy", cy + dy)
        }

        eyes.push({
            eye: eye,
            state: pupilState,
            update: update,
            render: render,
        })
    }
    return eyes
}

function exponentialMovingAverage(momentum) {
    if (momentum == undefined) {
        momentum = 0.9
    }
    let ema = undefined
    let get = () => { return ema }
    let update = (x) => {
        if (ema === undefined) {
            ema = x
        }
        ema = ema * momentum + (1 - momentum) * x

    }
    return [get, update]
}

// create n eyes in svg element with randomly chosen centers
// tries to fill space using a heuristic: we choose a random
// center and check biggest eye that can be drawn there, we
// keep a moving average of these observations and only draw
// the eye if we exceed a reasonable threshold
function createEyes(svg, n) {
    let centers = []
    let sizes = []
    const width = parseFloat(svg.getAttribute("width"))
    const height = parseFloat(svg.getAttribute("height"))
    const max_size = 0.2 * Math.min(width, height)

    // exponential moving average of space around a randomly chosen point
    let [getEmaSpace, updateEmaSpace] = exponentialMovingAverage(0.99)

    let spaceAround = (cx, cy) => {
        let space = Math.min(cx, width - cx, cy, height - cy)
        for (let i = 0; i < centers.length; i++) {
            let dx = centers[i].cx - cx
            let dy = centers[i].cy - cy
            let size = (sizes[i] || 0)
            let distance = Math.max(norm(dx, dy) - size, 0)
            space = Math.min(space, distance)
        }
        return space
    }

    // choose random centers for eyes
    while (centers.length < n) {
        let cx = Math.random() * width
        let cy = Math.random() * height
        let space = spaceAround(cx, cy)
        updateEmaSpace(space)
        if (space >= getEmaSpace()) {
            let size = (0.8 + Math.random() * 0.15) * Math.min(space, max_size)
            centers.push({
                cx: cx,
                cy: cy,
            })
            sizes.push(size)
        }
    }

    // really make the eyes
    for (let i = 0; i < n; i++) {
        let eye = document.createElementNS("http://www.w3.org/2000/svg", "g")
        eye.setAttribute("class", "eye")
        eye.setAttribute("id", "eye" + i)
        svg.appendChild(eye)
        let white = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        white.setAttribute("class", "white")
        white.setAttribute("fill", "white")
        white.setAttribute("stroke", "black")
        white.setAttribute("cx", centers[i].cx)
        white.setAttribute("cy", centers[i].cy)
        white.setAttribute("r", sizes[i])
        eye.appendChild(white)
        const pupil_size = 0.3 + Math.random() * 0.3
        let pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        pupil.setAttribute("class", "pupil")
        pupil.setAttribute("fill", "black")
        pupil.setAttribute("stroke", "black")
        pupil.setAttribute("cx", centers[i].cx)
        pupil.setAttribute("cy", centers[i].cy)
        pupil.setAttribute("r", sizes[i] * pupil_size)
        eye.appendChild(pupil)
    }
}

function norm(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy)
}

// approximate standard guassian via central limit theorem
function gaussianIsh() {
    let res = 0.0
    for (let i = 0; i < 12; i++) {
        res += Math.random()
    }
    return res - 6
}

createEyes(document.querySelector("svg"), 500)
// goggle burn-in
for (let i = 0; i < 50; i++) {
    eyes().forEach((eye) => { eye.update(); eye.render() })
}

window.onmousemove = () => { eyes().forEach((eye) => { eye.update(); eye.render() }) }

