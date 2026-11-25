/**
 * Rafia Gull - Portfolio Structured Data Source
 * 
 * ============================================================================
 * HOW TO MANAGE PROJECTS:
 * ============================================================================
 * To ADD, REMOVE, or UPDATE a project, edit the `projects` array below.
 * Both `projects.html`, the in-scene 3D modals, and the ASTRA AI chatbot will
 * automatically update without requiring changes to any HTML or 3D scene code!
 * 
 * PROJECT RECORD SCHEMA:
 * - id          : (String) Unique, URL-safe identifier (e.g. 'vr-games-hub')
 * - title       : (String) Display title of the project
 * - category    : (String) Primary category ('VR', '3D Games', '2D Games', 'C++ Games', 'Python Apps')
 * - technologies: (Array<String>) List of tools/languages/engines used
 * - summary     : (String) Short 1-2 sentence description for cards
 * - details     : (String) Detailed technical breakdown of the project
 * - contribution: (String | null) Your specific role and contributions
 * - githubUrl   : (String | null) GitHub repo link; set to null or '' to cleanly hide
 * - linkedinUrl : (String | null) LinkedIn post/demo link; set to null or '' to cleanly hide
 * - videoUrl    : (String | null) Video embed/file URL (e.g. './assets/videos/demo.mp4' or YouTube embed)
 * - thumbnail   : (String | null) Card image (e.g. './assets/thumbnails/project-preview.png')
 * - featured    : (Boolean) Whether to feature prominently
 * - order       : (Number) Integer ordering in the project catalog
 * 
 * WHERE TO PLACE ASSETS:
 * - Thumbnail images: Place in `./assets/thumbnails/` and reference as `./assets/thumbnails/<filename>`
 * - Video demos     : Place in `./assets/videos/` and reference as `./assets/videos/<filename>`
 * - 3D Avatar model : Place in `./assets/avatar.glb` and configure in `avatarConfig.js`
 * ============================================================================
 */

export const skillOrbitGroups = [
  { label: 'Programming', names: ['C#', 'C++', 'C', 'Python'] },
  { label: 'Engines and Frameworks', names: ['Unity', 'Unreal Engine', 'SDL2'] },
  { label: '3D and Motion Tools', names: ['Blender', 'Adobe After Effects'] },
  { label: 'Databases', names: ['MySQL'] },
  { label: 'UI', names: ['PyQt5', 'Unity UI Toolkit', 'Pygame UI'] },
  { label: 'Other Skills', names: ['Debugging', 'Problem Solving', 'Idea Generation'] }
];

