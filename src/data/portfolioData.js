/**
 * Rafia Gull - Personal Portfolio Data
 * Data-driven configuration for projects, skills, biography, and landmarks.
 * Easily update or add new projects here without altering 3D engine code.
 */

export const portfolioData = {
  profile: {
    name: "Rafia Gull",
    role: "Aspiring Game Developer",
    specialization: "Gaming & Animation",
    education: {
      degree: "Bachelor of Science in Computer Science",
      focus: "Specializing in Gaming and Animation",
      status: "Student / Developer"
    },
    tagline: "Crafting immersive worlds, dynamic gameplay mechanics, and real-time interactive 3D experiences.",
    bio: [
      "I am a Computer Science student with a passionate specialization in Gaming and Animation. My mission is to merge technical computer science principles—algorithms, math, and systems—with creative game design and visual storytelling.",
      "Driven by real-time rendering, physics-driven interactions, and player immersion, I build interactive 3D simulations and games across modern game engines and the web.",
      "Always exploring novel graphics techniques, procedural generation, character animation, and responsive game mechanics."
    ],
    // Placeholders for personal contact - update with your verified URLs/emails
    contact: {
      email: "rafia.gull@example.com", // Replace with your actual email
      github: "https://github.com",       // Replace with your GitHub profile URL
      linkedin: "https://linkedin.com",   // Replace with your LinkedIn URL
      itch: "https://itch.io",           // Replace with your Itch.io page (if any)
      location: "Available for Remote & On-site Opportunities"
    }
  },

  // Interactive 3D World Landmarks
  landmarks: [
    {
      id: "spawn",
      title: "Navigation Dock",
      subtitle: "Arrival Platform",
      code: "NAV-01",
      position: { x: 0, y: 0, z: 12 },
      color: 0x00ffff,
      type: "beacon"
    },
    {
      id: "about",
      title: "Command Hub",
      subtitle: "Bio & Specialization",
      code: "CMD-02",
      position: { x: -32, y: 1, z: -25 },
      color: 0x8b5cf6,
      type: "station",
      actionText: "Open Command Hub"
    },
    {
      id: "projects",
      title: "The Orbital Hangar",
      subtitle: "Game Projects & Demos",
      code: "HGR-03",
      position: { x: 0, y: 3, z: -55 },
      color: 0x38bdf8,
      type: "hangar",
      actionText: "Enter Orbital Hangar"
    },
    {
      id: "skills",
      title: "Cyber Laboratory",
      subtitle: "Tech Stack & Matrix",
      code: "LAB-04",
      position: { x: 32, y: 1, z: -25 },
      color: 0x10b981,
      type: "laboratory",
      actionText: "Access Cyber Lab"
    },
    {
      id: "contact",
      title: "Deep Space Relay",
      subtitle: "Communications & Socials",
      code: "RLY-05",
      position: { x: 0, y: 2, z: 35 },
      color: 0xf59e0b,
      type: "relay",
      actionText: "Open Deep Space Relay"
    }
  ],

  // Skills organized by domain
  skills: [
    {
      category: "Game Engines & Frameworks",
      icon: "gamepad",
      items: [
        { name: "Unity", level: "Intermediate", desc: "C# scripting, component-based architecture, physics, UI Canvas" },
        { name: "Unreal Engine", level: "Familiar", desc: "Blueprints visual scripting, level design, material graphs" },
        { name: "Three.js / WebGL", level: "Proficient", desc: "Interactive 3D web experiences, shaders, lighting, camera rigs" }
      ]
    },
    {
      category: "Programming Languages",
      icon: "code",
      items: [
        { name: "C++", level: "Core", desc: "Object-oriented design, memory management, data structures" },
        { name: "C#", level: "Core", desc: "Gameplay programming, Unity API, event systems" },
        { name: "JavaScript / ES6+", level: "Proficient", desc: "Modern asynchronous web apps, Web Audio, 3D math" },
        { name: "Python", level: "Intermediate", desc: "Scripting, algorithm prototyping, automation" }
      ]
    },
    {
      category: "3D Graphics & Animation",
      icon: "cube",
      items: [
        { name: "3D Mathematics", level: "Core", desc: "Vectors, matrices, quaternions, coordinate spaces, raycasting" },
        { name: "Blender Pipeline", level: "Intermediate", desc: "Low-poly modeling, UV unwrapping, material assignment" },
        { name: "Character Rigging & Animation", level: "Specialization", desc: "Keyframe animation, skeletal rigs, walk cycles, blend trees" },
        { name: "Lighting & VFX", level: "Intermediate", desc: "Particle systems, post-processing, atmospheric lighting" }
      ]
    },
    {
      category: "Tools & Methodologies",
      icon: "wrench",
      items: [
        { name: "Git & GitHub", level: "Proficient", desc: "Branching workflows, version control, open-source collaboration" },
        { name: "Game Design & Prototyping", level: "Specialization", desc: "Core gameplay loops, level pacing, mechanic balancing" },
        { name: "Vercel / Web Deployment", level: "Proficient", desc: "Continuous deployment, static web hosting" }
      ]
    }
  ],

  // Data-driven projects list
  projects: [
    {
      id: "project-space-journey",
      title: "Interactive 3D Space Journey",
      category: "Web3D / Three.js",
      featured: true,
      tag: "Live Interactive",
      summary: "A real-time third-person 3D planetary exploration portfolio built with Three.js, procedural atmospheric shaders, and dynamic responsive HUD.",
      details: "Engineered from scratch using pure HTML5, CSS3, ES modules, and Three.js. Features custom third-person camera physics, smooth quaternion character rotation, interactive orbital stations, starfield particle simulations, and a grounded AI companion droid.",
      technologies: ["Three.js", "JavaScript (ES6+)", "WebGL", "HTML5/CSS3", "Web Audio API"],
      links: {
        demo: "#",
        code: "https://github.com/your-username/Personal-Portfolio"
      },
      stats: {
        engine: "Three.js WebGL",
        perspective: "Third-Person Orbit",
        status: "Active"
      }
    },
    {
      id: "project-gameplay-prototype",
      title: "3D Platformer & Mechanics Prototype",
      category: "Game Development",
      featured: true,
      tag: "Gameplay Mechanics",
      summary: "A character movement and level traversal system focusing on kinetic feel, coyote-time jumping, and dynamic obstacle interaction.",
      details: "Developed as part of Gaming & Animation studies to explore game feel, tight responsive controls, collision resolution, and state machine architecture for player character locomotion.",
      technologies: ["C#", "Unity / Custom Engine", "3D Physics", "State Machines"],
      links: {
        demo: "#",
        code: "#"
      },
      stats: {
        engine: "Unity / C#",
        mechanics: "Kinetic Locomotion",
        status: "Prototype"
      }
    },
    {
      id: "project-animation-study",
      title: "Skeletal Rigging & Walk-Cycle Study",
      category: "Animation & Modeling",
      featured: true,
      tag: "3D Animation",
      summary: "Study on biomechanical motion, weight shifts, and kinematic transitions for bipedal and creature models.",
      details: "Created modular skeletal rigs with inverse kinematics (IK) controls, weight painting for smooth deformation without clipping, and seamless idle-to-walk animation blend trees.",
      technologies: ["Blender", "Rigging / IK", "Skeletal Deformation", "GLTF Pipeline"],
      links: {
        demo: "#",
        code: "#"
      },
      stats: {
        focus: "Biomechanical Motion",
        format: "GLTF / FBX",
        status: "Completed Study"
      }
    },
    {
      id: "project-procedural-world",
      title: "Procedural Celestial Generation",
      category: "Graphics & Math",
      featured: false,
      tag: "3D Graphics",
      summary: "Algorithmic generation of celestial bodies, asteroid belts, and planetary surface materials using mathematical noise functions.",
      details: "Implemented custom noise algorithms to distribute orbital debris rings, compute surface elevations, and shade extraterrestrial atmospheres with gradient Fresnel fresnel effects.",
      technologies: ["Three.js", "GLSL Shaders", "Procedural Math", "Particle Systems"],
      links: {
        demo: "#",
        code: "#"
      },
      stats: {
        technique: "Perlin/Simplex Noise",
        performance: "60 FPS WebGL",
        status: "Research"
      }
    }
  ]
};
