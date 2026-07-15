// --- SCENE SETUP ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 35;

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("#bg"),
    antialias: true,
    alpha: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- LIGHTS ---
scene.add(new THREE.AmbientLight(0xffffff, 1.2));
const light = new THREE.PointLight(0xffffff, 3);
light.position.set(20, 20, 20);
scene.add(light);

const warmLight = new THREE.PointLight(0xFF6B6B, 8, 50);
warmLight.position.set(-15, 10, 15);
scene.add(warmLight);

// --- SMOKE PARTICLE SETUP --- //
const smokeParticles = [];
const smokeGeo = new THREE.SphereGeometry(0.3, 8, 8);
const smokeMat = new THREE.MeshBasicMaterial({
    color: 0xdddddd,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
});


// --- STAR TRAIL WITH CURSOR --- //
let lastX = 0; // Track the previous mouse position

document.addEventListener('mousemove', (e) => {
    // Determine direction: > 0 means moving right, < 0 means moving left
    const direction = e.clientX - lastX;
    lastX = e.clientX;

    // Only spawn if the mouse is moving
    if (Math.abs(direction) > 1) { 
        for (let i = 0; i < 2; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'star-particle';
            
            // Logic: 
            // If moving LEFT (direction < 0), particles spawn from bottom-right (offsetX positive)
            // If moving RIGHT (direction > 0), particles spawn from bottom-left (offsetX negative)
            const horizontalOffset = direction > 0 ? -30 : 30;
            const offsetX = horizontalOffset + (Math.random() - 0.5) * 20;
            
            // Vertical offset to make it appear from below
            const offsetY = 20 + (Math.random() * 10); 
            
            sparkle.style.left = `${e.clientX + offsetX}px`;
            sparkle.style.top = `${e.clientY + offsetY}px`;
            
            document.getElementById('star-container').appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 600);
        }
    }
});


// --- CURSOR AS A STAR --- //
const cursor = document.querySelector('.custom-cursor');

document.addEventListener('mousemove', (e) => {
    // Moves the element to the cursor coordinates
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

//  Make it grow when hovering over links
document.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('mouseover', () => cursor.style.transform = 'scale(2)');
    link.addEventListener('mouseleave', () => cursor.style.transform = 'scale(1)');
});



// --- NAVBAR TOGGLER --- //
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const menuIcon = menuToggle.querySelector("i");

menuToggle.addEventListener("click", (e) => {

    e.stopPropagation(); // Prevent document click from firing

    navLinks.classList.toggle("active");

    if (navLinks.classList.contains("active")) {
        menuIcon.classList.remove("bx-menu");
        menuIcon.classList.add("bx-x");
    } else {
        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }

});

// Close menu after clicking a link
document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", () => {

        navLinks.classList.remove("active");

        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");

    });

});

// Close menu when clicking outside
document.addEventListener("click", (e) => {

    if (
        navLinks.classList.contains("active") &&
        !navLinks.contains(e.target) &&
        !menuToggle.contains(e.target)
    ) {
        navLinks.classList.remove("active");

        menuIcon.classList.remove("bx-x");
        menuIcon.classList.add("bx-menu");
    }

});


// --- REALISTIC ROCKETS ---  //
const rockets = [];
const loader = new THREE.GLTFLoader();

loader.load('rocket_model/source/Rocket_baked.glb', (gltf) => {
    const rawModel = gltf.scene;
    function createRocket(direction, offsetX, phaseY, phaseZ, ampY, ampZ) {
        const wrapperGroup = new THREE.Group();
        const rocketMesh = rawModel.clone();
        rocketMesh.rotation.x = Math.PI / 2; 
        wrapperGroup.add(rocketMesh);
        const exhaust = new THREE.Object3D();
        exhaust.position.set(0, 0, -2.5); 
        wrapperGroup.add(exhaust);
        wrapperGroup.scale.set(0.4, 0.4, 0.4); 
        wrapperGroup.userData = { direction, speed: 0.015, offsetX, curveY: 0.04, curveZ: 0.05, phaseY, phaseZ, amplitudeY: ampY, amplitudeZ: ampZ, exhaustNode: exhaust };
        scene.add(wrapperGroup);
        rockets.push(wrapperGroup);
    }
    createRocket(1, 0, 0, 2, 15, 8);
    createRocket(-1, 50, 4, 1, 12, 15);
}, undefined, (error) => { console.error('Error loading rocket:', error); });



// --- BACKGROUND STARS ---
const starsGeometry = new THREE.BufferGeometry();
const vertices = [];
for (let i = 0; i < 5000; i++) {
    vertices.push((Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200, (Math.random() - 0.5) * 200);
}
starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xF8F9FA, size: 0.1, transparent: true, opacity: 0.6 }));
scene.add(stars);

// --- ANIMATION LOOP ---
let frameCounter = 0;