export const portfolioData = {
  profile: {
    name: "Rafia Gull",
    role: "Aspiring Game Developer",
    university: "NED University",
    location: "Karachi, Pakistan",
    summary: "Computer Science student at NED University specializing in Gaming and Animation. Experience delivering 2D, 3D, and VR projects using Unity and Unreal Engine, with additional projects in Python and C++.",
    bio: [
      "I am a Computer Science student at NED University in Karachi, Pakistan, specializing in Gaming and Animation.",
      "My hands-on experience spans delivering 2D, 3D, and immersive VR projects using Unity and Unreal Engine, along with foundational software and games engineered in Python and C++.",
      "I focus on core gameplay mechanics, character animation, physics systems, and interactive problem solving."
    ],
    // Contact & social links
    // Email is currently a placeholder from resume until user confirms real email
    // GitHub and LinkedIn are omitted until valid URLs are provided
    contact: {
      email: "abc@gmail.com",
      isEmailPlaceholder: true,
      githubUrl: "https://github.com/RafiaSajid",    // Set to valid URL when ready (e.g. "https://github.com/username")
      linkedinUrl: "https://www.linkedin.com/in/rafia-gull-495bb82ba/",  // Set to valid URL when ready (e.g. "https://linkedin.com/in/username")
      itchUrl: null,      // Optional itch.io profile
      location: "Karachi, Pakistan"
    }
  },

  // Academic Education
  education: {
    institution: "NED University",
    location: "Karachi, Pakistan",
    degree: "Bachelor of Science in Computer Science",
    specialization: "Specialization in Gaming and Animation",
    status: "Currently studying",
    summary: "Comprehensive Computer Science degree program with dedicated specialization coursework in Gaming and Animation."
  },

  // Certifications
  certifications: [
    {
      id: "cert-unreal",
      title: "Unreal Course",
      issuer: "CEGA",
      topics: "Practical game development and visualization."
    },
    {
      id: "cert-pre-production",
      title: "Pre-Production Course",
      issuer: "CEGA",
      topics: "Story writing, character design, storyboarding, prop design, and environment design."
    }
  ],

  // Skills categorized strictly from resume
  skills: [
    {
      category: "Programming Languages",
      icon: "code",
      items: [
        { name: "C#", level: "Proficient", desc: "Gameplay scripting, object-oriented systems, and Unity programming." },
        { name: "C++", level: "Core", desc: "Algorithms, efficient data structures, custom game loops, and Minimax AI." },
        { name: "C", level: "Foundational", desc: "Low-level programming fundamentals and procedural logic." },
        { name: "Python", level: "Proficient", desc: "Application development, desktop GUIs with PyQt5, and web apps with Streamlit." }
      ]
    },
    {
      category: "Game Engines & Frameworks",
      icon: "gamepad",
      items: [
        { name: "Unity", level: "Proficient", desc: "2D and 3D gameplay, VR interaction, physics, dialogue systems, and UI Toolkit." },
        { name: "Unreal Engine", level: "Practical", desc: "Certified by CEGA. Level creation, visualization, 3D gameplay, and health systems." },
        { name: "SDL2", level: "Core", desc: "2D graphics rendering, event handling, and game development in C++." },
        { name: "PyQt5", level: "Proficient", desc: "Desktop application development, custom widgets, and database integration." }
      ]
    },
    {
      category: "Tools & Software",
      icon: "cube",
      items: [
        { name: "Blender", level: "Practical", desc: "3D animated character creation, modeling, and asset preparation for game engines." },
        { name: "Adobe After Effects", level: "Practical", desc: "Visual motion graphics, visual effects, and post-production animation." }
      ]
    },
    {
      category: "Database & UI Skills",
      icon: "database",
      items: [
        { name: "MySQL", level: "Practical", desc: "Relational database schema design and integration for application data persistence." },
        { name: "PyQt5 UI", level: "Proficient", desc: "Desktop user interface design, custom styling, and layout management." },
        { name: "Unity UI Toolkit", level: "Practical", desc: "In-game heads-up displays, dialog menus, and UI components." },
        { name: "Pygame UI", level: "Practical", desc: "Interactive 2D interfaces and lightweight graphics loops." }
      ]
    },
    {
      category: "Core Competencies",
      icon: "sparkles",
      items: [
        { name: "Debugging", level: "Core", desc: "Identifying root causes, resolving logic errors, and optimizing runtime stability." },
        { name: "Problem Solving", level: "Core", desc: "Algorithmic thinking, Minimax decision trees, and efficient data structures." },
        { name: "Idea Generation", level: "Creative", desc: "Storyboarding, character design, game concept ideation, and puzzle mechanics." }
      ]
    }
  ],

  // Scattered home-space landmarks. Portals lead to the Projects and Skills regions.
  landmarks: [
    {
      id: "about",
      title: "About Me",
      label: "ABOUT ME",
      code: "LM-01",
      subtitle: "NED University • Gaming & Animation",
      position: { x: -22, y: 1.5, z: -17 },
      targetZ: -12,
      color: 0x8b5cf6,
      glowColor: "#a855f7",
      type: "about",
      actionText: "Enter About Station Portal",
      // description: "Explore the walkable orbital research station and archive covering studies at NED University, VR development, and 3D character animation."
    },
    {
      id: "projects",
      title: "Projects",
      label: "PROJECTS",
      code: "LM-02",
      subtitle: "2D, 3D, VR, Python & C++",
      position: { x: 26, y: 1.8, z: -11 },
      targetZ: -6,
      color: 0x0ea5e9,
      glowColor: "#38bdf8",
      type: "projects",
      actionText: "Enter Projects Portal",
      // description: "Explore 7 projects spanning Unity VR, Unreal Engine 3D, Unity 2D, Python apps, and C++ games."
    },
    {
      id: "education",
      title: "Education",
      label: "EDUCATION",
      code: "LM-03",
      subtitle: "NED University & CEGA Certifications",
      position: { x: 12, y: 1.5, z: 34 },
      targetZ: 39,
      color: 0x10b981,
      glowColor: "#34d399",
      type: "education",
      actionText: "View Education & Certifications",
      // description: "Academic studies at NED University and practical certifications by CEGA."
    },
    {
      id: "skills",
      title: "Skills",
      label: "SKILLS",
      code: "LM-04",
      subtitle: "Languages, Engines, Tools & DB",
      position: { x: -32, y: 1.6, z: 23 },
      targetZ: 28,
      color: 0xf59e0b,
      glowColor: "#fbbf24",
      type: "skills",
      actionText: "Enter Skills Portal",
      // description: "Skill breakdown across C#, C, C++, Python, Unity, Unreal Engine, Blender, and MySQL."
    }
  ],

  // Structured Projects Catalog (Exact 7 projects from resume)
  projects: [
    {
      id: "vr-games-hub",
      title: "VR Games Hub",
      category: "VR",
      technologies: ["Unity", "VR"],
      summary: "A VR project featuring a 3D city environment and multiple mini-games.",
      details: "A comprehensive virtual reality project developed in Unity featuring a sprawling 3D city environment and multiple interactive mini-games.",
      contribution: "Built the target-shooting experience, immersive environment, haptic gun feedback, a scoring system that increases on target hits and decreases on misses, and teleportation to the main scene.",
      githubUrl: null,
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: null,
      featured: true,
      order: 1
    },
    {
      id: "eat-right-run",
      title: "Eat Right Run",
      category: "3D Games",
      technologies: ["Unreal Engine", "3D", "Blender"],
      summary: "A level-based 3D runner about eating the right food at the right time, with a relaxing environment and health system.",
      details: "A level-based 3D runner built in Unreal Engine about eating the right food at the right time, featuring a relaxing environment and an interactive health system dynamically affected by dietary choices.",
      contribution: "Created an animated character in Blender, implemented core game logic, and helped debug the project.",
      githubUrl: null,
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: null,
      featured: true,
      order: 2
    },
    {
      id: "the-parallel-eclipse",
      title: "The Parallel Eclipse",
      category: "2D Games",
      technologies: ["Unity", "C#", "2D"],
      summary: "A narrative mystery-adventure game set in a parallel world after a rare lunar eclipse.",
      details: "A narrative mystery-adventure game set in a parallel world after a rare lunar eclipse. It features an interactive health system, combat scenes, NPC interactions, a word-scramble puzzle, and an branching dialogue system.",
      contribution: "Implemented the dialogue system, built the starting world and level 1, and debugged game logic.",
      githubUrl: "https://github.com/RafiaSajid/ParallelEclipse",
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: "./assets/thumbnails/splash.jpg",
      featured: true,
      order: 3
    },
    {
      id: "parallax-the-space-of-space",
      title: "Parallax: The Space of Space",
      category: "3D Web Games",
      technologies: ["Three.js", "HTML", "CSS"],
      summary: "A level-based 3D puzzle about eating the right food at the right time, with a relaxing environment and health system.",
      details: "A level-based 3D puzzle built in Three.js about eating the right food at the right time, featuring a relaxing environment and an interactive health system dynamically affected by dietary choices.",
      contribution: "Created an animated character in Blender, implemented core game logic, and helped debug the project.",
      githubUrl: "https://github.com/RafiaSajid/Parallax-Game",
      linkedinUrl: null,
      videoUrl: "https://space-parallax-game-a4.netlify.app/index.html",
      thumbnail: "./assets/thumbnails/space-splash.png",
      featured: true,
      order: 4
    },
    {
      id: "3D Charcter",
      title: "3D Character",
      category: "3D Modeling",
      technologies: ["Blender", "3D"],
      summary: "3D characters model created using Blender, featuring detailed textures and animations.",
      details: "3D characters model created using Blender, featuring detailed textures, rigging, and animations.",
      contribution: "Designed and modeled the character, implemented textures, and created animations.",
      githubUrl: "https://github.com/RafiaSajid/3D-Character",
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: "./assets/thumbnails/3d-character.png",
      featured: true,
      order: 5
    },

    {
      id: "vr-experience",
      title: "VR Experience",
      category: "Virtual Reality",
      technologies: ["Unity", "C#", "VR"],
      summary: "An immersive virtual reality experience that allows users to explore Narnia Battle environment and interact with 3D objects.",
      details: "An immersive virtual reality experience built in Unity, featuring interactive 3D environments, physics-based interactions, and a user-friendly interface.",
      contribution: "Designed and implemented the core VR mechanics, and optimized performance for smooth gameplay.",
      githubUrl: "https://github.com/RafiaSajid/VRExperience",
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: "./assets/thumbnails/narnia-splash.png",
      featured: true,
      order: 6
    },


    {
      id: "study-buddy",
      title: "Study Buddy",
      category: "Python Apps",
      technologies: ["Python", "Streamlit"],
      summary: "A student-learning web application with learner matching, summaries, AI quiz generation, and collaboration tools.",
      details: "A student-learning web application built using Python and Streamlit with learner matching based on personality and skills, concept explanations, summaries, AI quiz generation, PDF uploads, and collaboration tools.",
      contribution: "Contributed to the development of the AI quiz generation feature.",
      githubUrl: null,
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: null,
      featured: false,
      order: 7
    },
    {
      id: "study-planner-tracker",
      title: "Study Planner and Tracker App",
      category: "Python Apps",
      technologies: ["Python", "PyQt5", "MySQL"],
      summary: "A desktop study planner with flashcards, notes, to-do lists, and an AI-powered chatbot for study questions.",
      details: "A desktop study planner application built with Python, PyQt5, and MySQL, featuring flashcards, notes, to-do lists, and an AI-powered chatbot for answering study questions.",
      contribution: "Built a feature-rich to-do list with options for tasks, topics, and subjects.",
      githubUrl: null,
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: null,
      featured: false,
      order: 8
    },
    {
      id: "cherrysweeper",
      title: "Cherrysweeper",
      category: "C++ Games",
      technologies: ["C++", "SDL2"],
      summary: "A Minesweeper-style game for a C++ game suite, with efficient data structures and real-time scoring.",
      details: "A Minesweeper-style game developed as part of a C++ game suite, implemented with efficient data structures, recursive algorithms, real-time scoring, and an active timer.",
      contribution: "Implemented the core game logic and optimized performance for smooth gameplay.",
      githubUrl: null,
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: null,
      featured: false,
      order: 9
    },
    {
      id: "tic-tac-toe",
      title: "Tic Tac Toe",
      category: "C++ Games",
      technologies: ["C++"],
      summary: "A game built with object-oriented programming, a Minimax AI opponent, and a two-player mode.",
      details: "A strategic game built using object-oriented programming in C++, featuring an unbeatable Minimax AI opponent algorithm alongside a local two-player mode.",
      contribution: "Designed and implemented the game logic and user interface.",
      githubUrl: null,
      linkedinUrl: null,
      videoUrl: null,
      thumbnail: null,
      featured: false,
      order: 10
    }
  ]
};
