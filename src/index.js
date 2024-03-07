const eyes = (() => {
    let eyes = []
    for (let eye of document.querySelectorAll("g.eye")) {
        let margin = 0.7
        let vmax = 0.08

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
        let update = (amplitude) => {
            amplitude = parseFloat(amplitude)
            if (isNaN(amplitude)) {
                amplitude = 0.02
            }
            let vx = pupilState.vx + gaussianIsh() * amplitude
            let vy = pupilState.vy + gaussianIsh() * amplitude
            let speed = norm(vx, vy)
            if (speed > vmax) {
                vx *= vmax / speed
                vy *= vmax / speed
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
})()

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

window.onmousemove = () => { eyes.forEach((eye) => { eye.update(); eye.render() }) }