function animate() {
    requestAnimationFrame(animate);
    frameCounter++;

    // Rockets & Smoke logic
    rockets.forEach((rocketGroup) => {
        const data = rocketGroup.userData;
        let currentX = (data.direction === 1) ? ((Date.now() * data.speed + data.offsetX) % 120) - 60 : 60 - ((Date.now() * data.speed + data.offsetX) % 120); 
        const currentY = Math.sin(currentX * data.curveY + data.phaseY) * data.amplitudeY;
        const currentZ = Math.cos(currentX * data.curveZ + data.phaseZ) * data.amplitudeZ - 10;
        rocketGroup.position.set(currentX, currentY, currentZ);
        
        const nextX = currentX + (0.5 * data.direction);
        const nextY = Math.sin(nextX * data.curveY + data.phaseY) * data.amplitudeY;
        const nextZ = Math.cos(nextX * data.curveZ + data.phaseZ) * data.amplitudeZ - 10;
        rocketGroup.lookAt(nextX, nextY, nextZ);

        if (frameCounter % 3 === 0) {
            const puff = new THREE.Mesh(smokeGeo, smokeMat.clone()); 
            const exhaustPos = new THREE.Vector3();
            data.exhaustNode.getWorldPosition(exhaustPos);
            puff.position.set(exhaustPos.x + (Math.random() - 0.5) * 0.5, exhaustPos.y + (Math.random() - 0.5) * 0.5, exhaustPos.z + (Math.random() - 0.5) * 0.5);
            puff.userData = { life: 1.0, expandSpeed: 0.02 + Math.random() * 0.02 };
            scene.add(puff);
            smokeParticles.push(puff);
        }
    });

    for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const p = smokeParticles[i];
        p.userData.life -= 0.015; 
        p.scale.setScalar(1 + (1 - p.userData.life) * 2); 
        p.material.opacity = p.userData.life * 0.6; 
        if (p.userData.life <= 0) { scene.remove(p); p.material.dispose(); smokeParticles.splice(i, 1); }
    }

    stars.rotation.y += 0.0005; 
    renderer.render(scene, camera);
}
animate();


// --- RESIZE & INTERACTIVE TEXT --- //
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.querySelectorAll('.track-cursor').forEach(el => {
    el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mouse-x', `${((e.clientX - rect.left) / rect.width) * 100}%`);
        el.style.setProperty('--mouse-y', `${((e.clientY - rect.top) / rect.height) * 100}%`);
    });
});


// --- ABOUT SECTION IMAGE HOVER --- //
const wrapper = document.getElementById('portrait-tracker');

wrapper.addEventListener('mousemove', (e) => {
    const rect = wrapper.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    wrapper.style.setProperty('--mouse-x', `${x}%`);
    wrapper.style.setProperty('--mouse-y', `${y}%`);
});

wrapper.addEventListener('mouseleave', () => {
    // Move the hole off-screen so the base image is fully visible again
    wrapper.style.setProperty('--mouse-x', `-50%`);
    wrapper.style.setProperty('--mouse-y', `-50%`);
});



// --- PROJECT FILTERING --- //

const filterButtons = document.querySelectorAll(".filter-btn");

// Store original slides
const originalSlides = Array.from(
    document.querySelectorAll(".project-slider .swiper-slide")
).map(slide => slide.outerHTML);

function filterProjects(filter) {

    // Remove all current slides
    projectSwiper.removeAllSlides();

    // Filter slides
    const filteredSlides = originalSlides.filter(html => {

        if (filter === "all") return true;

        const temp = document.createElement("div");
        temp.innerHTML = html;

        const category = temp.querySelector(".glow-card").dataset.category;

        return category === filter;
    });

    // Add filtered slides
    projectSwiper.appendSlide(filteredSlides);

    // Refresh Swiper
    projectSwiper.update();
    projectSwiper.slideTo(0, 0);
}

filterButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        document
            .querySelector(".filter-btn.active")
            ?.classList.remove("active");

        btn.classList.add("active");

        filterProjects(btn.dataset.filter);

    });

});

// Hero buttons
document.querySelectorAll(".explore-btn").forEach(btn => {

    btn.addEventListener("click", () => {

        const filter = btn.dataset.filter;

        document
            .querySelector(`.filter-btn[data-filter="${filter}"]`)
            .click();

    });

});


// --- SWIPER SLIDER --- //

const projectSwiper = new Swiper(".project-slider", {

    slidesPerView: 1,
    spaceBetween: 40,

    loop: true,

    navigation: {
        nextEl: ".custom-next",
        prevEl: ".custom-prev",
    },

    pagination: {
        el: ".custom-pagination",
        clickable: true,
    },

    observer: true,
    observeParents: true,

    breakpoints: {
        768: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        }
    }

});

/*==============================
      ROCKET SCROLL BUTTON
==============================*/

const scrollBtn = document.getElementById("scroll-up");

// show button

window.addEventListener("scroll",()=>{

    if(window.scrollY>=400){

        scrollBtn.classList.add("show-scroll");

    }else{

        scrollBtn.classList.remove("show-scroll");

    }

});

// launch

scrollBtn.addEventListener("click",(e)=>{

    e.preventDefault();

    scrollBtn.classList.add("launch");

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

});

// reset after scroll

window.addEventListener("scroll",()=>{

    if(window.scrollY<30){

        scrollBtn.classList.remove("launch");

    }

});

// Disable custom cursor on touch devices //
const isTouchDevice =
    window.matchMedia("(hover: none), (pointer: coarse)").matches;

if (!isTouchDevice) {
    // Put all your custom cursor code here:
    // - mousemove for cursor
    // - star trail
    // - hover scaling
}
